const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const {
  getTodayAttendance,
  clockIn,
  clockOut,
  getUserAttendanceHistory,
  getAllAttendance,
  getProfile,
  getAllProfiles,
  memoryStore
} = require('../services/store');

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance status for user
 */
router.get('/today', async (req, res) => {
  try {
    const { userId, employeeId } = req.query;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required.' });
    }

    const record = await getTodayAttendance(userId, employeeId);
    return res.status(200).json({ attendance: record });
  } catch (err) {
    console.error('Error fetching today attendance:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

/**
 * @route   POST /api/attendance/check-in
 * @desc    Clock-in action
 */
router.post('/check-in', async (req, res) => {
  try {
    const { userId, employeeId } = req.body;
    if (!userId || !employeeId) {
      return res.status(400).json({ error: 'userId and employeeId are required.' });
    }

    const result = await clockIn(userId, employeeId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      message: 'Clock-in successful!',
      attendance: result.data
    });
  } catch (err) {
    console.error('Error during check-in:', err);
    return res.status(500).json({ error: 'Failed to clock in.' });
  }
});

/**
 * @route   POST /api/attendance/check-out
 * @desc    Clock-out action
 */
router.post('/check-out', async (req, res) => {
  try {
    const { userId, employeeId } = req.body;
    if (!userId || !employeeId) {
      return res.status(400).json({ error: 'userId and employeeId are required.' });
    }

    const result = await clockOut(userId, employeeId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      message: 'Clock-out successful!',
      attendance: result.data
    });
  } catch (err) {
    console.error('Error during check-out:', err);
    return res.status(500).json({ error: 'Failed to clock out.' });
  }
});

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history for user (Employee calendar log)
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, requesterId, month } = req.query;
    if (!userId || !requesterId) {
      return res.status(400).json({ error: 'userId and requesterId are required.' });
    }

    // 1. Access Control Check (User own records or HR role)
    if (requesterId !== userId) {
      const requester = await getProfile(requesterId);
      if (!requester || requester.role !== 'hr') {
        return res.status(403).json({ error: 'Access denied. You cannot view other employees\' attendance.' });
      }
    }

    // Resolve target profile
    const targetUser = await getProfile(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // 2. Parse selected month (YYYY-MM). Defaults to current local month.
    const currentLocalDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    const defaultMonth = currentLocalDate.toISOString().substring(0, 7); // e.g. 2026-08
    const selectedMonth = month || defaultMonth;

    const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    // 3. Fetch attendance records for this month
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-${daysInMonth}`;

    const { data: attendanceData } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    // 4. Fetch approved leave requests that intersect this month
    const { data: leavesData } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    const userAttendance = attendanceData || memoryStore.attendance.filter(
      a => a.user_id === userId && a.date >= startDate && a.date <= endDate
    );

    const userLeaves = leavesData || memoryStore.leaveRequests.filter(
      l => l.user_id === userId && l.status === 'approved' && l.start_date <= endDate && l.end_date >= startDate
    );

    // 5. Generate daily calendar log
    const todayStr = currentLocalDate.toISOString().split('T')[0];
    const isCurrentMonth = selectedMonth === defaultMonth;
    const maxDay = isCurrentMonth ? currentLocalDate.getDate() : daysInMonth;

    let daysPresent = 0;
    let leavesCount = 0;
    let totalWorkingDays = 0; // Weekdays in the month

    const history = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      
      const dayOfWeek = new Date(yearNum, monthNum - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!isWeekend) {
        totalWorkingDays++;
      }

      // Skip future days for the logs
      if (day > maxDay) {
        continue;
      }

      const att = userAttendance.find(a => a.date === dateStr);
      const onLeave = userLeaves.some(l => l.start_date <= dateStr && dateStr <= l.end_date);

      let status = 'absent';
      let checkIn = null;
      let checkOut = null;
      let workHours = 0;

      if (att) {
        status = att.check_out ? 'present' : 'checked-in';
        checkIn = att.check_in;
        checkOut = att.check_out;
        workHours = att.work_hours || 0;
        daysPresent++;
      } else if (onLeave) {
        status = 'leave';
        leavesCount++;
      } else if (isWeekend) {
        status = 'weekend';
      } else {
        status = 'absent';
      }

      // Compute extra hours dynamically
      const extraHours = Math.max(0, workHours - 8.0);

      history.push({
        date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        work_hours: workHours,
        extra_hours: extraHours,
        status: status
      });
    }

    // Calculate payable days
    const payableDays = daysPresent + leavesCount;

    return res.status(200).json({
      history,
      summary: {
        selectedMonth,
        daysPresent,
        leavesCount,
        totalWorkingDays,
        payableDays
      }
    });
  } catch (err) {
    console.error('Error fetching employee attendance history:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
});

/**
 * @route   GET /api/attendance/all
 * @desc    Get organization wide daily attendance directory (Admin/HR only)
 */
router.get('/all', async (req, res) => {
  try {
    const { date, search, requesterId } = req.query;
    if (!requesterId) {
      return res.status(400).json({ error: 'requesterId is required.' });
    }

    // 1. Role Authorization Check
    const requester = await getProfile(requesterId);
    if (!requester || requester.role !== 'hr') {
      return res.status(403).json({ error: 'Access denied. Only HR Admin users can view organization attendance.' });
    }

    // Use selected date or default to local today date string
    const offset = new Date().getTimezoneOffset() * 60000;
    const todayStr = new Date(Date.now() - offset).toISOString().split('T')[0];
    const targetDate = date || todayStr;

    // 2. Fetch all profiles
    const profiles = await getAllProfiles();

    // 3. Fetch attendance records for this date
    const { data: attendanceData } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('date', targetDate);

    // 4. Fetch approved leaves for this date
    const { data: leavesData } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', targetDate)
      .gte('end_date', targetDate);

    const attendanceRecords = attendanceData || memoryStore.attendance.filter(a => a.date === targetDate);
    const leaves = leavesData || memoryStore.leaveRequests.filter(l => l.status === 'approved' && l.start_date <= targetDate && targetDate <= l.end_date);

    // 5. Build daily directory rows
    let records = profiles.map(profile => {
      const att = attendanceRecords.find(a => a.user_id === profile.id || a.employee_id === profile.employee_id);
      const leave = leaves.find(l => l.user_id === profile.id || l.employee_id === profile.employee_id);

      let status = 'absent';
      if (att) {
        status = att.check_out ? 'present' : 'checked-in';
      } else if (leave) {
        status = 'leave';
      }

      return {
        id: att?.id || `temp-${profile.id}`,
        user_id: profile.id,
        employee_id: profile.employee_id,
        full_name: profile.full_name,
        email: profile.email,
        department: profile.department,
        position: profile.position,
        check_in: att?.check_in || null,
        check_out: att?.check_out || null,
        work_hours: att?.work_hours || 0,
        status: status
      };
    });

    // 6. Apply search filter
    if (search) {
      const q = search.toLowerCase().trim();
      records = records.filter(r => 
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.employee_id || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ records });
  } catch (err) {
    console.error('Error fetching all attendance:', err);
    return res.status(500).json({ error: 'Failed to fetch all attendance.' });
  }
});

module.exports = router;
