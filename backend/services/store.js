const { supabaseAdmin } = require('../config/supabase');

// Memory storage fallback
const memoryStore = {
  privateInfo: [],
  salaryInfo: [],
  profiles: [
    {
      id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      role: 'employee',
      email: 'john.doe@dayflow.com',
      full_name: 'John Doe',
      department: 'Engineering',
      phone: '+1 555-0192',
      position: 'Senior Software Engineer',
      avatar_url: '',
      company_name: 'Odoo India',
      company_code: 'OI',
      company_logo: '',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'emp-002-uuid',
      employee_id: 'EMP-002',
      role: 'employee',
      email: 'sarah.connor@dayflow.com',
      full_name: 'Sarah Connor',
      department: 'Product & Design',
      phone: '+1 555-0144',
      position: 'Product Designer',
      avatar_url: '',
      company_name: 'Odoo India',
      company_code: 'OI',
      company_logo: '',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'hr-001-uuid',
      employee_id: 'HR-001',
      role: 'hr',
      email: 'admin.hr@dayflow.com',
      full_name: 'Elena Rostova',
      department: 'Human Resources',
      phone: '+1 555-0100',
      position: 'HR Director',
      avatar_url: '',
      company_name: 'Odoo India',
      company_code: 'OI',
      company_logo: '',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    }
  ],
  attendance: [
    {
      id: 'att-101',
      user_id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      date: new Date().toISOString().split('T')[0],
      check_in: new Date(Date.now() - 4 * 3600000).toISOString(),
      check_out: null,
      work_hours: 4.0,
      status: 'checked-in',
      created_at: new Date().toISOString()
    },
    {
      id: 'att-102',
      user_id: 'emp-002-uuid',
      employee_id: 'EMP-002',
      date: new Date().toISOString().split('T')[0],
      check_in: new Date(Date.now() - 5 * 3600000).toISOString(),
      check_out: new Date(Date.now() - 1 * 3600000).toISOString(),
      work_hours: 4.0,
      status: 'present',
      created_at: new Date().toISOString()
    },
    {
      id: 'att-100',
      user_id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      check_in: new Date(Date.now() - 86400000 - 8 * 3600000).toISOString(),
      check_out: new Date(Date.now() - 86400000).toISOString(),
      work_hours: 8.0,
      status: 'present',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  leaveRequests: [
    {
      id: 'lr-201',
      user_id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      leave_type: 'Paid Leave',
      start_date: '2026-09-01',
      end_date: '2026-09-05',
      days_count: 5,
      reason: 'Annual family vacation leave',
      status: 'pending',
      reviewer_comments: '',
      applied_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      reviewed_at: null,
      reviewed_by: null
    },
    {
      id: 'lr-202',
      user_id: 'emp-002-uuid',
      employee_id: 'EMP-002',
      leave_type: 'Sick Leave',
      start_date: '2026-08-18',
      end_date: '2026-08-19',
      days_count: 2,
      reason: 'Mild fever and rest',
      status: 'approved',
      reviewer_comments: 'Approved. Get well soon!',
      applied_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      reviewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      reviewed_by: 'hr-001-uuid'
    }
  ],
  activityLogs: [
    {
      id: 'act-301',
      user_id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      type: 'attendance',
      title: 'Clocked In',
      description: 'Logged in for today\'s shift at ' + new Date(Date.now() - 4 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date(Date.now() - 4 * 3600000).toISOString()
    },
    {
      id: 'act-302',
      user_id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      type: 'leave',
      title: 'Submitted Leave Request',
      description: 'Requested 5 days of Paid Leave (2026-09-01 to 2026-09-05)',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'act-303',
      user_id: 'emp-001-uuid',
      employee_id: 'EMP-001',
      type: 'alert',
      title: 'Quarterly HR Review',
      description: 'Please ensure timesheets are updated before month end.',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ]
};

// Helper: Get Profile
async function getProfile(userId, employeeId) {
  try {
    let query = supabaseAdmin.from('profiles').select('*');
    if (userId) query = query.eq('id', userId);
    else if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query.maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    // DB fallback
  }

  const found = memoryStore.profiles.find(
    p => (userId && p.id === userId) || (employeeId && p.employee_id === employeeId)
  );
  if (found) return found;

  const newProf = {
    id: userId || `usr-${Date.now()}`,
    employee_id: employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    role: 'employee',
    email: 'user@dayflow.com',
    full_name: 'Employee User',
    department: 'Engineering',
    phone: '',
    position: 'Team Member',
    avatar_url: '',
    created_at: new Date().toISOString()
  };
  memoryStore.profiles.push(newProf);
  return newProf;
}

// Update Profile
async function updateProfile(userId, updateFields) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    // DB fallback
  }

  let prof = memoryStore.profiles.find(p => p.id === userId);
  if (!prof) {
    prof = { id: userId, employee_id: 'EMP-NEW', role: 'employee', email: 'user@dayflow.com', ...updateFields };
    memoryStore.profiles.push(prof);
  } else {
    Object.assign(prof, updateFields);
  }
  return prof;
}

// Get All Profiles (optionally scoped to a company)
async function getAllProfiles(companyCode) {
  try {
    let query = supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
    if (companyCode) query = query.eq('company_code', companyCode);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }
  if (companyCode) {
    return memoryStore.profiles.filter(p => p.company_code === companyCode);
  }
  return memoryStore.profiles;
}

// Get Today's Attendance Status
async function getTodayAttendance(userId, employeeId) {
  const offset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - offset).toISOString().split('T')[0];
  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('date', todayStr)
      .or(`user_id.eq.${userId},employee_id.eq.${employeeId}`)
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    // DB fallback
  }

  return memoryStore.attendance.find(
    a => a.date === todayStr && (a.user_id === userId || a.employee_id === employeeId)
  ) || null;
}

