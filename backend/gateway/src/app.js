const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Explicitly allow frontend origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(morgan('dev'));

// Proxy mappings
const proxies = {
  '/api/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  '/api/labours': process.env.LABOUR_SERVICE_URL || 'http://localhost:5002',
  '/api/attendances': process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:5003',
  '/api/deployments': process.env.DEPLOYMENT_SERVICE_URL || 'http://localhost:5004',
  '/api/reporting': process.env.REPORTING_SERVICE_URL || 'http://localhost:5005',
};

// Setup proxies
Object.entries(proxies).forEach(([path, target]) => {
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathFilter: path,
      on: {
        proxyReq: (proxyReq, req, res) => {
          console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${target}${req.url}`);
        },
        error: (err, req, res) => {
          console.error(`Proxy error for ${path}:`, err.message);
          res.status(503).json({ success: false, message: 'Service unavailable' });
        },
      },
    })
  ); 
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Gateway is running' });
});

module.exports = app;
