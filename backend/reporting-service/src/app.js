const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const reportingRoutes = require('./routes/reportingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('../../common/middleware/errorMiddleware');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/reporting', reportingRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Reporting Service is running' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