// Clock-In
async function clockIn(userId, employeeId) {
  const offset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - offset).toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  const existing = await getTodayAttendance(userId, employeeId);
  if (existing && existing.check_in && !existing.check_out) {
    return { error: 'You are already checked in for today.' };
  }

  const record = {
    id: `att-${Date.now()}`,
    user_id: userId,
    employee_id: employeeId,
    date: todayStr,
    check_in: nowIso,
    check_out: null,
    work_hours: 0,
    status: 'checked-in',
    created_at: nowIso
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert(record)
      .select()
      .single();
    if (!error && data) {
      await logActivity(userId, employeeId, 'attendance', 'Clocked In', `Checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      return { data };
    }
  } catch (e) {
    // DB fallback
  }

  // Check if existing record in memory needs updating
  const existingMemIndex = memoryStore.attendance.findIndex(
    a => a.date === todayStr && (a.user_id === userId || a.employee_id === employeeId)
  );
  if (existingMemIndex >= 0) {
    memoryStore.attendance[existingMemIndex] = record;
  } else {
    memoryStore.attendance.unshift(record);
  }

  await logActivity(userId, employeeId, 'attendance', 'Clocked In', `Checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  return { data: record };
}

// Clock-Out
async function clockOut(userId, employeeId) {
  const offset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - offset).toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  let todayRecord = await getTodayAttendance(userId, employeeId);
  if (!todayRecord || !todayRecord.check_in) {
    return { error: 'No active check-in record found for today.' };
  }

  const checkInTime = new Date(todayRecord.check_in).getTime();
  const checkOutTime = new Date(nowIso).getTime();

  // Resolve break hours from salary info (default 1.0)
  let breakHours = 1.0;
  try {
    const { data } = await supabaseAdmin.from('salary_info').select('break_hours').eq('id', userId).maybeSingle();
    if (data && data.break_hours !== undefined) {
      breakHours = Number(data.break_hours);
    } else {
      const memSalary = memoryStore.salaryInfo.find(s => s.id === userId);
      if (memSalary && memSalary.break_hours !== undefined) {
        breakHours = Number(memSalary.break_hours);
      }
    }
  } catch (e) {
    console.warn('Failed to fetch break hours from salary_info:', e.message);
  }

  const elapsed = Math.max(0, (checkOutTime - checkInTime) / 3600000);
  const workHours = Number((elapsed > breakHours ? elapsed - breakHours : elapsed).toFixed(2));

  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({
        check_out: nowIso,
        work_hours: workHours,
        status: 'present'
      })
      .eq('id', todayRecord.id)
      .select()
      .maybeSingle();
    if (!error && data) {
      await logActivity(userId, employeeId, 'attendance', 'Clocked Out', `Checked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${workHours} hrs logged)`);
      return { data };
    }
  } catch (e) {
    // DB fallback
  }

  const memRec = memoryStore.attendance.find(a => a.id === todayRecord.id || (a.user_id === userId && a.date === todayStr));
  if (memRec) {
    memRec.check_out = nowIso;
    memRec.work_hours = workHours;
    memRec.status = 'present';
  }
  await logActivity(userId, employeeId, 'attendance', 'Clocked Out', `Checked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${workHours} hrs logged)`);
  return { data: memRec || todayRecord };
}

