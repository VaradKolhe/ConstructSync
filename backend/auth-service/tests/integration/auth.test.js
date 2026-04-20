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
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Service Integration Tests', () => {
  let adminToken;
  let userToken;
  let tempPassword;
  let otp;
  const userEmail = 'worker@test.com';

  beforeEach(async () => {
    // Clear users and seed admin for each test if necessary, 
    // but for this sequence, we might want to preserve state or run in order.
    jest.clearAllMocks();
  });

  // Step 1: Admin Login
  it('Step 1: Admin should login successfully', async () => {
    await seedAdmin(); // Ensure admin exists
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;
  });

  // Step 2: Register New User
  it('Step 2: Admin should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Worker',
        email: userEmail,
        role: 'HR'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(sendEmail).toHaveBeenCalled();

    // Capture temporary password from email mock call
    const emailHtml = sendEmail.mock.calls[0][0].html;
    const match = emailHtml.match(/Temporary Password:.*?<span[^>]*>\s*([a-f0-9]+)\s*<\/span>/i);
    tempPassword = match ? match[1].trim() : null;
    expect(tempPassword).toBeDefined();
    expect(tempPassword).not.toBeNull();
  });

  // Step 3: User First Login
  it('Step 3: New user should login with temporary password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: tempPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isFirstLogin).toBe(true);
    expect(res.body.data.token).toBeDefined();
    userToken = res.body.data.token;
  });

  // Step 4: Request OTP & Verify Email
  it('Step 4a: User should request OTP', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .set('Authorization', `Bearer ${userToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalled();

    // Capture OTP from email mock call
    const emailHtml = sendEmail.mock.calls[0][0].html; // First call in this test block
    const match = emailHtml.match(/<span[^>]*>\s*(\d{6})\s*<\/span>/);
    otp = match ? match[1].trim() : null;
    expect(otp).toBeDefined();
    expect(otp).not.toBeNull();
  });

  it('Step 4b: User should verify email with OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ otp });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Check DB
    const user = await User.findOne({ email: userEmail });
    expect(user.isEmailVerified).toBe(true);
  });

  // Step 5: Complete Onboarding
  it('Step 5: User should complete onboarding with permanent password', async () => {
    const res = await request(app)
      .post('/api/auth/complete-onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        newPassword: 'Permanent@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user is no longer in first login state
    const user = await User.findOne({ email: userEmail });
    expect(user.isFirstLogin).toBe(false);

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: 'Permanent@123'
      });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.data.isFirstLogin).toBe(false);
  });
});
