const mongoose = require('mongoose');
global.mongooseInstance = mongoose;
const dotenv = require('dotenv');
const app = require('./src/app');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Labour Service: Connected to MongoDB');

    // Force creation of collections to ensure they exist in DB
    const Labour = require('./src/models/Labour');
    const ReferenceData = require('./src/models/ReferenceData');
    
    try {
      await Labour.createCollection();
      await ReferenceData.createCollection();
      console.log('Labour Service: Collections initialized');
    } catch (err) {
      console.log('Labour Service: Collections already exist');
    }

    app.listen(PORT, () => {
      console.log(`Labour Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Labour Service: MongoDB connection error:', err);
    process.exit(1);
  });
