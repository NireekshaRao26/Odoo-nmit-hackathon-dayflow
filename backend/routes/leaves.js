const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getUserLeaves,
  getAllLeaves,
  updateLeaveStatus
} = require('../services/store');

/**
 * @route   POST /api/leaves/apply
 * @desc    Submit a new leave request
 */
router.post('/apply', async (req, res) => {
  try {
    const { userId, employeeId, leaveType, startDate, endDate, daysCount, reason } = req.body;
    if (!userId || !employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All leave fields (leaveType, startDate, endDate, reason) are required.' });
    }

    const result = await applyLeave({
      userId,
      employeeId,
      leaveType,
      startDate,
      endDate,
      daysCount: daysCount || 1,
      reason
    });

    return res.status(201).json({
      message: 'Leave application submitted successfully.',
      leaveRequest: result.data
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    return res.status(500).json({ error: 'Failed to submit leave request.' });
  }
});

/**
 * @route   GET /api/leaves/user
 * @desc    Get user's leave requests
 */
router.get('/user', async (req, res) => {
  try {
    const { userId, employeeId } = req.query;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required.' });
    }

    const requests = await getUserLeaves(userId, employeeId);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('Error fetching user leaves:', err);
    return res.status(500).json({ error: 'Failed to fetch leave requests.' });
  }
});

/**
 * @route   GET /api/leaves/all
 * @desc    Get all leave requests for Admin / HR review
 */
router.get('/all', async (req, res) => {
  try {
    const { hrUserId } = req.query;
    let requests = await getAllLeaves();

    if (hrUserId) {
      const { getProfile, getAllProfiles } = require('../services/store');
      const hrProfile = await getProfile(hrUserId);
      if (hrProfile) {
        const companyCode = hrProfile.company_code;
        const allProfiles = await getAllProfiles();
        const companyEmployeeIds = new Set(
          allProfiles.filter(p => p.company_code === companyCode).map(p => p.id)
        );
        const companyEmployeeEmpIds = new Set(
          allProfiles.filter(p => p.company_code === companyCode).map(p => p.employee_id)
        );
        requests = requests.filter(
          r => companyEmployeeIds.has(r.user_id) || companyEmployeeEmpIds.has(r.employee_id)
        );
      }
    }

    return res.status(200).json({ requests });
  } catch (err) {
    console.error('Error fetching all leave requests:', err);
    return res.status(500).json({ error: 'Failed to fetch leave requests.' });
  }
});

/**
 * @route   PUT /api/leaves/status
 * @desc    Approve or Reject a leave request (Admin/HR)
 */
router.put('/status', async (req, res) => {
  try {
    const { leaveId, status, comments, reviewerId } = req.body;
    if (!leaveId || !status) {
      return res.status(400).json({ error: 'leaveId and status ("approved" or "rejected") are required.' });
    }

    if (!['approved', 'rejected'].includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Status must be either "approved" or "rejected".' });
    }

    const result = await updateLeaveStatus(leaveId, status.toLowerCase(), comments, reviewerId);
    return res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leaveRequest: result.data
    });
  } catch (err) {
    console.error('Error updating leave status:', err);
    return res.status(500).json({ error: 'Failed to update leave status.' });
  }
});

module.exports = router;
