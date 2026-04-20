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
    
    const Attendance = require('./src/models/Attendance');

    try {
      // 1. Check if the collection already exists
      const collections = await mongoose.connection.db.listCollections({ name: 'attendances' }).toArray();
      
      if (collections.length === 0) {
        console.log('Attendance Service: Creating "attendances" time-series collection...');
        // 2. Explicitly create the collection with time-series options
        await Attendance.createCollection();
        console.log('Attendance Service: Time-series collection created successfully.');
        
        // 3. Manually create the defined indexes
        await Attendance.createIndexes();
        console.log('Attendance Service: Indexes created successfully.');
      } else {
        const coll = collections[0];
        if (!coll.type || coll.type !== 'timeseries') {
          console.warn('WARNING: The "attendances" collection is NOT a time series.');
          console.warn('ACTION REQUIRED: Drop the collection in MongoDB Compass and restart this service.');
        } else {
          console.log('Attendance Service: Verified "attendances" is a time series collection.');
          // Ensure indexes are up to date
          await Attendance.createIndexes();
        }
      }
    } catch (error) {
      console.error('Attendance Service: Error during collection initialization:', error);
    }

    app.listen(PORT, () => {
      console.log(`Attendance Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Attendance Service: MongoDB connection error:', err);
    process.exit(1);
  });
