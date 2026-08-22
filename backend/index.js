const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const attendanceRoutes = require('./routes/attendance');
const leavesRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
// Allow development frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected error occurred on the server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
