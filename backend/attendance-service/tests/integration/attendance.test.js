const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Attendance = require('../../src/models/Attendance');

let mongoServer;
let supervisorToken;
let supervisorId = new mongoose.Types.ObjectId();
let labourId = new mongoose.Types.ObjectId();
let siteId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.1',
    }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  process.env.JWT_SECRET = 'testsecret';
  supervisorToken = jwt.sign(
    { id: supervisorId, role: 'SUPERVISOR' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Attendance Service Integration Tests', () => {
  let attendanceId;

  it('should mark check-in for a labourer', async () => {
    const res = await request(app)
      .post('/api/attendances/check-in')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        labourId,
        siteId,
        date: '2026-04-19'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labourId).toBe(labourId.toString());
    attendanceId = res.body.data._id;
  });

  it('should not allow duplicate check-in for the same day', async () => {
    const res = await request(app)
      .post('/api/attendances/check-in')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        labourId,
        siteId,
        date: '2026-04-19'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Attendance already marked for this labourer today');
  });

  it('should mark check-out for the labourer', async () => {
    const res = await request(app)
      .put(`/api/attendances/check-out/${attendanceId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.data.checkOutTime).toBeDefined();
    expect(res.body.data.totalHours).toBeGreaterThanOrEqual(0);
  });

  it('should fetch site attendance', async () => {
    const res = await request(app)
      .get(`/api/attendances/site/${siteId}`)
      .query({ date: '2026-04-19' })
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('should fetch labour history', async () => {
    const res = await request(app)
      .get(`/api/attendances/labour/${labourId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('should return 400 when trying to check-out an already checked-out record', async () => {
    const res = await request(app)
      .put(`/api/attendances/check-out/${attendanceId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send();

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Already checked out');
  });

  it('should return 404 for a non-existent attendance ID on check-out', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/attendances/check-out/${fakeId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send();

    expect(res.statusCode).toBe(404);
  });
});
