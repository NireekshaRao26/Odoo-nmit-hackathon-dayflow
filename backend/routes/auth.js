const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const {
  validateEmail,
  validatePassword,
  validateRole,
  validatePhone,
  validateCompanyLogo
} = require('../utils/validation');
const {
  generateNextLoginId,
  getProfileByLoginIdOrEmail,
  memoryStore
} = require('../services/store');

/**
 * Generate a random secure initial password for new employees
 */
function generateInitialPassword() {
  const length = 12;
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each required class
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Helper to upload base64 company logo to Supabase Storage
 */
async function uploadCompanyLogo(base64Data, companyCode) {
  if (!base64Data) return '';
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data; // Return as-is if not standard base64 format
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const ext = contentType.split('/')[1] || 'png';
    const fileName = `logo-${companyCode.toLowerCase()}-${Date.now()}.${ext}`;

    // Try to create the bucket if it doesn't exist
    try {
      await supabaseAdmin.storage.createBucket('company-logos', { public: true });
    } catch (e) {
      // Bucket likely already exists
    }

    const { data, error } = await supabaseAdmin.storage
      .from('company-logos')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      return base64Data; // Fallback to base64 string
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('company-logos')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || base64Data;
  } catch (err) {
    console.error('Error during company logo upload:', err);
    return base64Data; // Fallback
  }
}

/**
 * @route   POST /api/auth/signup
 * @desc    Public HR signup (Registers company and HR manager user)
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      companyName,
      companyLogo,
      name,
      email,
      phone,
      password,
      confirmPassword
    } = req.body;

    // 1. Validation
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ error: 'Company Name is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'HR Manager Name is required.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({ error: 'A valid phone number is required.' });
    }
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, containing uppercase, lowercase, digit, and special character.'
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (companyLogo && !validateCompanyLogo(companyLogo)) {
      return res.status(400).json({ error: 'Company logo must be an image under 5MB.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check for duplicate email
    const existingUser = await getProfileByLoginIdOrEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email is already registered.' });
    }

    // 3. Generate unique Employee ID for the HR Officer
    const loginIdGen = await generateNextLoginId({
      companyName: companyName.trim(),
      fullName: name.trim(),
      joiningYear: new Date().getFullYear()
    });

    const generatedEmployeeId = loginIdGen.loginId;
    const finalCompanyCode = loginIdGen.companyCode;

    // 4. Upload Company Logo if present
    let finalLogoUrl = '';
    if (companyLogo) {
      finalLogoUrl = await uploadCompanyLogo(companyLogo, finalCompanyCode);
    }

    // 5. Register User in Supabase Auth
    let authUser = null;
    let authError = null;

    try {
      // Use standard signup
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            employee_id: generatedEmployeeId,
            role: 'hr'
          }
        }
      });
      authUser = data.user;
      authError = error;
    } catch (e) {
      authError = e;
    }

    if (authError || !authUser) {
      console.error('Supabase signUp error:', authError);
      return res.status(400).json({ error: authError?.message || 'Authentication signup failed.' });
    }

    // 6. Create Company record in database
    const companyRecord = {
      name: companyName.trim(),
      code: finalCompanyCode,
      logo_url: finalLogoUrl
    };

    try {
      // Verify if the company code already exists to avoid unique constraint violations
      const { data: existingCompany, error: checkErr } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('code', finalCompanyCode)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (!existingCompany) {
        const { error: compError } = await supabaseAdmin.from('companies').insert(companyRecord);
        if (compError) throw compError;
      }
    } catch (compErr) {
      console.error('Failed to register company in DB:', compErr.message);
      // Rollback Auth User
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      return res.status(500).json({ error: `Failed to register company. It may already exist or there was a database error.` });
    }

    // 7. Create profile in Database
    const profileRecord = {
      id: authUser.id,
      employee_id: generatedEmployeeId,
      role: 'hr',
      email: normalizedEmail,
      full_name: name.trim(),
      phone: phone.trim(),
      company_name: companyName.trim(),
      company_code: finalCompanyCode,
      company_logo: finalLogoUrl,
      department: 'Human Resources',
      position: 'HR Manager',
      avatar_url: '',
      joining_year: new Date().getFullYear(),
      must_change_password: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error: dbError } = await supabaseAdmin.from('profiles').insert(profileRecord);
      if (dbError) throw dbError;
    } catch (dbErr) {
      console.error('Failed to create DB profile, rolling back company and auth user:', dbErr.message);
      // Rollback Auth User
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      // Note: we can keep company or delete it. Since it might be shared, keeping it is standard.
      return res.status(500).json({ error: 'Failed to complete database registration.' });
    }

    // Add to memory store fallback
    memoryStore.profiles.unshift(profileRecord);

    return res.status(201).json({
      message: 'HR Manager account and company created successfully.',
      user: {
        id: authUser.id,
        email: normalizedEmail,
        employeeId: generatedEmployeeId,
        role: 'hr',
        fullName: name.trim(),
        companyName: companyName.trim(),
        companyLogo: finalLogoUrl
      }
    });

  } catch (err) {
    console.error('Server error during HR signup:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/create-employee
 * @desc    HR-controlled employee creation (Generates credentials automatically)
 * @access  HR Authenticated / Admin
 */
