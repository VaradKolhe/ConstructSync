const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Deployment = require('../../src/models/Deployment');

let mongoServer;

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '6.0.1' }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Deployment Model Unit Tests', () => {
  it('should create a deployment successfully', async () => {
    const deploymentData = {
      labourId: new mongoose.Types.ObjectId(),
      siteId: new mongoose.Types.ObjectId(),
      assignedBy: new mongoose.Types.ObjectId(),
      startDate: new Date()
    };
    const deployment = await Deployment.create(deploymentData);
    expect(deployment.status).toBe('ACTIVE');
  });

  it('should fail if required fields are missing', async () => {
    const deployment = new Deployment({});
    let err;
    try {
      await deployment.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.labourId).toBeDefined();
    expect(err.errors.siteId).toBeDefined();
    expect(err.errors.assignedBy).toBeDefined();
  });
});
