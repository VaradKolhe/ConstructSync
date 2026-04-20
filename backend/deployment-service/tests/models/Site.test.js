const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Site = require('../../src/models/Site');

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

describe('Site Model Unit Tests', () => {
  it('should create a site successfully', async () => {
    const siteData = {
      name: 'Test Site 1',
      location: 'Test Location',
      supervisorId: new mongoose.Types.ObjectId()
    };
    const site = await Site.create(siteData);
    expect(site.name).toBe(siteData.name);
  });

  it('should fail if required fields are missing', async () => {
    const site = new Site({});
    let err;
    try {
      await site.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.location).toBeDefined();
    expect(err.errors.supervisorId).toBeDefined();
  });
});
