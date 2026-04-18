const Site = require('../models/Site');
const Deployment = require('../models/Deployment');
const ApiResponse = require('../../../common/utils/apiResponse');

/**
 * Create a new construction site
 */
exports.createSite = async (req, res, next) => {
  try {
    const { name, location, supervisorId } = req.body;
    const site = await Site.create({ name, location, supervisorId });
    return ApiResponse.success(res, 'Site created successfully', site, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign labour to a site
 */
exports.assignLabour = async (req, res, next) => {
  try {
    const { labourId, siteId, startDate } = req.body;

    // Check if labour is already active elsewhere
    const activeAssignment = await Deployment.findOne({ labourId, status: 'ACTIVE' });
    if (activeAssignment) {
      return ApiResponse.error(res, 'Labour is already assigned to an active site', 400);
    }

    const deployment = await Deployment.create({
      labourId,
      siteId,
      startDate: startDate || new Date(),
    });

    return ApiResponse.success(res, 'Labour assigned successfully', deployment, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Complete an assignment
 */
exports.completeAssignment = async (req, res, next) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) return ApiResponse.error(res, 'Assignment not found', 404);

    deployment.status = 'COMPLETED';
    deployment.endDate = new Date();
    await deployment.save();

    return ApiResponse.success(res, 'Assignment completed successfully', deployment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sites
 */
exports.getAllSites = async (req, res, next) => {
  try {
    const sites = await Site.find();
    return ApiResponse.success(res, 'Sites fetched successfully', sites);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active deployments for a site
 */
exports.getSiteDeployments = async (req, res, next) => {
  try {
    const deployments = await Deployment.find({
      siteId: req.params.siteId,
      status: 'ACTIVE',
    });
    return ApiResponse.success(res, 'Site deployments fetched', deployments);
  } catch (error) {
    next(error);
  }
};
