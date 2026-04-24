const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Set global instance for middleware BEFORE requiring app
global.mongooseInstance = mongoose;
const app = require('../../src/app');

let mongoServer;
let hrToken;
let hrId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  jest.setTimeout(60000);
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '6.0.1' }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  process.env.JWT_SECRET = 'testsecret';
  hrToken = jwt.sign(
    { id: hrId, role: 'HR' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Seed Maintenance Mode setting to avoid buffering timeouts in middleware
  await mongoose.connection.collection('system_settings').insertOne({
    key: 'MAINTENANCE_MODE',
    value: false,
    lastUpdated: new Date()
  });

  // Seed some data for aggregation
  const labourId = new mongoose.Types.ObjectId();
  const siteId = new mongoose.Types.ObjectId();

  await mongoose.connection.collection('labours').insertOne({
    _id: labourId,
    name: 'John Doe',
    labourId: 'LBR-001',
    skills: ['Mason'],
    monthlySalary: 30000,
    isActive: true
  });

  await mongoose.connection.collection('sites').insertOne({
    _id: siteId,
    name: 'Downtown Plaza'
  });

  await mongoose.connection.collection('attendances').insertOne({
    metadata: {
      labourId,
      siteId,
    },
    date: new Date(),
    status: 'PRESENT',
    totalHours: 8,
    checkInTime: new Date(),
    checkOutTime: new Date()
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) await mongoServer.stop();
});

describe('Reporting Service Integration Tests', () => {
  it('should generate attendance report with filters', async () => {
    const res = await request(app)
      .get('/api/reporting/attendance')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe('John Doe');
  }, 10000);

  it('should filter report by search text (Name/ID)', async () => {
    // Search for existing
    const resFound = await request(app)
      .get('/api/reporting/attendance')
      .query({ search: 'John' })
      .set('Authorization', `Bearer ${hrToken}`);
    
    expect(resFound.statusCode).toBe(200);
    expect(resFound.body.data.length).toBe(1);

    // Search for non-existing
    const resNone = await request(app)
      .get('/api/reporting/attendance')
      .query({ search: 'UnknownUserXYZ' })
      .set('Authorization', `Bearer ${hrToken}`);
    
    expect(resNone.statusCode).toBe(200);
    expect(resNone.body.data.length).toBe(0);
  }, 10000);

  it('should calculate total earnings correctly in payroll report', async () => {
    const res = await request(app)
      .get('/api/reporting/payroll')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    const payroll = res.body.data[0];
    
    // Monthly salary seeded was 30000. 
    // 1 day present = 1 * (30000/30) = 1000
    expect(payroll.totalEarnings).toBe(1000);
  }, 10000);

  it('should export payroll excel', async () => {
    const res = await request(app)
      .get('/api/reporting/export/excel')
      .query({ type: 'payroll' })
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toContain('spreadsheetml');
  }, 10000);

  it('should export pdf report', async () => {
    const res = await request(app)
      .get('/api/reporting/export/pdf')
      .query({ type: 'attendance' })
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
  }, 10000);

  it('should fetch report logs for Admin', async () => {
    const adminToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a log entry first
    await mongoose.model('ReportLog').create({
      generatedBy: hrId,
      reportType: 'ATTENDANCE',
      parameters: {}
    });

    const res = await request(app)
      .get('/api/reporting/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  }, 10000);
});