// Get Attendance History
async function getUserAttendanceHistory(userId, employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .or(`user_id.eq.${userId},employee_id.eq.${employeeId}`)
      .order('date', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }

  return memoryStore.attendance
    .filter(a => a.user_id === userId || a.employee_id === employeeId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Get All Attendance (optionally scoped to a company)
async function getAllAttendance(date, search, companyCode) {
  try {
    let query = supabaseAdmin
      .from('attendance')
      .select('*, profiles:user_id(id, employee_id, full_name, email, role, avatar_url, position, department, company_code)');

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (!error && data) {
      let results = data;
      // Filter by company_code if provided
      if (companyCode) {
        results = results.filter(rec => rec.profiles?.company_code === companyCode);
      }
      // Filter by search on full_name, email, or employee_id
      if (search) {
        const q = search.toLowerCase().trim();
        results = results.filter(rec => {
          const empId = (rec.employee_id || '').toLowerCase();
          const fullName = (rec.profiles?.full_name || '').toLowerCase();
          const email = (rec.profiles?.email || '').toLowerCase();
          return empId.includes(q) || fullName.includes(q) || email.includes(q);
        });
      }
      return results;
    }
  } catch (e) {
    console.error('Error in getAllAttendance:', e);
  }

  // fallback to memoryStore
  let results = memoryStore.attendance;
  if (date) {
    results = results.filter(r => r.date === date);
  }

  // Join profiles for fallback representation
  results = results.map(rec => {
    const prof = memoryStore.profiles.find(p => p.id === rec.user_id || p.employee_id === rec.employee_id);
    return {
      ...rec,
      profiles: prof || null
    };
  });

  // Filter by company_code in memory fallback
  if (companyCode) {
    results = results.filter(rec => rec.profiles?.company_code === companyCode);
  }

  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(rec => {
      const empId = (rec.employee_id || '').toLowerCase();
      const fullName = (rec.profiles?.full_name || '').toLowerCase();
      const email = (rec.profiles?.email || '').toLowerCase();
      return empId.includes(q) || fullName.includes(q) || email.includes(q);
    });
  }

  return results;
}

// Apply Leave
async function applyLeave(leaveData) {
  const leaveFields = {
    user_id: leaveData.userId,
    employee_id: leaveData.employeeId,
    leave_type: leaveData.leaveType,
    start_date: leaveData.startDate,
    end_date: leaveData.endDate,
    days_count: Number(leaveData.daysCount || 1),
    reason: leaveData.reason,
    status: 'pending',
    reviewer_comments: '',
    attachment_url: leaveData.attachmentUrl || '',
    applied_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null
  };

  try {
    // Do NOT set 'id' — let Supabase auto-generate a valid UUID
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert(leaveFields)
      .select()
      .single();
    if (!error && data) {
      // Also sync to memory store with the DB-generated id
      memoryStore.leaveRequests.unshift(data);
      await logActivity(leaveData.userId, leaveData.employeeId, 'leave', 'Submitted Leave Request', `Applied for ${leaveFields.days_count} day(s) of ${leaveFields.leave_type}`);
      return { data };
    }
  } catch (e) {
    console.error('applyLeave DB insert error:', e.message || e);
  }

  // Memory-only fallback with a string id
  const memLeave = { id: `lr-${Date.now()}`, ...leaveFields };
  memoryStore.leaveRequests.unshift(memLeave);
  await logActivity(leaveData.userId, leaveData.employeeId, 'leave', 'Submitted Leave Request', `Applied for ${leaveFields.days_count} day(s) of ${leaveFields.leave_type}`);
  return { data: memLeave };
}

// Get User Leaves
async function getUserLeaves(userId, employeeId) {
  let dbResults = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .or(`user_id.eq.${userId},employee_id.eq.${employeeId}`)
      .order('applied_at', { ascending: false });
    if (!error && data) dbResults = data;
  } catch (e) {
    // DB fallback
  }

  // Merge memory-only leaves for this user
  const dbIds = new Set(dbResults.map(r => r.id));
  const memOnly = memoryStore.leaveRequests
    .filter(l => (l.user_id === userId || l.employee_id === employeeId) && !dbIds.has(l.id));

  return [...dbResults, ...memOnly]
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
}

