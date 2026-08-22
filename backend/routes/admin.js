const express = require('express');
const router = express.Router();
const {
  getAllProfiles,
  getAllAttendance,
  getAllLeaves
} = require('../services/store');

/**
 * @route   GET /api/admin/employees
 * @desc    Fetch list of all registered employees with today's attendance & stats
 */
router.get('/employees', async (req, res) => {
  try {
    const { hrUserId } = req.query;
    let employees = await getAllProfiles();
    let attendance = await getAllAttendance();
    let leaves = await getAllLeaves();

    if (hrUserId) {
      const { getProfile } = require('../services/store');
      const hrProfile = await getProfile(hrUserId);
      if (hrProfile) {
        const companyCode = hrProfile.company_code;
        employees = employees.filter(emp => emp.company_code === companyCode);
        
        const employeeIds = new Set(employees.map(emp => emp.id));
        const employeeEmpIds = new Set(employees.map(emp => emp.employee_id));
        
        attendance = attendance.filter(a => employeeIds.has(a.user_id) || employeeEmpIds.has(a.employee_id));
        leaves = leaves.filter(l => employeeIds.has(l.user_id) || employeeEmpIds.has(l.employee_id));
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const enrichedEmployees = employees.map(emp => {
      const todayAtt = attendance.find(
        a => a.date === todayStr && (a.user_id === emp.id || a.employee_id === emp.employee_id)
      );

      const empLeaves = leaves.filter(
        l => l.user_id === emp.id || l.employee_id === emp.employee_id
      );

      const pendingLeaves = empLeaves.filter(l => l.status === 'pending').length;

      return {
        ...emp,
        today_status: todayAtt ? todayAtt.status : 'absent',
        check_in: todayAtt ? todayAtt.check_in : null,
        check_out: todayAtt ? todayAtt.check_out : null,
        pending_leaves_count: pendingLeaves
      };
    });

    return res.status(200).json({ employees: enrichedEmployees });
  } catch (err) {
    console.error('Error fetching admin employees list:', err);
    return res.status(500).json({ error: 'Failed to fetch employee records.' });
  }
});

/**
 * @route   GET /api/admin/overview
 * @desc    Get organization overview stats for Admin Dashboard
 */
router.get('/overview', async (req, res) => {
  try {
    const { hrUserId } = req.query;
    let employees = await getAllProfiles();
    let attendance = await getAllAttendance();
    let leaves = await getAllLeaves();

    if (hrUserId) {
      const { getProfile } = require('../services/store');
      const hrProfile = await getProfile(hrUserId);
      if (hrProfile) {
        const companyCode = hrProfile.company_code;
        employees = employees.filter(emp => emp.company_code === companyCode);
        
        const employeeIds = new Set(employees.map(emp => emp.id));
        const employeeEmpIds = new Set(employees.map(emp => emp.employee_id));
        
        attendance = attendance.filter(a => employeeIds.has(a.user_id) || employeeEmpIds.has(a.employee_id));
        leaves = leaves.filter(l => employeeIds.has(l.user_id) || employeeEmpIds.has(l.employee_id));
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === todayStr);

    const checkedInCount = todayAttendance.filter(a => a.status === 'checked-in').length;
    const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'checked-in').length;
    const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;

    return res.status(200).json({
      stats: {
        totalEmployees: employees.length,
        presentToday: presentCount,
        checkedInNow: checkedInCount,
        pendingLeaveApprovals: pendingLeavesCount
      }
    });
  } catch (err) {
    console.error('Error fetching admin overview stats:', err);
    return res.status(500).json({ error: 'Failed to fetch organization overview.' });
  }
});

module.exports = router;
