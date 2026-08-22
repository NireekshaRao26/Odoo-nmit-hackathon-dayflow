const express = require('express');
const router = express.Router();
const {
  getAllProfiles,
  getAllAttendance,
  getAllLeaves,
  getProfile
} = require('../services/store');

/**
 * @route   GET /api/admin/employees
 * @desc    Fetch list of all registered employees with today's attendance & stats
 *          Scoped to the requesting HR user's company
 */
router.get('/employees', async (req, res) => {
  try {
    const { requesterId } = req.query;

    // Resolve company_code from the HR requester's profile
    let companyCode = null;
    if (requesterId) {
      const requesterProfile = await getProfile(requesterId);
      if (requesterProfile && requesterProfile.role === 'hr') {
        companyCode = requesterProfile.company_code;
      }
    }

    const employees = await getAllProfiles(companyCode);
    const attendance = await getAllAttendance(null, null, companyCode);
    const leaves = await getAllLeaves(companyCode);

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
 *          Scoped to the requesting HR user's company
 */
router.get('/overview', async (req, res) => {
  try {
    const { requesterId } = req.query;

    // Resolve company_code from the HR requester's profile
    let companyCode = null;
    if (requesterId) {
      const requesterProfile = await getProfile(requesterId);
      if (requesterProfile && requesterProfile.role === 'hr') {
        companyCode = requesterProfile.company_code;
      }
    }

    const employees = await getAllProfiles(companyCode);
    const attendance = await getAllAttendance(null, null, companyCode);
    const leaves = await getAllLeaves(companyCode);

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