// Get All Leaves (optionally scoped to a company)
async function getAllLeaves(companyCode) {
  let dbResults = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .select('*, profiles:user_id(id, employee_id, company_code)')
      .order('applied_at', { ascending: false });
    if (!error && data) {
      dbResults = data;
    }
  } catch (e) {
    // DB fallback
  }

  // Merge memory-only leaves that aren't in DB results
  const dbIds = new Set(dbResults.map(r => r.id));
  const memOnly = memoryStore.leaveRequests.filter(l => !dbIds.has(l.id));
  let results = [...dbResults, ...memOnly];

  if (companyCode) {
    const companyUserIds = new Set(
      memoryStore.profiles.filter(p => p.company_code === companyCode).map(p => p.id)
    );
    results = results.filter(r => {
      const profileCode = r.profiles?.company_code;
      if (profileCode) return profileCode === companyCode;
      // Fallback: check via user_id against company profiles
      return companyUserIds.has(r.user_id);
    });
  }
  return results;
}

// Update Leave Status
async function updateLeaveStatus(leaveId, status, comments, reviewerId) {
  const reviewedAt = new Date().toISOString();
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status,
        reviewer_comments: comments || '',
        reviewed_at: reviewedAt,
        reviewed_by: reviewerId
      })
      .eq('id', leaveId)
      .select()
      .maybeSingle();
    if (!error && data) {
      await logActivity(data.user_id, data.employee_id, 'leave', `Leave ${status.toUpperCase()}`, `Leave request from ${data.start_date} to ${data.end_date} was ${status}. Note: ${comments || 'None'}`);
      return { data };
    }
  } catch (e) {
    // DB fallback
  }

  const req = memoryStore.leaveRequests.find(l => l.id === leaveId);
  if (req) {
    req.status = status;
    req.reviewer_comments = comments || '';
    req.reviewed_at = reviewedAt;
    req.reviewed_by = reviewerId;
    await logActivity(req.user_id, req.employee_id, 'leave', `Leave ${status.toUpperCase()}`, `Leave request from ${req.start_date} to ${req.end_date} was ${status}. Note: ${comments || 'None'}`);
  }
  return { data: req };
}

