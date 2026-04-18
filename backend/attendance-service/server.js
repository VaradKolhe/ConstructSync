const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./src/app');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Attendance Service: Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Attendance Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Attendance Service: MongoDB connection error:', err);
    process.exit(1);
  });
