const Labour = require('../models/Labour');
const ApiResponse = require('../../../common/utils/apiResponse');

/**
 * Register a new labourer
 */
exports.createLabour = async (req, res, next) => {
  try {
    const { labourId, name, skills, phone, address } = req.body;

    const exists = await Labour.findOne({ labourId });
    if (exists) {
      return ApiResponse.error(res, 'Labour ID already exists', 400);
    }

    const labour = await Labour.create({ labourId, name, skills, phone, address });
    return ApiResponse.success(res, 'Labour registered successfully', labour, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all labourers (with filters)
 */
exports.getAllLabours = async (req, res, next) => {
  try {
    const { status, skill, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (skill) query.skills = { $in: [skill] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { labourId: { $regex: search, $options: 'i' } },
      ];
    }

    const labours = await Labour.find(query);
    return ApiResponse.success(res, 'Labours fetched successfully', labours);
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
 * Update labourer
 */
exports.updateLabour = async (req, res, next) => {
  try {
    const labour = await Labour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!labour) return ApiResponse.error(res, 'Labour not found', 404);
    return ApiResponse.success(res, 'Labour updated successfully', labour);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete labourer
 */
exports.deleteLabour = async (req, res, next) => {
  try {
    const labour = await Labour.findByIdAndDelete(req.params.id);
    if (!labour) return ApiResponse.error(res, 'Labour not found', 404);
    return ApiResponse.success(res, 'Labour deleted successfully');
  } catch (error) {
    next(error);
  }
};
