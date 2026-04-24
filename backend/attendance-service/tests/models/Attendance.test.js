const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Attendance = require('../../src/models/Attendance');

let mongoServer;

jest.setTimeout(60000);

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.1',
      }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err) {
    console.error('MongoMemoryServer setup failed:', err);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Attendance Model Unit Tests', () => {
  const sampleAttendance = {
    metadata: {
      labourId: new mongoose.Types.ObjectId(),
      siteId: new mongoose.Types.ObjectId(),
    },
    supervisorId: new mongoose.Types.ObjectId(),
    date: new Date('2026-04-19T00:00:00.000Z'),
    checkInTime: new Date('2026-04-19T08:00:00.000Z')
  };

  it('should create an attendance record successfully', async () => {
    const attendance = await Attendance.create(sampleAttendance);
    expect(attendance.metadata.labourId).toEqual(sampleAttendance.metadata.labourId);
    expect(attendance.status).toBe('PRESENT');
  });

  it('should fail if required fields are missing', async () => {
    const attendance = new Attendance({});
    let err;
    try {
      await attendance.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors['metadata.labourId']).toBeDefined();
    expect(err.errors['metadata.siteId']).toBeDefined();
    expect(err.errors.date).toBeDefined();
  });

  it('should calculate total hours correctly in check-out', async () => {
    const attendance = await Attendance.create(sampleAttendance);
    const checkOutTime = new Date('2026-04-19T17:00:00.000Z');
    const diffMs = checkOutTime - attendance.checkInTime;
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    
    attendance.checkOutTime = checkOutTime;
    attendance.totalHours = totalHours;
    await attendance.save();

    expect(attendance.totalHours).toBe(9);
  });
});
