const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const {
  applyLeave,
  getUserLeaves,
  getAllLeaves,
  getAllLeavesWithProfiles,
  updateLeaveStatus,
  getLeaveBalances,
  getAllLeaveBalances,
  updateLeaveAllocation,
  deductLeaveBalance,
  restoreLeaveBalance,
  checkLeaveOverlap,
  calculateWorkingDays,
  upsertAttendanceForLeave,
  revertAttendanceForLeave,
} = require('../services/store');

// Multer: memory storage for temporary file handling before Supabase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

// ============================================================
// POST /api/leaves/apply
// Submit a new leave request (employee only)
// ============================================================
router.post('/apply', async (req, res) => {
  try {
    const { userId, employeeId, leaveType, startDate, endDate, reason, attachmentUrl } = req.body;

    if (!userId || !employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All fields (leaveType, startDate, endDate, reason) are required.' });
    }

    // Validate dates
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be on or before end date.' });
    }

    // Validate leave type
    const validTypes = ['Paid Time Off', 'Sick Leave', 'Unpaid Leave', 'Paid Leave', 'Casual Leave'];
    if (!validTypes.includes(leaveType)) {
      return res.status(400).json({ error: 'Invalid leave type.' });
    }

    // Check for overlapping requests
    const overlap = await checkLeaveOverlap(userId, startDate, endDate);
    if (overlap) {
      return res.status(409).json({
        error: `You already have a ${overlap.status} leave request overlapping these dates (${overlap.start_date} to ${overlap.end_date}).`
      });
    }

    // Calculate working days
    const daysCount = calculateWorkingDays(startDate, endDate);

    // Check balance (for paid/sick leave types)
    if (['Paid Time Off', 'Paid Leave'].includes(leaveType)) {
      const balances = await getLeaveBalances(userId, employeeId);
      const ptoBalance = balances.find(b => b.leave_type === 'Paid Time Off');
      if (ptoBalance) {
        const remaining = (ptoBalance.allocated_days || 0) - (ptoBalance.used_days || 0);
        if (daysCount > remaining) {
          return res.status(400).json({
            error: `Insufficient Paid Time Off balance. Requesting ${daysCount} day(s), but only ${remaining} day(s) available.`
          });
        }
      }
    } else if (leaveType === 'Sick Leave') {
      const balances = await getLeaveBalances(userId, employeeId);
      const sickBalance = balances.find(b => b.leave_type === 'Sick Leave');
      if (sickBalance) {
        const remaining = (sickBalance.allocated_days || 0) - (sickBalance.used_days || 0);
        if (daysCount > remaining) {
          return res.status(400).json({
            error: `Insufficient Sick Leave balance. Requesting ${daysCount} day(s), but only ${remaining} day(s) available.`
          });
        }
      }
    }

    const result = await applyLeave({
      userId,
      employeeId,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      attachmentUrl: attachmentUrl || '',
    });

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leaveRequest: result.data,
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    return res.status(500).json({ error: 'Failed to submit leave request.' });
  }
});

// ============================================================
// GET /api/leaves/user
// Get the logged-in employee's own leave requests
// ============================================================
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
    return res.status(500).json({ error: 'Unable to load time-off records.' });
  }
});

// ============================================================
// GET /api/leaves/all
// HR/Admin: Get all leave requests with optional search
// ============================================================
router.get('/all', async (req, res) => {
  try {
    const { search } = req.query;
    const requests = await getAllLeavesWithProfiles(search || '');
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('Error fetching all leave requests:', err);
    return res.status(500).json({ error: 'Unable to load time-off records.' });
  }
});

