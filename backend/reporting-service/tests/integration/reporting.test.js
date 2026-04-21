const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

let mongoServer;
let hrToken;
let hrId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  jest.setTimeout(20000);
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

  // Seed some data for aggregation
  const labourId = new mongoose.Types.ObjectId();
  const siteId = new mongoose.Types.ObjectId();

  await mongoose.connection.collection('labours').insertOne({
    _id: labourId,
    name: 'John Doe',
    labourId: 'LBR-001',
    skillType: 'Mason',
    isActive: true
  });

  await mongoose.connection.collection('sites').insertOne({
    _id: siteId,
    name: 'Downtown Plaza'
  });

  await mongoose.connection.collection('attendances').insertOne({
    labourId,
    siteId,
    date: new Date(),
    status: 'PRESENT',
    totalHours: 8,
    checkInTime: new Date(),
    checkOutTime: new Date()
  });
});

afterAll(async () => {
  await mongoose.disconnect();
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
  });

  it('should export payroll excel', async () => {
    const res = await request(app)
      .get('/api/reporting/export/excel')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toContain('spreadsheetml');
  });

  it('should export pdf report', async () => {
    const res = await request(app)
      .get('/api/reporting/export/pdf')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
  });

  it('should fetch report logs for Admin', async () => {
    const adminToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/reporting/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
