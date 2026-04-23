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

describe('Labour Model Unit Tests (SRS Compliant)', () => {
  it('should create a labour record and auto-generate Labour ID', async () => {
    const labourData = {
      name: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      phone: '9876543210',
      emergencyContact: '1234567890',
      address: '123 Construction St',
      skills: ['Masonry'],
      aadhaarNumber: '1234-5678-9012',
      bankDetails: {
        accountHolder: 'JOHN DOE',
        accountNumber: '1234567890',
        bankName: 'HDFC BANK',
        ifscCode: 'HDFC0001234'
      }
    };
    const labour = await Labour.create(labourData);
    expect(labour.labourId).toMatch(/^LBR-\d{8}-\d{4}$/);
    expect(labour.isActive).toBe(true);
  });

  it('should fail if SRS mandatory fields are missing', async () => {
    const labour = new Labour({ name: 'Incomplete' });
    let err;
    try {
      await labour.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.dateOfBirth).toBeDefined();
    expect(err.errors.gender).toBeDefined();
    expect(err.errors.aadhaarNumber).toBeDefined();
  });

  it('should enforce unique Aadhaar number', async () => {
    const commonAadhaar = '9999-8888-7777';
    await Labour.create({
      name: 'User 1',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      phone: '1111111111',
      emergencyContact: '000',
      address: 'Addr',
      skills: ['S1'],
      aadhaarNumber: commonAadhaar,
      bankDetails: {
        accountHolder: 'USER 1',
        accountNumber: '1',
        bankName: 'B1',
        ifscCode: 'I1'
      }
    });
    
    let err;
    try {
      await Labour.create({
        name: 'User 2',
        dateOfBirth: new Date('1992-01-01'),
        gender: 'FEMALE',
        phone: '2222222222',
        emergencyContact: '000',
        address: 'Addr',
        skills: ['S2'],
        aadhaarNumber: commonAadhaar,
        bankDetails: {
          accountHolder: 'USER 2',
          accountNumber: '2',
          bankName: 'B2',
          ifscCode: 'I2'
        }
      });
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
