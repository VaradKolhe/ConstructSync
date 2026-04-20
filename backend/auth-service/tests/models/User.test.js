const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Model Unit Tests', () => {
  it('should hash the password before saving', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'HR'
    };
    const user = await User.create(userData);
    expect(user.password).not.toBe(userData.password);
    expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash length
  });

  it('should correctly compare password', async () => {
    const user = await User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123',
      role: 'SUPERVISOR'
    });
    const isMatch = await user.comparePassword('password123');
    const isNotMatch = await user.comparePassword('wrongpassword');
    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });

  it('should fail if required fields are missing', async () => {
    const user = new User({});
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  it('should enforce unique email constraint', async () => {
    await User.create({
      name: 'User 1',
      email: 'unique@example.com',
      password: 'password123',
      role: 'HR'
    });
    
    let err;
    try {
      await User.create({
        name: 'User 2',
        email: 'unique@example.com',
        password: 'password123',
        role: 'SUPERVISOR'
      });
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should validate email format', async () => {
    const user = new User({
      name: 'Invalid Email',
      email: 'invalid-email',
      password: 'password123',
      role: 'HR'
    });
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });
});
