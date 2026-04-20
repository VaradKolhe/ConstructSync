const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Labour = require('../../src/models/Labour');

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

describe('Labour Service Integration Tests', () => {
  let labourId;

  it('should create a new labourer', async () => {
    const res = await request(app)
      .post('/api/labours')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labourId: 'L001',
        name: 'John Doe',
        phone: '9876543210',
        skills: ['Carpentry'],
        address: '123 Test St'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labourId).toBe('L001');
    labourId = res.body.data._id;
  });

  it('should list all labourers', async () => {
    const res = await request(app)
      .get('/api/labours')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get a specific labourer by ID', async () => {
    const res = await request(app)
      .get(`/api/labours/${labourId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('John Doe');
  });

  it('should update a labourer profile', async () => {
    const res = await request(app)
      .put(`/api/labours/${labourId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Updated',
        skills: ['Carpentry', 'Masonry']
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('John Updated');
    expect(res.body.data.skills).toContain('Masonry');
  });

  it('should delete a labourer', async () => {
    const res = await request(app)
      .delete(`/api/labours/${labourId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get(`/api/labours/${labourId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(checkRes.statusCode).toBe(404);
  });
});
