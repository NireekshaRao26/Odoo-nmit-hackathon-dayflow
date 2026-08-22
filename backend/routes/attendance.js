const express = require('express');
const router = express.Router();
const {
  getTodayAttendance,
  clockIn,
  clockOut,
  getUserAttendanceHistory,
  getAllAttendance
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
 * @desc    Get attendance history for user
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, employeeId } = req.query;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required.' });
    }

    const history = await getUserAttendanceHistory(userId, employeeId);
    return res.status(200).json({ history });
  } catch (err) {
    console.error('Error fetching attendance history:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
});

/**
 * @route   GET /api/attendance/all
 * @desc    Get organization wide attendance (Admin/HR)
 */
router.get('/all', async (req, res) => {
  try {
    const { hrUserId } = req.query;
    let records = await getAllAttendance();

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
        records = records.filter(
          r => companyEmployeeIds.has(r.user_id) || companyEmployeeEmpIds.has(r.employee_id)
        );
      }
    }

    return res.status(200).json({ records });
  } catch (err) {
    console.error('Error fetching all attendance:', err);
    return res.status(500).json({ error: 'Failed to fetch all attendance.' });
  }
});

module.exports = router;