// ============================================================
// PUT /api/leaves/status
// HR/Admin: Approve or Reject a leave request
// ============================================================
router.put('/status', async (req, res) => {
  try {
    const { leaveId, status, comments, reviewerId } = req.body;

    if (!leaveId || !status) {
      return res.status(400).json({ error: 'leaveId and status are required.' });
    }

    const normalizedStatus = status.toLowerCase();
    if (!['approved', 'rejected'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected".' });
    }

    // Fetch the existing leave request
    let existingLeave = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .select('*')
        .eq('id', leaveId)
        .maybeSingle();
      if (!error && data) existingLeave = data;
    } catch (e) {
      console.error('Error fetching leave request:', e.message);
    }

    if (!existingLeave) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    // Guard: already processed
    if (existingLeave.status === normalizedStatus) {
      return res.status(400).json({ error: `This request is already ${normalizedStatus}.` });
    }

    // Update the status
    const result = await updateLeaveStatus(leaveId, normalizedStatus, comments, reviewerId);

    // Side effects based on new status
    if (normalizedStatus === 'approved') {
      // Deduct balance (only if not already approved before)
      if (existingLeave.status !== 'approved') {
        await deductLeaveBalance(
          existingLeave.user_id,
          existingLeave.employee_id,
          existingLeave.leave_type,
          existingLeave.days_count
        );
        // Mark attendance as 'leave' for the date range
        await upsertAttendanceForLeave(
          existingLeave.user_id,
          existingLeave.employee_id,
          existingLeave.start_date,
          existingLeave.end_date
        );
      }
    } else if (normalizedStatus === 'rejected') {
      // If it was previously approved, restore the balance
      if (existingLeave.status === 'approved') {
        await restoreLeaveBalance(
          existingLeave.user_id,
          existingLeave.employee_id,
          existingLeave.leave_type,
          existingLeave.days_count
        );
        // Revert attendance records back to absent
        await revertAttendanceForLeave(
          existingLeave.user_id,
          existingLeave.start_date,
          existingLeave.end_date
        );
      }
      // If it was pending → rejected, no balance change needed
    }

    return res.status(200).json({
      message: `Leave request ${normalizedStatus} successfully.`,
      leaveRequest: result.data,
    });
  } catch (err) {
    console.error('Error updating leave status:', err);
    return res.status(500).json({ error: 'Failed to update leave status.' });
  }
});

// ============================================================
// GET /api/leaves/balances
// Get leave balances for a user (or all users for HR)
// ============================================================
router.get('/balances', async (req, res) => {
  try {
    const { userId, employeeId, isHr } = req.query;

    if (isHr === 'true') {
      const balances = await getAllLeaveBalances();
      return res.status(200).json({ balances });
    }

    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required.' });
    }

    const balances = await getLeaveBalances(userId, employeeId);
    return res.status(200).json({ balances });
  } catch (err) {
    console.error('Error fetching leave balances:', err);
    return res.status(500).json({ error: 'Failed to fetch leave balances.' });
  }
});

// ============================================================
// PUT /api/leaves/balances
// HR: Update leave allocation for an employee
// ============================================================
router.put('/balances', async (req, res) => {
  try {
    const { userId, employeeId, leaveType, allocatedDays, reviewerId } = req.body;

    if (!userId || !leaveType || allocatedDays === undefined) {
      return res.status(400).json({ error: 'userId, leaveType, and allocatedDays are required.' });
    }

    const result = await updateLeaveAllocation(userId, employeeId, leaveType, Number(allocatedDays));
    return res.status(200).json({
      message: 'Leave allocation updated successfully.',
      balance: result,
    });
  } catch (err) {
    console.error('Error updating leave allocation:', err);
    return res.status(500).json({ error: 'Failed to update leave allocation.' });
  }
});

// ============================================================
// POST /api/leaves/upload
// Upload an attachment for a leave request to Supabase Storage
// ============================================================
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const ext = req.file.originalname.split('.').pop();
    const fileName = `leave-attachments/${userId}/${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('leave-attachments')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      // Return a clear error but don't expose internal details
      return res.status(500).json({ error: 'File upload failed. Please try submitting without attachment.' });
    }

    // Generate a signed URL valid for 1 year (attachments are private)
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from('leave-attachments')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signedErr || !signed) {
      return res.status(500).json({ error: 'Could not generate secure file URL.' });
    }

    return res.status(200).json({
      message: 'File uploaded successfully.',
      attachmentUrl: signed.signedUrl,
      path: fileName,
    });
  } catch (err) {
    if (err.message && err.message.includes('Only JPEG')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size must be under 5 MB.' });
    }
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'File upload failed.' });
  }
});

module.exports = router;