// Log Activity
async function logActivity(userId, employeeId, type, title, description) {
  const act = {
    id: `act-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    user_id: userId,
    employee_id: employeeId,
    type,
    title,
    description,
    created_at: new Date().toISOString()
  };

  try {
    await supabaseAdmin.from('activity_logs').insert(act);
  } catch (e) {
    // DB fallback
  }

  memoryStore.activityLogs.unshift(act);
}

// Get User Activities
async function getUserActivities(userId, employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .or(`user_id.eq.${userId},employee_id.eq.${employeeId}`)
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }

  return memoryStore.activityLogs
    .filter(a => a.user_id === userId || a.employee_id === employeeId || a.type === 'alert' || a.type === 'system')
    .slice(0, 10);
}

/**
 * Automatically generates a Login ID matching format:
 * [First 2 letters of Company Name] + [First 2 letters of Employee First Name] + [First 2 letters of Employee Last Name] + [Year of Joining] + [4-digit serial number]
 * Example: OJTO20220001
 */
async function generateNextLoginId({ companyName, fullName, joiningYear }) {
  // 1. Company Name part: clean and take first 2 letters
  const cleanCompany = (companyName || 'OI').trim().replace(/[^a-zA-Z]/g, '');
  const compPart = cleanCompany.substring(0, 2).toUpperCase().padEnd(2, 'X');

  // 2. Employee Initials: first 2 letters of First name + first 2 letters of Last name
  const nameParts = (fullName || 'Employee').trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'EM';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

  const first2 = firstName.substring(0, 2).toUpperCase().padEnd(2, 'X');
  const last2 = lastName.substring(0, 2).toUpperCase().padEnd(2, 'X');
  const initials = `${first2}${last2}`;

  // 3. Joining Year part
  const year = joiningYear ? String(joiningYear) : String(new Date().getFullYear());

  let maxSerial = 0;

  // Query Supabase for existing profiles under this company code and year to determine next serial
  try {
    const { data: dbProfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('employee_id');
    if (!error && dbProfiles && dbProfiles.length > 0) {
      dbProfiles.forEach(p => {
        if (p.employee_id) {
          const regex = new RegExp(`^${compPart}.*?${year}(\\d{4})$`, 'i');
          const match = p.employee_id.match(regex);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSerial) maxSerial = num;
          }
        }
      });
    }
  } catch (e) {
    console.error('Supabase query error in generateNextLoginId:', e);
  }

  // Fallback memory check
  memoryStore.profiles.forEach(p => {
    if (p.employee_id) {
      const regex = new RegExp(`^${compPart}.*?${year}(\\d{4})$`, 'i');
      const match = p.employee_id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSerial) maxSerial = num;
      }
    }
  });

  let nextSerial = maxSerial + 1;
  let candidateId = `${compPart}${initials}${year}${String(nextSerial).padStart(4, '0')}`;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    candidateId = `${compPart}${initials}${year}${String(nextSerial).padStart(4, '0')}`;
    let existsInDb = false;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('employee_id', candidateId)
        .maybeSingle();
      if (!error && data) existsInDb = true;
    } catch (e) {}

    const existsInMem = memoryStore.profiles.some(
      p => p.employee_id && p.employee_id.toUpperCase() === candidateId.toUpperCase()
    );

    if (!existsInDb && !existsInMem) {
      isUnique = true;
    } else {
      nextSerial++;
      attempts++;
    }
  }

  return {
    loginId: candidateId,
    companyCode: compPart,
    initials,
    joiningYear: year,
    serialNumber: String(nextSerial).padStart(4, '0')
  };
}

/**
 * Look up profile by email OR Login ID (employee_id)
 */
async function getProfileByLoginIdOrEmail(identifier) {
  if (!identifier) return null;
  const str = identifier.trim().toLowerCase();

  try {
    const { data: byEmail, error: errEmail } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('email', str)
      .maybeSingle();
    if (!errEmail && byEmail) return byEmail;

    const { data: byEmpId, error: errEmp } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('employee_id', str)
      .maybeSingle();
    if (!errEmp && byEmpId) return byEmpId;
  } catch (e) {
    console.error('Supabase query error in getProfileByLoginIdOrEmail:', e);
  }

  return memoryStore.profiles.find(
    p => (p.email && p.email.toLowerCase() === str) || (p.employee_id && p.employee_id.toLowerCase() === str)
  ) || null;
}

// Get Private Info
async function getPrivateInfo(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('private_info')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    console.error('getPrivateInfo DB error:', e);
  }

  let info = memoryStore.privateInfo.find(p => p.id === userId);
  if (!info) {
    info = {
      id: userId,
      dob: null,
      address: '',
      nationality: '',
      personal_email: '',
      gender: '',
      marital_status: '',
      joining_date: new Date().toISOString().split('T')[0],
      bank_name: '',
      bank_account: '',
      ifsc_code: '',
      pan_number: '',
      uan_number: '',
      employee_code: ''
    };
    memoryStore.privateInfo.push(info);
  }
  return info;
}

// Update Private Info
async function updatePrivateInfo(userId, updateFields) {
  try {
    const { data, error } = await supabaseAdmin
      .from('private_info')
      .upsert({ id: userId, ...updateFields, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    console.error('updatePrivateInfo DB error:', e);
  }

  let info = memoryStore.privateInfo.find(p => p.id === userId);
  if (!info) {
    info = { id: userId, ...updateFields };
    memoryStore.privateInfo.push(info);
  } else {
    Object.assign(info, updateFields);
  }
  return info;
}

// Get Salary Info
async function getSalaryInfo(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('salary_info')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    console.error('getSalaryInfo DB error:', e);
  }

  let salary = memoryStore.salaryInfo.find(s => s.id === userId);
  if (!salary) {
    salary = {
      id: userId,
      wage_type: 'Fixed Wage',
      monthly_wage: 0,
      yearly_wage: 0,
      working_days_per_week: 5,
      break_hours: 1,
      pf_employee_rate: 12,
      pf_employer_rate: 12,
      professional_tax: 200,
      basic_salary_type: 'percentage',
      basic_salary_value: 50,
      hra_type: 'percentage',
      hra_value: 50,
      standard_allowance_type: 'fixed',
      standard_allowance_value: 0,
      performance_bonus_type: 'fixed',
      performance_bonus_value: 0,
      leave_travel_allowance_type: 'fixed',
      leave_travel_allowance_value: 0,
      fixed_allowance_type: 'fixed',
      fixed_allowance_value: 0
    };
    memoryStore.salaryInfo.push(salary);
  }
  return salary;
}

// Update Salary Info
async function updateSalaryInfo(userId, updateFields) {
  try {
    const { data, error } = await supabaseAdmin
      .from('salary_info')
      .upsert({ id: userId, ...updateFields, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    console.error('updateSalaryInfo DB error:', e);
  }

  let salary = memoryStore.salaryInfo.find(s => s.id === userId);
  if (!salary) {
    salary = { id: userId, ...updateFields };
    memoryStore.salaryInfo.push(salary);
  } else {
    Object.assign(salary, updateFields);
  }
  return salary;
}

// ============================================================
// LEAVE BALANCE FUNCTIONS
// ============================================================

const DEFAULT_ALLOCATIONS = {
  'Paid Time Off': 24,
  'Sick Leave': 12,
  'Unpaid Leave': 0
};

/**
 * Get or create a leave balance record for a user/type/year
 */
async function getOrCreateLeaveBalance(userId, employeeId, leaveType, year) {
  const currentYear = year || new Date().getFullYear();
  try {
    // Try to get existing
    const { data: existing, error: getErr } = await supabaseAdmin
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('leave_type', leaveType)
      .eq('year', currentYear)
      .maybeSingle();
    if (!getErr && existing) return existing;

    // Create if missing
    const allocated = DEFAULT_ALLOCATIONS[leaveType] || 0;
    const newBalance = {
      user_id: userId,
      employee_id: employeeId,
      leave_type: leaveType,
      allocated_days: allocated,
      used_days: 0,
      year: currentYear
    };
    const { data: created, error: createErr } = await supabaseAdmin
      .from('leave_balances')
      .insert(newBalance)
      .select()
      .single();
    if (!createErr && created) return created;
  } catch (e) {
    console.error('getOrCreateLeaveBalance error:', e.message);
  }
  // Memory fallback
  const allocated = DEFAULT_ALLOCATIONS[leaveType] || 0;
  return { user_id: userId, employee_id: employeeId, leave_type: leaveType, allocated_days: allocated, used_days: 0, year: currentYear };
}

/**
 * Get leave balances for a user (all 3 types)
 */
async function getLeaveBalances(userId, employeeId) {
  const year = new Date().getFullYear();
  const types = ['Paid Time Off', 'Sick Leave', 'Unpaid Leave'];
  const balances = [];
  for (const t of types) {
    const b = await getOrCreateLeaveBalance(userId, employeeId, t, year);
    balances.push(b);
  }
  return balances;
}

/**
 * Get leave balances for ALL employees (HR view, optionally scoped to a company)
 */
async function getAllLeaveBalances(companyCode) {
  const year = new Date().getFullYear();
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_balances')
      .select('*, profiles:user_id(id, employee_id, full_name, email, department, position, company_code)')
      .eq('year', year)
      .order('employee_id');
    if (!error && data) {
      if (companyCode) {
        return data.filter(b => b.profiles?.company_code === companyCode);
      }
      return data;
    }
  } catch (e) {
    console.error('getAllLeaveBalances error:', e.message);
  }
  return [];
}

/**
 * Deduct used days from a leave balance (called on approval)
 */
async function deductLeaveBalance(userId, employeeId, leaveType, daysToDeduct) {
  // Normalize leave type (Paid Leave → Paid Time Off)
  const normalizedType = leaveType === 'Paid Leave' ? 'Paid Time Off' : leaveType;
  if (normalizedType === 'Unpaid Leave') return; // No balance to deduct for unpaid
  if (!['Paid Time Off', 'Sick Leave'].includes(normalizedType)) return;

  const year = new Date().getFullYear();
  try {
    const { data: balance } = await supabaseAdmin
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('leave_type', normalizedType)
      .eq('year', year)
      .maybeSingle();

    if (balance) {
      const newUsed = (balance.used_days || 0) + daysToDeduct;
      await supabaseAdmin
        .from('leave_balances')
        .update({ used_days: newUsed, updated_at: new Date().toISOString() })
        .eq('id', balance.id);
    }
  } catch (e) {
    console.error('deductLeaveBalance error:', e.message);
  }
  const memBal = memoryStore.leaveBalances.find(b => (b.user_id === userId || b.employee_id === employeeId) && (b.leave_type === normalizedType || b.leave_type === leaveType));
  if (memBal) {
    memBal.used_days = (memBal.used_days || 0) + daysToDeduct;
  }
}

/**
 * Restore balance when a previously-approved leave is reversed (safety measure)
 */
async function restoreLeaveBalance(userId, employeeId, leaveType, daysToRestore) {
  const normalizedType = leaveType === 'Paid Leave' ? 'Paid Time Off' : leaveType;
  if (normalizedType === 'Unpaid Leave') return;
  if (!['Paid Time Off', 'Sick Leave'].includes(normalizedType)) return;

  const year = new Date().getFullYear();
  try {
    const { data: balance } = await supabaseAdmin
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('leave_type', normalizedType)
      .eq('year', year)
      .maybeSingle();

    if (balance) {
      const newUsed = Math.max(0, (balance.used_days || 0) - daysToRestore);
      await supabaseAdmin
        .from('leave_balances')
        .update({ used_days: newUsed, updated_at: new Date().toISOString() })
        .eq('id', balance.id);
    }
  } catch (e) {
    console.error('restoreLeaveBalance error:', e.message);
  }
  const memBal = memoryStore.leaveBalances.find(b => (b.user_id === userId || b.employee_id === employeeId) && (b.leave_type === normalizedType || b.leave_type === leaveType));
  if (memBal) {
    memBal.used_days = Math.max(0, (memBal.used_days || 0) - daysToRestore);
  }
}

/**
 * Update allocation for an employee (HR only)
 */
async function updateLeaveAllocation(userId, employeeId, leaveType, allocatedDays) {
  const year = new Date().getFullYear();
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_balances')
      .upsert({
        user_id: userId,
        employee_id: employeeId,
        leave_type: leaveType,
        allocated_days: allocatedDays,
        year,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,leave_type,year' })
      .select()
      .single();
    if (!error && data) return data;
  } catch (e) {
    console.error('updateLeaveAllocation error:', e.message);
  }
  return null;
}

// ============================================================
// OVERLAP DETECTION
// ============================================================

/**
 * Check if a new leave request overlaps with existing approved/pending requests
 */
async function checkLeaveOverlap(userId, startDate, endDate, excludeId) {
  try {
    let query = supabaseAdmin
      .from('leave_requests')
      .select('id, start_date, end_date, status, leave_type')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .lte('start_date', endDate)
      .gte('end_date', startDate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data[0];
  } catch (e) {
    console.error('checkLeaveOverlap error:', e.message);
  }
  // Memory fallback
  const overlap = memoryStore.leaveRequests.find(r => {
    if (r.user_id !== userId) return false;
    if (!['pending', 'approved'].includes(r.status)) return false;
    if (excludeId && r.id === excludeId) return false;
    return r.start_date <= endDate && r.end_date >= startDate;
  });
  return overlap || null;
}

// ============================================================
// ATTENDANCE INTEGRATION (upsert leave status for date range)
// ============================================================

/**
 * Calculate working days between two dates (excludes weekends)
 */
function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const current = new Date(start);
  while (current <= end) {
    const dow = current.getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return Math.max(1, count);
}

/**
 * Upsert attendance records as 'leave' for each working day in the date range
 */
async function upsertAttendanceForLeave(userId, employeeId, startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const current = new Date(start);

  while (current <= end) {
    const dow = current.getUTCDay();
    if (dow !== 0 && dow !== 6) { // Skip weekends
      const dateStr = current.toISOString().split('T')[0];
      try {
        const { data: existing } = await supabaseAdmin
          .from('attendance')
          .select('id, status')
          .eq('user_id', userId)
          .eq('date', dateStr)
          .maybeSingle();

        if (existing) {
          // Only update if not already checked in today (preserve active sessions)
          if (existing.status !== 'checked-in') {
            await supabaseAdmin
              .from('attendance')
              .update({ status: 'leave' })
              .eq('id', existing.id);
          }
        } else {
          await supabaseAdmin
            .from('attendance')
            .insert({
              user_id: userId,
              employee_id: employeeId,
              date: dateStr,
              check_in: null,
              check_out: null,
              work_hours: 0,
              status: 'leave'
            });
        }
      } catch (e) {
        console.error(`upsertAttendanceForLeave error for ${dateStr}:`, e.message);
      }

      // MemoryStore fallback sync
      let memAtt = memoryStore.attendance.find(a => (a.user_id === userId || a.employee_id === employeeId) && a.date === dateStr);
      if (memAtt) {
        if (memAtt.status !== 'checked-in') {
          memAtt.status = 'leave';
        }
      } else {
        memoryStore.attendance.push({
          id: `att-leave-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          user_id: userId,
          employee_id: employeeId,
          date: dateStr,
          check_in: null,
          check_out: null,
          work_hours: 0,
          status: 'leave',
          created_at: new Date().toISOString()
        });
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

