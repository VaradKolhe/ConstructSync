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
  .then(async () => {
    console.log('Attendance Service: Connected to MongoDB');
    
    // Check if attendances collection is a time series
    const collections = await mongoose.connection.db.listCollections({ name: 'attendances' }).toArray();
    if (collections.length > 0) {
      const coll = collections[0];
      if (!coll.type || coll.type !== 'timeseries') {
        console.warn('WARNING: The "attendances" collection exists but is NOT a time series collection.');
        console.warn('To fix this, please drop the "attendances" collection in MongoDB Compass and restart this service.');
      } else {
        console.log('Attendance Service: Verified "attendances" is a time series collection.');
      }
    }

    app.listen(PORT, () => {
      console.log(`Attendance Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Attendance Service: MongoDB connection error:', err);
    process.exit(1);
  });
