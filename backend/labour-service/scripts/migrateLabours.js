const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the labour-service .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const legacyCollection = db.collection('labour');
    const activeCollection = db.collection('labours');

    const legacyDocs = await legacyCollection.find({}).toArray();
    console.log(`Found ${legacyDocs.length} documents in legacy 'labour' collection.`);

    if (legacyDocs.length === 0) {
      console.log('No documents to migrate.');
      process.exit(0);
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const doc of legacyDocs) {
      // Check if already exists in active collection by labourId or aadhaar
      const existing = await activeCollection.findOne({ 
        $or: [
          { labourId: doc.labourId },
          { aadhaarNumber: doc.aadhaarNumber }
        ]
      });

      if (existing) {
        console.log(`Skipping existing labour: ${doc.labourId || doc.name}`);
        skippedCount++;
        continue;
      }

      // Prepare for insertion into 'labours'
      // Ensure all required fields exist or have defaults
      const newDoc = {
        ...doc,
        skills: doc.skills || ['GENERAL_WORKER'],
        status: doc.status || 'AVAILABLE',
        isActive: doc.isActive !== undefined ? doc.isActive : true,
        editHistory: doc.editHistory || [],
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date()
      };

      await activeCollection.insertOne(newDoc);
      migratedCount++;
    }

    console.log(`Migration Complete:`);
    console.log(`- Migrated: ${migratedCount}`);
    console.log(`- Skipped (Duplicates): ${skippedCount}`);
    
    if (migratedCount > 0) {
        console.log('Verifying active collection count...');
        const finalCount = await activeCollection.countDocuments();
        console.log(`Final count in 'labours': ${finalCount}`);
    }

    console.log('NOTE: Redundant collection "labour" still exists. Drop it manually after manual verification if desired.');
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();