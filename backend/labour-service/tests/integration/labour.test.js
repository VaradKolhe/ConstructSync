const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Labour = require('../../src/models/Labour');
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

  // Seed Reference Data for skill validation
  await ReferenceData.create([
    { name: 'Plumbing', type: 'SKILL_TYPE', code: 'SKL_PLUMB' },
    { name: 'Electrical', type: 'SKILL_TYPE', code: 'SKL_ELEC' }
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Labour Service Integration Tests (SRS Compliant)', () => {
  let labourObjectId;

  it('Step 1: Create a new labourer and verify auto-ID (FR-1.2)', async () => {
    const res = await request(app)
      .post('/api/labours')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Jane Doe',
        dateOfBirth: '1995-05-20',
        gender: 'FEMALE',
        phone: '9988776655',
        emergencyContact: '1122334455',
        address: '456 Construction Rd',
        skills: ['Plumbing'],
        aadhaarNumber: '5555-4444-3333',
        bankDetails: {
          accountHolder: 'JANE DOE',
          accountNumber: '112233',
          bankName: 'B1',
          ifscCode: 'I1'
        }
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.labourId).toMatch(/^LBR-\d{8}-\d{4}$/);
    labourObjectId = res.body.data._id;
  });

  it('Step 2: Detect duplicate Aadhaar (FR-1.5)', async () => {
    const res = await request(app)
      .post('/api/labours')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Another Jane',
        dateOfBirth: '1995-05-20',
        gender: 'FEMALE',
        phone: '111',
        emergencyContact: '222',
        address: 'Addr',
        skills: ['Plumbing'],
        aadhaarNumber: '5555-4444-3333', // Duplicate
        bankDetails: {
          accountHolder: 'AJ',
          accountNumber: '445566',
          bankName: 'B2',
          ifscCode: 'I2'
        }
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Aadhaar/ID Number already exists');
  });

  it('Step 3: Update profile and verify audit log (FR-1.6)', async () => {
    const res = await request(app)
      .put(`/api/labours/${labourObjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skills: ['Plumbing', 'Electrical']
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.editHistory.length).toBeGreaterThan(0);
    expect(res.body.data.editHistory[0].editorName).toBe('Admin User (ADMIN)');
  });

  it('Step 4: Soft delete and verify invisibility in lists (FR-1.7)', async () => {
    // Verify it exists in list first
    const listBefore = await request(app)
      .get('/api/labours?includeInactive=false')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listBefore.body.data.labours.some(l => l._id === labourObjectId)).toBe(true);

    // Deactivate
    const delRes = await request(app)
      .delete(`/api/labours/${labourObjectId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.statusCode).toBe(200);

    // Verify it's gone from list
    const listAfter = await request(app)
      .get('/api/labours?includeInactive=false')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listAfter.body.data.labours.some(l => l._id === labourObjectId)).toBe(false);

    // Verify it's still in DB but inactive
    const hiddenInDB = await Labour.findById(labourObjectId);
    expect(hiddenInDB.isActive).toBe(false);
  });

  it('Step 5: Verify pagination default (FR-1.8)', async () => {
    const res = await request(app)
      .get('/api/labours')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.pagination.limit).toBe(50);
  });

  it('Step 6: Search labour by ID or Aadhaar', async () => {
    const labourIdSearch = await Labour.findById(labourObjectId);
    
    // Search by Labour ID
    const resId = await request(app)
      .get(`/api/labours?search=${labourIdSearch.labourId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(resId.statusCode).toBe(200);
    expect(resId.body.data.labours.length).toBe(1);

    // Search by Aadhaar
    const resAadhaar = await request(app)
      .get(`/api/labours?search=${labourIdSearch.aadhaarNumber}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(resAadhaar.statusCode).toBe(200);
    expect(resAadhaar.body.data.labours.length).toBe(1);
  });
});
