const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Basic proxy routing to underlying microservices
app.use(
  '/auth',
  createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: { '^/auth': '' },
  })
);

app.use(
  '/labour',
  createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
    pathRewrite: { '^/labour': '' },
  })
);

app.use(
  '/attendance',
  createProxyMiddleware({
    target: 'http://localhost:5003',
    changeOrigin: true,
    pathRewrite: { '^/attendance': '' },
  })
);

// Single test route (required)
app.get('/', (req, res) => {
  res.send('Service is running');
});

module.exports = app;

