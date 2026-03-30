const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Single test route (required)
app.get('/', (req, res) => {
  res.send('Service is running');
});

module.exports = app;

