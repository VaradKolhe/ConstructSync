const Labour = require('../models/Labour');
const ApiResponse = require('../../../common/utils/apiResponse');

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

    return ApiResponse.success(res, 'Labour registered successfully', labour, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all labourers (with filters and soft-delete aware) (FR-1.8)
 */
exports.getAllLabours = async (req, res, next) => {
  try {
    const { status, skill, search, page = 1, limit = 50 } = req.query;
    
    // FR-1.7: Only fetch non-deleted profiles
    let query = { isActive: true };

    if (status) query.status = status;
    if (skill) query.skills = { $in: [skill] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { labourId: { $regex: search, $options: 'i' } },
      ];
    }

    // FR-1.8: Pagination
    const skip = (page - 1) * limit;
    const labours = await Labour.find(query)
      .sort({ createdAt: -1 })
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
    const labour = await Labour.findOne({ _id: req.params.id, isActive: true });
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
    if (!labour || !labour.isActive) return ApiResponse.error(res, 'Labour not found', 404);

    // FR-1.6: Log edits with editor name and timestamp
    const editorId = req.user.id;
    const editorName = req.user.name || 'System User';
    
    labour.editHistory.push({
      editorName,
      timestamp: new Date(),
      changes: req.body // Simplified: storing the incoming body as change set
    });

    labour.lastEditor = editorId;
    
    // Apply updates
    Object.assign(labour, req.body);
    
    const updatedLabour = await labour.save();
    
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

    return ApiResponse.success(res, 'Labour deactivated successfully');
  } catch (error) {
    next(error);
  }
};
