const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Site = require('../../src/models/Site');
const Deployment = require('../../src/models/Deployment');

let mongoServer;
let adminToken;
let adminId = new mongoose.Types.ObjectId();
let supervisorId = new mongoose.Types.ObjectId();
let labourId = new mongoose.Types.ObjectId();

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

describe('Deployment Service Integration Tests', () => {
  let siteId;
  let assignmentId;

  it('should create a new construction site', async () => {
    const res = await request(app)
      .post('/api/deployments/sites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Site 1',
        location: 'Location 1',
        supervisorId
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Site 1');
    siteId = res.body.data._id;
  });

  it('should list all sites', async () => {
    const res = await request(app)
      .get('/api/deployments/sites')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should assign labour to the site', async () => {
    const res = await request(app)
      .post('/api/deployments/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labourId,
        siteId,
        startDate: '2026-04-19'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');
    assignmentId = res.body.data._id;
  });

  it('should not allow assigning labour to another site if already active', async () => {
    const anotherSiteId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/deployments/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labourId,
        siteId: anotherSiteId,
        startDate: '2026-04-20'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Labour is already assigned to an active site');
  });

  it('should mark assignment as complete', async () => {
    const res = await request(app)
      .put(`/api/deployments/complete/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.endDate).toBeDefined();
  });

  it('should fetch active deployments for a site', async () => {
    // First create a new assignment since the previous one was completed
    const newLabourId = new mongoose.Types.ObjectId();
    await request(app)
      .post('/api/deployments/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        labourId: newLabourId,
        siteId,
        startDate: '2026-04-19'
      });

    const res = await request(app)
      .get(`/api/deployments/site/${siteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});
