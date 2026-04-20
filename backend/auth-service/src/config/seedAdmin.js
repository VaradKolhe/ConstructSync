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
      password: 'admin123',
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: true, // Force password change
      isEmailVerified: false // Force email verification
    });

    console.log('Default Admin Created: admin@test.com / admin123');
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

module.exports = seedAdmin;
