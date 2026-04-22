const mongoose = require('mongoose');
global.mongooseInstance = mongoose;
const dotenv = require('dotenv');
const app = require('./src/app');
const seedAdmin = require('./src/config/seedAdmin');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Auth Service: Connected to MongoDB');
    
    // Seed admin user
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Auth Service: Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Auth Service: MongoDB connection error:', err);
    process.exit(1);
  });