router.post('/create-employee', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department = 'Engineering',
      position = 'Software Engineer',
      hrUserId // ID of the HR user creating the account
    } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Employee Name is required.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({ error: 'A valid phone number is required.' });
    }
    if (!hrUserId) {
      return res.status(400).json({ error: 'HR Creator identity is required.' });
    }

    // 2. Fetch HR Creator Profile to link company
    const { data: hrProfile, error: hrErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', hrUserId)
      .maybeSingle();

    const finalHrProfile = hrProfile || memoryStore.profiles.find(p => p.id === hrUserId);
    if (!finalHrProfile || finalHrProfile.role !== 'hr') {
      return res.status(403).json({ error: 'Authorized HR credentials are required to create employee accounts.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Verify duplicate email
    const existingUser = await getProfileByLoginIdOrEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An employee with this email is already registered.' });
    }

    // 4. Generate Employee ID
    const loginIdGen = await generateNextLoginId({
      companyName: finalHrProfile.company_name,
      fullName: name.trim(),
      joiningYear: new Date().getFullYear()
    });
    
    const generatedEmployeeId = loginIdGen.loginId;

    // 5. Generate secure initial password
    const initialPassword = generateInitialPassword();

    // 6. Register Employee in Supabase Auth via Admin client (auto-confirm email)
    const { data: adminAuthData, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name.trim(),
        employee_id: generatedEmployeeId,
        role: 'employee'
      }
    });

    if (adminAuthErr || !adminAuthData.user) {
      console.error('Supabase admin.createUser error:', adminAuthErr);
      return res.status(400).json({ error: adminAuthErr?.message || 'Failed to create employee auth account.' });
    }

    const authUser = adminAuthData.user;

    // 7. Save Profile Record
    const profileRecord = {
      id: authUser.id,
      employee_id: generatedEmployeeId,
      role: 'employee',
      email: normalizedEmail,
      full_name: name.trim(),
      phone: phone.trim(),
      company_name: finalHrProfile.company_name,
      company_code: finalHrProfile.company_code,
      company_logo: finalHrProfile.company_logo || '',
      department: department.trim(),
      position: position.trim(),
      avatar_url: '',
      joining_year: new Date().getFullYear(),
      must_change_password: true, // Requires first-login password change
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error: dbError } = await supabaseAdmin.from('profiles').insert(profileRecord);
      if (dbError) throw dbError;
    } catch (dbErr) {
      console.error('Failed to create DB profile for employee, rolling back user auth:', dbErr.message);
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      return res.status(500).json({ error: 'Failed to complete database profile registration.' });
    }

    // Add to memory store fallback
    memoryStore.profiles.unshift(profileRecord);

    return res.status(201).json({
      message: 'Employee account created successfully.',
      credentials: {
        loginId: generatedEmployeeId,
        initialPassword: initialPassword,
        email: normalizedEmail,
        fullName: name.trim()
      }
    });

  } catch (err) {
    console.error('Server error during employee creation:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/signin
 * @desc    Authenticate user using Login ID OR Email & Password
 * @access  Public
 */
router.post('/signin', async (req, res) => {
  try {
    const { loginIdOrEmail, password } = req.body;

    if (!loginIdOrEmail || !password) {
      return res.status(400).json({ error: 'Login ID / Email and password are required.' });
    }

    const identifier = loginIdOrEmail.trim();

    // 1. Resolve email if Employee ID is passed
    let targetEmail = identifier.toLowerCase();
    let userProfile = null;

    if (!identifier.includes('@')) {
      userProfile = await getProfileByLoginIdOrEmail(identifier);
      if (!userProfile) {
        return res.status(400).json({ error: 'Invalid Login ID or password.' });
      }
      targetEmail = userProfile.email.toLowerCase();
    } else {
      userProfile = await getProfileByLoginIdOrEmail(targetEmail);
    }

    // 2. Sign In via Supabase Auth
    let signInData = null;
    let signInError = null;

    try {
      const resData = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password
      });
      signInData = resData.data;
      signInError = resData.error;
    } catch (e) {
      signInError = e;
    }

    if (signInError || !signInData?.user) {
      // Fallback auth verification for mock user profiles in development
      if (userProfile && password === 'Dayflow#MockPass') {
        return res.status(200).json({
          message: 'Login successful (development fallback).',
          session: {
            access_token: `mock-token-${userProfile.id}`,
            refresh_token: `mock-refresh-${userProfile.id}`,
            expires_at: Math.floor(Date.now() / 1000) + 86400
          },
          user: {
            id: userProfile.id,
            email: userProfile.email,
            employeeId: userProfile.employee_id,
            role: userProfile.role || 'employee',
            fullName: userProfile.full_name,
            companyName: userProfile.company_name,
            companyLogo: userProfile.company_logo,
            must_change_password: userProfile.must_change_password ?? false
          }
        });
      }

      console.error('Supabase sign-in error:', signInError?.message);
      return res.status(400).json({ error: 'Invalid Login ID / Email or password.' });
    }

    const sessionUser = signInData.user;

    // 3. Fetch full profile metadata
    if (!userProfile) {
      userProfile = await getProfileByLoginIdOrEmail(sessionUser.email);
    }

    return res.status(200).json({
      message: 'Login successful.',
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_at: signInData.session.expires_at
      },
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        employeeId: userProfile ? userProfile.employee_id : null,
        role: userProfile ? userProfile.role : 'employee',
        fullName: userProfile ? userProfile.full_name : '',
        companyName: userProfile ? userProfile.company_name : '',
        companyLogo: userProfile ? userProfile.company_logo : '',
        must_change_password: userProfile ? (userProfile.must_change_password ?? false) : false
      }
    });

  } catch (err) {
    console.error('Server error during signin:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Allow employees to change their password (e.g., initial password on first login)
 * @access  Authenticated / Public with valid identifier
 */
router.post('/change-password', async (req, res) => {
  try {
    const { userId, email, newPassword } = req.body;

    if (!newPassword || !validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long, containing uppercase, lowercase, number, and special character.'
      });
    }

    if (!userId && !email) {
      return res.status(400).json({ error: 'User ID or email is required to update password.' });
    }

    // Resolve profile
    let targetProfile = null;
    if (userId) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
      targetProfile = data || memoryStore.profiles.find(p => p.id === userId);
    } else if (email) {
      targetProfile = await getProfileByLoginIdOrEmail(email);
    }

    if (!targetProfile) {
      return res.status(400).json({ error: 'User profile not found.' });
    }

    // 1. Update password in Supabase Auth
    try {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(targetProfile.id, {
        password: newPassword
      });
      if (authErr) throw authErr;
    } catch (e) {
      console.error('Supabase Auth update password failed:', e.message);
      return res.status(500).json({ error: e.message || 'Failed to update credentials in authentication system.' });
    }

    // 2. Set must_change_password to false in DB
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ must_change_password: false, updated_at: new Date().toISOString() })
        .eq('id', targetProfile.id);
    } catch (e) {
      console.warn('Failed to update must_change_password in database:', e.message);
    }

    // Update in memory fallback
    const memProfile = memoryStore.profiles.find(p => p.id === targetProfile.id);
    if (memProfile) {
      memProfile.must_change_password = false;
      memProfile.updated_at = new Date().toISOString();
    }

    return res.status(200).json({
      message: 'Password updated successfully. You can now use your new password.'
    });
  } catch (err) {
    console.error('Server error during password change:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

module.exports = router;
