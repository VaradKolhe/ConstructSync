const mongoose = require('mongoose');
const ReferenceData = require('../src/models/ReferenceData');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/constructsync_db';

const skills = [
  { type: 'SKILL_TYPE', code: 'MASONRY', name: 'Masonry' },
  { type: 'SKILL_TYPE', code: 'WELDING', name: 'Welding' },
  { type: 'SKILL_TYPE', code: 'ELECTRICAL', name: 'Electrical' },
  { type: 'SKILL_TYPE', code: 'PLUMBING', name: 'Plumbing' },
  { type: 'SKILL_TYPE', code: 'CARPENTRY', name: 'Carpentry' },
  { type: 'SKILL_TYPE', code: 'RIGGING', name: 'Rigging' },
  { type: 'SKILL_TYPE', code: 'PAINTING', name: 'Painting' },
  { type: 'SKILL_TYPE', code: 'FLOORING', name: 'Flooring' },
  { type: 'SKILL_TYPE', code: 'GENERAL_LABOUR', name: 'General Labour' },
];

const seedSkills = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding skills...');

    for (const skill of skills) {
      await ReferenceData.findOneAndUpdate(
        { code: skill.code, type: 'SKILL_TYPE' },
        skill,
        { upsert: true, new: true }
      );
    }

    console.log('Skills seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding skills:', err);
    process.exit(1);
  }
};

seedSkills();
