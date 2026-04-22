const ReferenceData = require('../models/ReferenceData');
const ApiResponse = require('../../../common/utils/apiResponse');
const { logAudit } = require('../../../common/utils/auditLogger');

exports.createReferenceData = async (req, res, next) => {
  try {
    const { type, code, name, description } = req.body;
    const refData = await ReferenceData.create({ type, code, name, description });

    await logAudit({
      userId: req.user.id,
      action: 'REFERENCE_DATA_CREATED',
      module: 'LABOUR',
      details: { id: refData._id, type, code },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Reference data created successfully', refData, 201);
  } catch (error) {
    next(error);
  }
};

exports.getAllReferenceData = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const data = await ReferenceData.find(query);
    return ApiResponse.success(res, 'Reference data fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

exports.updateReferenceData = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    const refData = await ReferenceData.findById(req.params.id);
    if (!refData) return ApiResponse.error(res, 'Reference data not found', 404);

    if (name) refData.name = name;
    if (description) refData.description = description;
    if (isActive !== undefined) refData.isActive = isActive;

    await refData.save();

    await logAudit({
      userId: req.user.id,
      action: 'REFERENCE_DATA_UPDATED',
      module: 'LABOUR',
      details: { id: refData._id, changes: req.body },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Reference data updated successfully', refData);
  } catch (error) {
    next(error);
  }
};

exports.deleteReferenceData = async (req, res, next) => {
  try {
    const refData = await ReferenceData.findByIdAndDelete(req.params.id);
    if (!refData) return ApiResponse.error(res, 'Reference data not found', 404);

    await logAudit({
      userId: req.user.id,
      action: 'REFERENCE_DATA_DELETED',
      module: 'LABOUR',
      details: { id: refData._id, type: refData.type, code: refData.code },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Reference data deleted successfully');
  } catch (error) {
    next(error);
  }
};
