const mongoose = require('mongoose');
const Site = require('../models/Site');
const Deployment = require('../models/Deployment');
const LabourGroup = require('../models/LabourGroup');
const ApiResponse = require('../../../common/utils/apiResponse');
const { logAudit } = require('../../../common/utils/auditLogger');

/**
 * Create a new construction site (FR-6.4)
 */
exports.createSite = async (req, res, next) => {
  try {
    const { name, location, supervisorId, status } = req.body;
    const site = await Site.create({ name, location, supervisorId, status });
    
    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'SITE_CREATED',
      module: 'DEPLOYMENT',
      details: { siteId: site._id, name: site.name },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Site created successfully', site, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update site definition (FR-6.4)
 */
exports.updateSite = async (req, res, next) => {
  try {
    const { name, location, supervisorId, status, isLocked } = req.body;
    const site = await Site.findById(req.params.id);
    if (!site) return ApiResponse.error(res, 'Site not found', 404);

    if (name) site.name = name;
    if (location) site.location = location;
    if (supervisorId) site.supervisorId = supervisorId;
    if (status) site.status = status;
    
    // Handle Master Lock Toggle
    if (typeof isLocked !== 'undefined') {
      site.isLocked = isLocked;
    }

    await site.save();

    await logAudit(mongoose, {
      userId: req.user.id,
      action: isLocked ? 'SITE_MASTER_LOCKED' : 'SITE_UNLOCKED',
      module: 'DEPLOYMENT',
      details: { siteId: site._id, name: site.name, isLocked: site.isLocked },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Site specifications updated successfully', site);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete site definition (FR-6.4)
 */
exports.deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, 'Invalid Site ID format', 400);
    }

    // BLOCKER: Check for active deployments before deletion
    const activeDeployments = await Deployment.countDocuments({ siteId: id, status: 'ACTIVE' });
    if (activeDeployments > 0) {
      return ApiResponse.error(res, `SECURITY BLOCK: Site has ${activeDeployments} active personnel deployments. Redeploy all labour before decommissioning.`, 403);
    }

    const site = await Site.findByIdAndDelete(id);    if (!site) return ApiResponse.error(res, 'Site not found or already deleted', 404);

    // Clean up all deployments associated with this site (active or completed)
    await Deployment.deleteMany({ siteId: id });

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'SITE_DELETED',
      module: 'DEPLOYMENT',
      details: { siteId: site._id, name: site.name },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Site deleted successfully');
  } catch (error) {
    console.error('Delete Site Error:', error);
    next(error);
  }
};

/**
 * Assign labour to a site (FR-4.1, FR-4.3, FR-4.4)
 */
exports.assignLabour = async (req, res, next) => {
  try {
    const { labourId, siteId, startDate, contractEndDate, role } = req.body;
    const assignedBy = req.user.id;

    // Check if labour is already active elsewhere (FR-4.3)
    const activeAssignment = await Deployment.findOne({ labourId, status: 'ACTIVE' });
    if (activeAssignment) {
      return ApiResponse.error(res, 'Labour is already assigned to an active site', 400);
    }

    const deployment = await Deployment.create({
      labourId,
      siteId,
      assignedBy,
      role,
      startDate: startDate || new Date(),
      contractEndDate,
    });

    return ApiResponse.success(res, 'Labour assigned successfully', deployment, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Redeploy labour from one site to another (FR-4.5, FR-4.4)
 */
exports.redeployLabour = async (req, res, next) => {
  try {
    const { labourId, newSiteId, startDate, contractEndDate, role, reason } = req.body;
    const assignedBy = req.user.id;

    // 1. Find and close the current active deployment
    const activeDeployment = await Deployment.findOne({ labourId, status: 'ACTIVE' });
    if (activeDeployment) {
      activeDeployment.status = 'COMPLETED';
      activeDeployment.endDate = new Date();
      await activeDeployment.save();
    }

    // 2. Create the new deployment
    const newDeployment = await Deployment.create({
      labourId,
      siteId: newSiteId,
      assignedBy,
      role,
      startDate: startDate || new Date(),
      contractEndDate,
      redeployReason: reason || 'Redeployed by HR',
    });

    return ApiResponse.success(res, 'Labour redeployed successfully', newDeployment, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Labour Group (FR-4.2)
 */
exports.createGroup = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    const createdBy = req.user.id;

    const group = await LabourGroup.create({ name, members, createdBy });
    return ApiResponse.success(res, 'Labour Group created successfully', group, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Labour Groups
 */
exports.getAllGroups = async (req, res, next) => {
  try {
    const groups = await LabourGroup.find();
    return ApiResponse.success(res, 'Labour Groups fetched successfully', groups);
  } catch (error) {
    next(error);
  }
};

/**
 * Batch assign a group to a site (FR-4.2)
 */
exports.assignGroup = async (req, res, next) => {
  try {
    const { groupId, siteId, startDate, role } = req.body;
    const assignedBy = req.user.id;

    const group = await LabourGroup.findById(groupId);
    if (!group) return ApiResponse.error(res, 'Labour Group not found', 404);

    const deployments = [];
    for (const labourId of group.members) {
      // Skip if already active
      const active = await Deployment.findOne({ labourId, status: 'ACTIVE' });
      if (!active) {
        const d = await Deployment.create({
          labourId,
          siteId,
          assignedBy,
          role,
          startDate: startDate || new Date(),
        });
        deployments.push(d);
      }
    }

    return ApiResponse.success(res, `${deployments.length} members assigned successfully`, deployments, 201);
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
 * Get active deployments for a site (FR-4.6)
 */
exports.getSiteDeployments = async (req, res, next) => {
  try {
    const deployments = await Deployment.find({
      siteId: req.params.siteId,
      status: 'ACTIVE',
    }).populate('labourId', 'name labourId skills').lean();

    // Calculate duration for each deployment
    const now = new Date();
    const result = deployments.map(d => ({
      ...d,
      durationDays: Math.floor((now - new Date(d.startDate)) / (1000 * 60 * 60 * 24)),
    }));

    return ApiResponse.success(res, 'Site deployments fetched', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active deployment for a specific labourer
 */
exports.getLabourDeployment = async (req, res, next) => {
  try {
    const deployment = await Deployment.findOne({
      labourId: req.params.labourId,
      status: 'ACTIVE',
    }).lean();

    if (!deployment) {
      return ApiResponse.success(res, 'No active deployment found', null);
    }

    const site = await Site.findById(deployment.siteId).lean();
    if (site) {
      deployment.siteName = site.name;
      deployment.siteLocation = site.location;
    }

    const group = await LabourGroup.findOne({ members: req.params.labourId }).lean();
    if (group) {
      deployment.groupName = group.name;
    }

    return ApiResponse.success(res, 'Active deployment fetched', deployment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get alerts for expiring contracts (FR-4.7)
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const thresholdDays = parseInt(req.query.threshold) || 7;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + thresholdDays);

    const expiringDeployments = await Deployment.find({
      status: 'ACTIVE',
      contractEndDate: { $lte: targetDate, $gte: new Date() },
    });

    return ApiResponse.success(res, 'Expiring contracts fetched', expiringDeployments);
  } catch (error) {
    next(error);
  }
};
