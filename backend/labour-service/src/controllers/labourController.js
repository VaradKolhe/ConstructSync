const mongoose = require('mongoose');
const Labour = require('../models/Labour');
const ReferenceData = require('../models/ReferenceData');
const ApiResponse = require('../../../common/utils/apiResponse');
const { logAudit } = require('../../../common/utils/auditLogger');

/**
 * Helper to validate skills against DB
 */
const validateSkills = async (skills) => {
  if (!skills || !Array.isArray(skills)) return true;
  if (skills.length === 0) return false; // Must have at least one skill

  const validSkills = await ReferenceData.find({
    type: 'SKILL_TYPE',
    isActive: true
  }).select('name');
  
  const validSkillNames = validSkills.map(s => s.name);
  return skills.every(s => validSkillNames.includes(s));
};

/**
 * Register a new labourer (FR-1.1)
 */
exports.createLabour = async (req, res, next) => {
  try {
    const { 
      name, dateOfBirth, gender, phone, 
      emergencyContact, address, skills, aadhaarNumber,
      profilePhoto, bankDetails, employmentHistory 
    } = req.body;

    // Validate skills
    const isSkillsValid = await validateSkills(skills);
    if (!isSkillsValid) {
      return ApiResponse.error(res, 'Invalid Skill Matrix: Specializations must be verified', 400);
    }

    // FR-1.5: Duplicate Aadhaar detection
    const exists = await Labour.findOne({ aadhaarNumber });
    if (exists) {
      return ApiResponse.error(res, 'Aadhaar/ID Number already exists', 400);
    }

    const labour = await Labour.create({ 
      name, dateOfBirth, gender, phone, 
      emergencyContact, address, skills, aadhaarNumber,
      profilePhoto, bankDetails, employmentHistory 
    });

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'LABOUR_CREATED',
      module: 'LABOUR',
      details: { labourId: labour.labourId, name: labour.name },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Labour registered successfully', labour, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all labourers (with filters) (FR-1.8)
 */
exports.getAllLabours = async (req, res, next) => {
  try {
    const { status, skill, search, page = 1, limit = 50, includeInactive, siteId } = req.query;
    
    let query = {};
    
    if (includeInactive === 'false') {
      query.isActive = true;
    }

    // Filter by siteId if provided (Supervisor visibility constraint)
    if (siteId) {
      const deployments = await mongoose.connection.db.collection('deployments').find({
        siteId: new mongoose.Types.ObjectId(siteId),
        status: 'ACTIVE'
      }).toArray();
      
      const labourIds = deployments.map(d => d.labourId);
      query._id = { $in: labourIds };
    }

    if (status) query.status = status;
    if (skill) query.skills = { $regex: new RegExp(`^${skill}$`, 'i') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { labourId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { aadhaarNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // FR-1.8: Pagination
    const skip = (page - 1) * limit;
    const labours = await Labour.find(query)
      .sort({ isActive: -1, createdAt: -1 }) // Show active ones first
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Labour.countDocuments(query);

    return ApiResponse.success(res, 'Labours fetched successfully', {
      labours,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get labour by ID
 */
exports.getLabourById = async (req, res, next) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) return ApiResponse.error(res, 'Labour not found', 404);
    return ApiResponse.success(res, 'Labour details fetched', labour);
  } catch (error) {
    next(error);
  }
};

/**
 * Update labourer (FR-1.6)
 */
exports.updateLabour = async (req, res, next) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) return ApiResponse.error(res, 'Labour not found', 404);

    // Validate skills if provided
    if (req.body.skills) {
      const isSkillsValid = await validateSkills(req.body.skills);
      if (!isSkillsValid) {
        return ApiResponse.error(res, 'Invalid Skill Matrix: Specializations must be verified', 400);
      }
    }

    // FR-1.6: Log edits with editor name (with role suffix) and timestamp
    const editorId = req.user.id;
    const roleSuffix = req.user.role ? ` (${req.user.role})` : '';
    const editorName = `${req.user.name || 'System User'}${roleSuffix}`;
    
    labour.editHistory.push({
      editorName,
      timestamp: new Date(),
      changes: req.body
    });

    labour.lastEditor = editorId;
    
    // Apply updates
    Object.assign(labour, req.body);
    
    const updatedLabour = await labour.save();
    
    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'LABOUR_UPDATED',
      module: 'LABOUR',
      details: { labourId: updatedLabour.labourId, changes: req.body },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Labour updated successfully', updatedLabour);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete labourer (FR-1.7)
 */
exports.deleteLabour = async (req, res, next) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) return ApiResponse.error(res, 'Labour not found', 404);

    // FR-1.7: Support soft deletion
    labour.isActive = false;
    await labour.save();

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'LABOUR_DEACTIVATED',
      module: 'LABOUR',
      details: { labourId: labour.labourId, name: labour.name },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Labour deactivated successfully');
  } catch (error) {
    next(error);
  }
};
