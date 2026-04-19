const User = require('../models/User');

/**
 * Seeds the default admin user if it doesn't exist.
 * This function should be called after the database connection is established.
 */
const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (adminExists) {
      console.log('Admin already exists.');
      return;
    }

    await User.create({
      name: 'System Admin',
      email: 'admin@test.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false, // Admin doesn't need to change password on first login
      isEmailVerified: true
    });

    console.log('Default Admin Created: admin@test.com / admin123');
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

module.exports = seedAdmin;
