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
  const todayStr = new Date().toISOString().split('T')[0];

  it('should mark check-in for a labourer', async () => {
    const res = await request(app)
      .post('/api/attendances/check-in')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        labourId,
        siteId,
        date: todayStr
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
        date: todayStr
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
      .query({ date: todayStr })
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

  describe('Anomaly Flagging & Edits', () => {
    let anomalyAttendanceId;

    it('should flag anomaly if check-out results in > 12 hours', async () => {
      // Create a record with check-in 13 hours ago
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 13);

      const res = await request(app)
        .post('/api/attendances/check-in')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          labourId: new mongoose.Types.ObjectId(),
          siteId,
          date: new Date().toISOString().split('T')[0]
        });

      anomalyAttendanceId = res.body.data._id;

      // Manually update checkInTime to 13 hours ago for testing
      await mongoose.model('Attendance').findByIdAndUpdate(anomalyAttendanceId, { checkInTime: pastTime });

      const checkOutRes = await request(app)
        .put(`/api/attendances/check-out/${anomalyAttendanceId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send();

      expect(checkOutRes.statusCode).toBe(200);
      expect(checkOutRes.body.data.isAnomaly).toBe(true);
      expect(checkOutRes.body.data.totalHours).toBeGreaterThan(12);
    });

    it('should allow supervisor to edit attendance on the same day', async () => {
      const res = await request(app)
        .put(`/api/attendances/${attendanceId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          status: 'HALF-DAY'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('HALF-DAY');

      // Verify Audit Log
      const audit = await mongoose.model('AttendanceAudit').findOne({ attendanceId });
      expect(audit).toBeDefined();
      expect(audit.action).toBe('EDIT');
    });

    it('should NOT allow supervisor to edit attendance for a past day', async () => {
      // Create a past record
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      pastDate.setUTCHours(0, 0, 0, 0);

      const pastRecord = await mongoose.model('Attendance').create({
        labourId: new mongoose.Types.ObjectId(),
        siteId,
        supervisorId,
        date: pastDate,
        checkInTime: new Date(pastDate),
        status: 'PRESENT'
      });

      const res = await request(app)
        .put(`/api/attendances/${pastRecord._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          status: 'ABSENT'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Supervisors can only edit attendance for the current day');
    });

    it('should allow admin to edit attendance for a past day', async () => {
      const adminToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Create another past record
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      pastDate.setUTCHours(0, 0, 0, 0);

      const pastRecord = await mongoose.model('Attendance').create({
        labourId: new mongoose.Types.ObjectId(),
        siteId,
        supervisorId,
        date: pastDate,
        checkInTime: new Date(pastDate),
        status: 'PRESENT'
      });

      const res = await request(app)
        .put(`/api/attendances/${pastRecord._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'LEAVE'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('LEAVE');
    });
  });
});
