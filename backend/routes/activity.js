const express = require('express');
const router = express.Router();
const { getUserActivities } = require('../services/store');

/**
 * @route   GET /api/activity
 * @desc    Get activity feed & system alerts for user
 */
router.get('/', async (req, res) => {
  try {
    const { userId, employeeId } = req.query;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required.' });
    }

    const activities = await getUserActivities(userId, employeeId);
    return res.status(200).json({ activities });
  } catch (err) {
    console.error('Error fetching activities:', err);
    return res.status(500).json({ error: 'Failed to fetch activity log.' });
  }
});

module.exports = router;
