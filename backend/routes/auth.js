const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const {
  validateEmail,
  validatePassword,
  validateEmployeeId,
  validateRole
} = require('../utils/validation');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user (employee or HR)
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { employeeId, email, password, role } = req.body;

    // 1. Validate inputs existence and formats
    if (!employeeId || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (employeeId, email, password, role) are required.' });
    }

    if (!validateEmployeeId(employeeId)) {
      return res.status(400).json({ 
        error: 'Invalid Employee ID format. It must be alphanumeric (dashes/underscores allowed) and between 3 and 20 characters.' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid Email format.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password is too weak. It must be at least 8 characters long, containing an uppercase letter, a lowercase letter, a number, and a special character.' 
      });
    }

    if (!validateRole(role)) {
      return res.status(400).json({ error: 'Invalid role. Role must be either "employee" or "hr".' });
    }

    // 2. Check if employeeId is already registered
    const { data: existingEmpProfile, error: empFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (empFetchError) {
      console.error('Database error checking employee ID:', empFetchError);
      return res.status(500).json({ error: 'Database verification failed.' });
    }

    if (existingEmpProfile) {
      return res.status(400).json({ error: 'Employee ID is already registered.' });
    }

    // 3. Check if email is already registered in profiles
    const { data: existingEmailProfile, error: emailFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (emailFetchError) {
      console.error('Database error checking email:', emailFetchError);
      return res.status(500).json({ error: 'Database verification failed.' });
    }

    if (existingEmailProfile) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // 4. Register the user via Supabase Auth
    // Using the anon client triggers Supabase's standard sign-up flow (e.g. email verification)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
    });

    if (signUpError) {
      console.error('Supabase Auth error during signup:', signUpError);
      return res.status(400).json({ error: signUpError.message });
    }

    const authUser = signUpData.user;
    if (!authUser) {
      return res.status(400).json({ error: 'User registration failed, no user returned.' });
    }

    // 5. Create corresponding profile record using the service role client
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.id,
        employee_id: employeeId,
        role: role.toLowerCase(),
        email: email.toLowerCase()
      });

    if (profileError) {
      console.error('Profile insertion error, cleaning up auth user:', profileError);
      // Rollback Auth user registration to prevent orphan auth records
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      } catch (cleanupErr) {
        console.error('Failed to clean up auth user after profile insertion failure:', cleanupErr);
      }
      return res.status(500).json({ error: 'Registration failed: could not create user profile.' });
    }

    // 6. Respond successfully
    return res.status(201).json({
      message: 'Account created successfully. Please verify your email before signing in.',
      user: {
        id: authUser.id,
        employeeId,
        email: authUser.email,
        role: role.toLowerCase()
      }
    });

  } catch (err) {
    console.error('Server error during signup:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again later.' });
  }
});

/**
 * @route   POST /api/auth/signin
 * @desc    Authenticate user & get session
 * @access  Public
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs existence
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid Email format.' });
    }

    // 2. Sign in via Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (signInError) {
      console.error('Supabase Auth error during signin:', signInError);
      // Give descriptive feedback if email is not confirmed
      if (signInError.message && signInError.message.toLowerCase().includes('confirm')) {
        return res.status(400).json({ 
          error: 'Please verify your email address before signing in.' 
        });
      }
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const sessionUser = signInData.user;
    if (!sessionUser) {
      return res.status(400).json({ error: 'Login failed, user session not found.' });
    }

    // 3. Fetch corresponding profile metadata from profiles table
    const { data: profile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('employee_id, role')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (profileFetchError) {
      console.error('Database error fetching profile during signin:', profileFetchError);
      return res.status(500).json({ error: 'Database verification failed.' });
    }

    // 4. Respond successfully with user details and tokens
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
        employeeId: profile ? profile.employee_id : null,
        role: profile ? profile.role : 'employee'
      }
    });

  } catch (err) {
    console.error('Server error during signin:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again later.' });
  }
});

module.exports = router;
