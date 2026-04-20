const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

// Define or get a minimal Attendance model for seeding
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', new mongoose.Schema({
  labourId: mongoose.Schema.Types.ObjectId,
  siteId: mongoose.Schema.Types.ObjectId,
  date: Date,
  checkInTime: Date,
  checkOutTime: Date,
  totalHours: Number,
  status: String
}, { strict: false }), 'attendances');

let mongoServer;
let adminToken;
let adminId = new mongoose.Types.ObjectId();

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '6.0.1' }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  process.env.JWT_SECRET = 'testsecret';
  adminToken = jwt.sign(
    { id: adminId, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Reporting Service Integration Tests', () => {
  const siteId = new mongoose.Types.ObjectId();
  const labourId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    // Seed some attendance data
    await Attendance.create([
      {
        labourId,
        siteId,
        date: new Date('2026-04-19T00:00:00.000Z'),
        checkInTime: new Date('2026-04-19T08:00:00.000Z'),
        checkOutTime: new Date('2026-04-19T17:00:00.000Z'),
        totalHours: 9,
        status: 'PRESENT'
      },
      {
        labourId,
        siteId,
        date: new Date('2026-04-20T00:00:00.000Z'),
        checkInTime: new Date('2026-04-20T08:00:00.000Z'),
        checkOutTime: new Date('2026-04-20T16:00:00.000Z'),
        totalHours: 8,
        status: 'PRESENT'
      }
    ]);
  });

  it('should generate an attendance report for a site', async () => {
    const res = await request(app)
      .get('/api/reporting/attendance')
      .query({ 
        siteId: siteId.toString(),
        startDate: '2026-04-18',
        endDate: '2026-04-21'
      })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('should generate a payroll summary report', async () => {
    const res = await request(app)
      .get('/api/reporting/payroll')
      .query({ 
        startDate: '2026-04-18',
        endDate: '2026-04-21'
      })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    const summary = res.body.data.find(s => s._id === labourId.toString());
    expect(summary).toBeDefined();
    expect(summary.totalWorkedHours).toBe(17);
    expect(summary.daysPresent).toBe(2);
  });

  it('should return 400 if siteId is missing for attendance report', async () => {
    const res = await request(app)
      .get('/api/reporting/attendance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
  });

  it('should return empty array for a site with no attendance records', async () => {
    const randomSiteId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get('/api/reporting/attendance')
      .query({ siteId: randomSiteId.toString() })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 500 (handled by middleware) for invalid siteId format', async () => {
    const res = await request(app)
      .get('/api/reporting/attendance')
      .query({ siteId: 'invalid-id' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