/**
 * Revert attendance records from 'leave' back to 'absent' (for rejected/cancelled leave)
 */
async function revertAttendanceForLeave(userId, startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const current = new Date(start);

  while (current <= end) {
    const dow = current.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      const dateStr = current.toISOString().split('T')[0];
      try {
        await supabaseAdmin
          .from('attendance')
          .update({ status: 'absent' })
          .eq('user_id', userId)
          .eq('date', dateStr)
          .eq('status', 'leave'); // Only revert if it was set to 'leave'
      } catch (e) {
        console.error(`revertAttendanceForLeave error for ${dateStr}:`, e.message);
      }

      // MemoryStore fallback sync
      let memAtt = memoryStore.attendance.find(a => a.user_id === userId && a.date === dateStr && a.status === 'leave');
      if (memAtt) {
        memAtt.status = 'absent';
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

// ============================================================
// ENHANCED: Get All Leaves with Profile join for HR search
// ============================================================

async function getAllLeavesWithProfiles(search, companyCode) {
  let dbResults = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .select('*, profiles:user_id(id, employee_id, full_name, email, department, position, avatar_url, company_code)')
      .order('applied_at', { ascending: false });

    if (!error && data) {
      dbResults = data;
    }
  } catch (e) {
    console.error('getAllLeavesWithProfiles error:', e.message);
  }

  // Merge memory-only leaves that aren't in DB results (with profile join)
  const dbIds = new Set(dbResults.map(r => r.id));
  const memOnly = memoryStore.leaveRequests
    .filter(l => !dbIds.has(l.id))
    .map(r => {
      const prof = memoryStore.profiles.find(p => p.id === r.user_id || p.employee_id === r.employee_id);
      return { ...r, profiles: prof || null };
    });
  let results = [...dbResults, ...memOnly];

  // Filter by company_code if provided
  if (companyCode) {
    const companyUserIds = new Set(
      memoryStore.profiles.filter(p => p.company_code === companyCode).map(p => p.id)
    );
    results = results.filter(r => {
      const profileCode = r.profiles?.company_code;
      if (profileCode) return profileCode === companyCode;
      return companyUserIds.has(r.user_id);
    });
  }
  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(r => {
      const empId = (r.employee_id || '').toLowerCase();
      const fullName = (r.profiles?.full_name || '').toLowerCase();
      const email = (r.profiles?.email || '').toLowerCase();
      return empId.includes(q) || fullName.includes(q) || email.includes(q);
    });
  }
  return results;
}

module.exports = {
  getProfile,
  updateProfile,
  getAllProfiles,
  getTodayAttendance,
  clockIn,
  clockOut,
  getUserAttendanceHistory,
  getAllAttendance,
  applyLeave,
  getUserLeaves,
  getAllLeaves,
  getAllLeavesWithProfiles,
  updateLeaveStatus,
  logActivity,
  getUserActivities,
  generateNextLoginId,
  getProfileByLoginIdOrEmail,
  getPrivateInfo,
  updatePrivateInfo,
  getSalaryInfo,
  updateSalaryInfo,
  memoryStore,
  // Leave balance functions
  getLeaveBalances,
  getAllLeaveBalances,
  getOrCreateLeaveBalance,
  deductLeaveBalance,
  restoreLeaveBalance,
  updateLeaveAllocation,
  // Overlap & calendar
  checkLeaveOverlap,
  calculateWorkingDays,
  upsertAttendanceForLeave,
  revertAttendanceForLeave,
};
