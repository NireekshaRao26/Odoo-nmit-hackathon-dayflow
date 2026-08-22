const { supabaseAdmin } = require('../config/supabase');

// Memory storage fallback
const memoryStore = {
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

// Get All Profiles
async function getAllProfiles() {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }
  return memoryStore.profiles;
}

// Get Today's Attendance Status
async function getTodayAttendance(userId, employeeId) {
  const todayStr = new Date().toISOString().split('T')[0];
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
  const todayStr = new Date().toISOString().split('T')[0];
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
  const todayStr = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  let todayRecord = await getTodayAttendance(userId, employeeId);
  if (!todayRecord || !todayRecord.check_in) {
    return { error: 'No active check-in record found for today.' };
  }

  const checkInTime = new Date(todayRecord.check_in).getTime();
  const checkOutTime = new Date(nowIso).getTime();
  const workHours = Math.max(0.1, Number(((checkOutTime - checkInTime) / 3600000).toFixed(2)));

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

// Get All Attendance
async function getAllAttendance() {
  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }
  return memoryStore.attendance;
}

// Apply Leave
async function applyLeave(leaveData) {
  const newLeave = {
    id: `lr-${Date.now()}`,
    user_id: leaveData.userId,
    employee_id: leaveData.employeeId,
    leave_type: leaveData.leaveType,
    start_date: leaveData.startDate,
    end_date: leaveData.endDate,
    days_count: Number(leaveData.daysCount || 1),
    reason: leaveData.reason,
    status: 'pending',
    reviewer_comments: '',
    applied_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert(newLeave)
      .select()
      .single();
    if (!error && data) {
      await logActivity(leaveData.userId, leaveData.employeeId, 'leave', 'Submitted Leave Request', `Applied for ${newLeave.days_count} day(s) of ${newLeave.leave_type}`);
      return { data };
    }
  } catch (e) {
    // DB fallback
  }

  memoryStore.leaveRequests.unshift(newLeave);
  await logActivity(leaveData.userId, leaveData.employeeId, 'leave', 'Submitted Leave Request', `Applied for ${newLeave.days_count} day(s) of ${newLeave.leave_type}`);
  return { data: newLeave };
}

// Get User Leaves
async function getUserLeaves(userId, employeeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .or(`user_id.eq.${userId},employee_id.eq.${employeeId}`)
      .order('applied_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }

  return memoryStore.leaveRequests
    .filter(l => l.user_id === userId || l.employee_id === employeeId)
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
}

// Get All Leaves
async function getAllLeaves() {
  try {
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .order('applied_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // DB fallback
  }
  return memoryStore.leaveRequests;
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
 * [Company Code][First 2 letters of employee's first name + first 2 letters of employee's last name][Year of Joining][4-digit serial number of joining]
 * Example: OIJODO20230001
 */
async function generateNextLoginId({ companyName, companyCode, fullName, joiningYear }) {
  let code = companyCode ? companyCode.trim().toUpperCase() : '';
  if (!code && companyName) {
    const words = companyName.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      code = words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
    } else {
      code = companyName.trim().substring(0, 2).toUpperCase();
    }
  }
  if (!code) code = 'OI';

  const nameParts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'EMPLOYEE';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

  const first2 = firstName.substring(0, 2).toUpperCase().padEnd(2, 'X');
  const last2 = lastName.substring(0, 2).toUpperCase().padEnd(2, 'X');
  const initials = `${first2}${last2}`;

  const year = joiningYear ? String(joiningYear) : String(new Date().getFullYear());

  let maxSerial = 0;

  try {
    const { data: dbProfiles } = await supabaseAdmin
      .from('profiles')
      .select('employee_id');
    if (dbProfiles && dbProfiles.length > 0) {
      dbProfiles.forEach(p => {
        if (p.employee_id) {
          const regex = new RegExp(`^${code}.*?${year}(\\d{4})$`, 'i');
          const match = p.employee_id.match(regex);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSerial) maxSerial = num;
          }
        }
      });
    }
  } catch (e) {}

  memoryStore.profiles.forEach(p => {
    if (p.employee_id) {
      const regex = new RegExp(`^${code}.*?${year}(\\d{4})$`, 'i');
      const match = p.employee_id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSerial) maxSerial = num;
      }
    }
  });

  let nextSerial = maxSerial + 1;
  let candidateId = `${code}${initials}${year}${String(nextSerial).padStart(4, '0')}`;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    candidateId = `${code}${initials}${year}${String(nextSerial).padStart(4, '0')}`;
    let existsInDb = false;
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('employee_id', candidateId)
        .maybeSingle();
      if (data) existsInDb = true;
    } catch (e) {}

    const existsInMem = memoryStore.profiles.some(p => p.employee_id && p.employee_id.toUpperCase() === candidateId.toUpperCase());

    if (!existsInDb && !existsInMem) {
      isUnique = true;
    } else {
      nextSerial++;
      attempts++;
    }
  }

  return {
    loginId: candidateId,
    companyCode: code,
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
    const { data: byEmail } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('email', str)
      .maybeSingle();
    if (byEmail) return byEmail;

    const { data: byEmpId } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('employee_id', str)
      .maybeSingle();
    if (byEmpId) return byEmpId;
  } catch (e) {}

  return memoryStore.profiles.find(
    p => (p.email && p.email.toLowerCase() === str) || (p.employee_id && p.employee_id.toLowerCase() === str)
  ) || null;
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
  updateLeaveStatus,
  logActivity,
  getUserActivities,
  generateNextLoginId,
  getProfileByLoginIdOrEmail,
  memoryStore
};
