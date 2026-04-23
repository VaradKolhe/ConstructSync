const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Set global instance for middleware BEFORE requiring app
global.mongooseInstance = mongoose;
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

  // Create the user in memory DB to satisfy protect middleware
  // The User model is already registered in UserMinimal.js via common
  await mongoose.model('User').create({
    _id: adminId,
    email: 'admin@test.com',
    role: 'ADMIN',
    isActive: true,
    refreshToken: 'mock-refresh-token'
  });
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

  describe('Advanced Deployment Features', () => {
    it('should redeploy labour to a new site and close the old one', async () => {
      const newSiteId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/deployments/redeploy')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          labourId,
          newSiteId,
          reason: 'Site A project finished'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.redeployReason).toBe('Site A project finished');
      expect(res.body.data.siteId).toBe(newSiteId.toString());

      // Verify old deployment is completed
      const oldDeployments = await Deployment.find({ labourId, status: 'COMPLETED' });
      expect(oldDeployments.length).toBeGreaterThan(0);
    });

    it('should create a labour group', async () => {
      const res = await request(app)
        .post('/api/deployments/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Foundation Team A',
          members: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('Foundation Team A');
    });

    it('should fetch contract expiry alerts', async () => {
      // Create a deployment expiring in 3 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);

      await Deployment.create({
        labourId: new mongoose.Types.ObjectId(),
        siteId: new mongoose.Types.ObjectId(),
        assignedBy: adminId,
        status: 'ACTIVE',
        contractEndDate: expiryDate,
        startDate: new Date()
      });

      const res = await request(app)
        .get('/api/deployments/alerts')
        .query({ threshold: 7 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
