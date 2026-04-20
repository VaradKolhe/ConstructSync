const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const seedAdmin = require('../../src/config/seedAdmin');
const sendEmail = require('../../src/utils/emailSender');

// Mock email sender
jest.mock('../../src/utils/emailSender');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '6.0.1' }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Service Integration Tests (Security Hardened)', () => {
  let adminToken;
  let userToken;
  let tempPassword;
  let otp;
  let cookies;
  const userEmail = 'worker@test.com';

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  // Step 1: Admin Login
  it('Step 1: Admin should login and receive HTTP-only cookies (FR-2.9)', async () => {
    await seedAdmin(); // Ensure admin exists
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Check for cookies
    const cookieHeader = res.get('Set-Cookie');
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader.some(c => c.includes('accessToken'))).toBe(true);
    expect(cookieHeader.some(c => c.includes('refreshToken'))).toBe(true);
    expect(cookieHeader.some(c => c.includes('HttpOnly'))).toBe(true);

    cookies = cookieHeader;
  });

  // Step 2: Register New User
  it('Step 2: Admin should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies) // Use cookies for auth
      .send({
        name: 'Test Worker',
        email: userEmail,
        role: 'HR'
      });

    expect(res.statusCode).toBe(201);
    expect(sendEmail).toHaveBeenCalled();

    const emailHtml = sendEmail.mock.calls[0][0].html;
    const match = emailHtml.match(/Temporary Password:.*?<span[^>]*>\s*([a-f0-9]+)\s*<\/span>/i);
    tempPassword = match[1].trim();
  });

  // Step 3: Account Lockout Test (FR-2.6)
  it('Step 3: Should lock account after 5 failed attempts', async () => {
    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'wrongpassword' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: tempPassword });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/locked/i);
  });

  // Unlock for further tests (Admin action required by SRS, but we'll just clear in DB for speed)
  it('Step 4: Admin should unlock user (simulated)', async () => {
    const user = await User.findOne({ email: userEmail });
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: tempPassword });

    expect(res.statusCode).toBe(200);
    const cookieHeader = res.get('Set-Cookie');
    userToken = cookieHeader; // Store cookies for worker
  });
});
