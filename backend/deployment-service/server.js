const mongoose = require('mongoose');
global.mongooseInstance = mongoose;
const dotenv = require('dotenv');
const app = require('./src/app');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Deployment Service: Connected to MongoDB');

    // Force creation of collections
    const Site = require('./src/models/Site');
    const Deployment = require('./src/models/Deployment');
    const LabourGroup = require('./src/models/LabourGroup');

    try {
      await Site.createCollection();
      await Deployment.createCollection();
      await LabourGroup.createCollection();
      console.log('Deployment Service: Collections initialized');
    } catch (err) {
      console.log('Deployment Service: Collections already exist');
    }

    app.listen(PORT, () => {
      console.log(`Deployment Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Deployment Service: MongoDB connection error:', err);
    process.exit(1);
  });
