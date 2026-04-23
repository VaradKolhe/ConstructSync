const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const ReferenceData = require('../../src/models/ReferenceData');

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
    { id: adminId, role: 'ADMIN', name: 'Admin User' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Seed some reference data
  await ReferenceData.create([
    { name: 'Plumber', type: 'SKILL_TYPE', code: 'SKL_PLUMB', isActive: true },
    { name: 'Electrician', type: 'SKILL_TYPE', code: 'SKL_ELEC', isActive: true }
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Reference Data Service Integration Tests', () => {
  it('should fetch reference data without colliding with labour :id route', async () => {
    const res = await request(app)
      .get('/api/labours/reference-data?type=SKILL_TYPE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.map(d => d.name)).toContain('Plumber');
  });

  it('should return 404 for non-existent labour ID (verifying :id route still works)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/labours/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
