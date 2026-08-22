const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../services/store');

/**
 * @route   GET /api/profile
 * @desc    Fetch user profile details
 * @access  Public / Authenticated
 */
router.get('/', async (req, res) => {
  try {
    const { userId, employeeId } = req.query;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required.' });
    }

    const profile = await getProfile(userId, employeeId);
    return res.status(200).json({ profile });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

/**
 * @route   PUT /api/profile
 * @desc    Update user profile details
 * @access  Public / Authenticated
 */
router.post('/update', async (req, res) => {
  try {
    const { userId, full_name, department, phone, position, avatar_url } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const updateFields = {};
    if (full_name !== undefined) updateFields.full_name = full_name;
    if (department !== undefined) updateFields.department = department;
    if (phone !== undefined) updateFields.phone = phone;
    if (position !== undefined) updateFields.position = position;
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;

    const updated = await updateProfile(userId, updateFields);
    return res.status(200).json({
      message: 'Profile updated successfully.',
      profile: updated
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

module.exports = router;
