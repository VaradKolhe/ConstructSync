const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (adminExists) {
      console.log('Admin already exists.');
      process.exit(0);
    }

    await User.create({
      name: 'System Admin',
      email: 'admin@test.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      role: 'ADMIN',
      isFirstLogin: true,
      isEmailVerified: false
    });

    console.log('Default Admin Created: admin@test.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
