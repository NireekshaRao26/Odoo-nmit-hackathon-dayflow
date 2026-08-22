const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getPrivateInfo, updatePrivateInfo, getSalaryInfo, updateSalaryInfo } = require('../services/store');

// Helper to check if requester is HR
async function checkIsHr(requesterId) {
  if (!requesterId) return false;
  const p = await getProfile(requesterId);
  return p && p.role === 'hr';
}

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
    const { userId, full_name, department, phone, position, avatar_url, manager, location, about, job_love, interests, skills, certifications } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const updateFields = {};
    if (full_name !== undefined) updateFields.full_name = full_name;
    if (department !== undefined) updateFields.department = department;
    if (phone !== undefined) updateFields.phone = phone;
    if (position !== undefined) updateFields.position = position;
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;
    if (manager !== undefined) updateFields.manager = manager;
    if (location !== undefined) updateFields.location = location;
    if (about !== undefined) updateFields.about = about;
    if (job_love !== undefined) updateFields.job_love = job_love;
    if (interests !== undefined) updateFields.interests = interests;
    if (skills !== undefined) updateFields.skills = skills;
    if (certifications !== undefined) updateFields.certifications = certifications;

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

/**
 * @route   GET /api/profile/private
 * @desc    Fetch private profile info (owner or HR only)
 */
router.get('/private', async (req, res) => {
  try {
    const { userId, requesterId } = req.query;
    if (!userId || !requesterId) {
      return res.status(400).json({ error: 'userId and requesterId are required.' });
    }

    // Access control: must be owner or HR
    const isHr = await checkIsHr(requesterId);
    if (requesterId !== userId && !isHr) {
      return res.status(403).json({ error: 'Access denied. Unauthorized to view private info.' });
    }

    const privateInfo = await getPrivateInfo(userId);
    return res.status(200).json({ privateInfo });
  } catch (err) {
    console.error('Error fetching private info:', err);
    return res.status(500).json({ error: 'Failed to fetch private profile info.' });
  }
});

/**
 * @route   POST /api/profile/private/update
 * @desc    Update private profile info (owner or HR only)
 */
router.post('/private/update', async (req, res) => {
  try {
    const { userId, requesterId, ...updateFields } = req.body;
    if (!userId || !requesterId) {
      return res.status(400).json({ error: 'userId and requesterId are required.' });
    }

    // Access control: must be owner or HR
    const isHr = await checkIsHr(requesterId);
    if (requesterId !== userId && !isHr) {
      return res.status(403).json({ error: 'Access denied. Unauthorized to update private info.' });
    }

    const updated = await updatePrivateInfo(userId, updateFields);
    return res.status(200).json({
      message: 'Private info updated successfully.',
      privateInfo: updated
    });
  } catch (err) {
    console.error('Error updating private info:', err);
    return res.status(500).json({ error: 'Failed to update private profile info.' });
  }
});

/**
 * @route   GET /api/profile/salary
 * @desc    Fetch employee salary info (HR only)
 */
router.get('/salary', async (req, res) => {
  try {
    const { userId, requesterId } = req.query;
    if (!userId || !requesterId) {
      return res.status(400).json({ error: 'userId and requesterId are required.' });
    }

    // Access control: strictly HR only
    const isHr = await checkIsHr(requesterId);
    if (!isHr) {
      return res.status(403).json({ error: 'Access denied. Salary information is restricted to HR Admin users.' });
    }

    const salaryInfo = await getSalaryInfo(userId);
    return res.status(200).json({ salaryInfo });
  } catch (err) {
    console.error('Error fetching salary info:', err);
    return res.status(500).json({ error: 'Failed to fetch salary info.' });
  }
});

/**
 * @route   POST /api/profile/salary/update
 * @desc    Update employee salary info (HR only)
 */
router.post('/salary/update', async (req, res) => {
  try {
    const { userId, requesterId, ...updateFields } = req.body;
    if (!userId || !requesterId) {
      return res.status(400).json({ error: 'userId and requesterId are required.' });
    }

    // Access control: strictly HR only
    const isHr = await checkIsHr(requesterId);
    if (!isHr) {
      return res.status(403).json({ error: 'Access denied. Salary configurations can only be modified by HR Admin users.' });
    }

    const updated = await updateSalaryInfo(userId, updateFields);
    return res.status(200).json({
      message: 'Salary information updated successfully.',
      salaryInfo: updated
    });
  } catch (err) {
    console.error('Error updating salary info:', err);
    return res.status(500).json({ error: 'Failed to update salary info.' });
  }
});

module.exports = router;
