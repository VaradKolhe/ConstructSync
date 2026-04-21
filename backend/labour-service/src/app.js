const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const labourRoutes = require('./routes/labourRoutes');
const referenceDataRoutes = require('./routes/referenceDataRoutes');
const errorHandler = require('../../common/middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/labours', labourRoutes);
app.use('/api/labours/reference-data', referenceDataRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Labour Service is running' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
