const express = require('express');
const cors = require('cors');
const attendanceRoutes = require('./routes/attendanceRoutes');
const errorHandler = require('../../../common/middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/attendances', attendanceRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Attendance Service is running' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
