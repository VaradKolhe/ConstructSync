const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./src/app');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Deployment Service: Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Deployment Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Deployment Service: MongoDB connection error:', err);
    process.exit(1);
  });
