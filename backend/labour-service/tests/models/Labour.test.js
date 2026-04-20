const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Labour = require('../../src/models/Labour');

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

describe('Labour Model Unit Tests', () => {
  it('should create a labour record successfully', async () => {
    const labourData = {
      labourId: 'L001',
      name: 'John Doe',
      phone: '9876543210',
      skills: ['Carpentry'],
      address: '123 Test St'
    };
    const labour = await Labour.create(labourData);
    expect(labour.labourId).toBe(labourData.labourId);
    expect(labour.status).toBe('AVAILABLE');
  });

  it('should fail if required fields are missing', async () => {
    const labour = new Labour({});
    let err;
    try {
      await labour.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.labourId).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.phone).toBeDefined();
  });

  it('should enforce unique labourId', async () => {
    await Labour.create({
      labourId: 'UNIQUE001',
      name: 'User 1',
      phone: '1111111111'
    });
    
    let err;
    try {
      await Labour.create({
        labourId: 'UNIQUE001',
        name: 'User 2',
        phone: '2222222222'
      });
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
