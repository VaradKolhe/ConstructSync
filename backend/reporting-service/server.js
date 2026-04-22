const mongoose = require('mongoose');
global.mongooseInstance = mongoose;
const dotenv = require('dotenv');
const app = require('./src/app');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Reporting Service: Connected to MongoDB');

    // Force creation of collections
    const ReportCache = require('./src/models/ReportCache');
    const ReportLog = require('./src/models/ReportLog');

    try {
      await ReportCache.createCollection();
      await ReportLog.createCollection();
      console.log('Reporting Service: Collections initialized');
    } catch (err) {
      console.log('Reporting Service: Collections already exist');
    }

    app.listen(PORT, () => {
      console.log(`Reporting Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Reporting Service: MongoDB connection error:', err);
    process.exit(1);
  });
