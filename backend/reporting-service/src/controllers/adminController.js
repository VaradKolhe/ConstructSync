const { Labour, Deployment, Attendance, User, SystemAuditLog, Site, SystemSetting } = require('../models/MinimalModels');
const ApiResponse = require('../../../common/utils/apiResponse');

/**
 * Get Dashboard KPIs (Role-Specific) (FR-6.1)
 */
exports.getDashboardKPIs = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const data = {};

    // 1. Common KPIs (Total Labour & Active Deployments)
    const totalLabour = await Labour.countDocuments({ isActive: true });
    const activeDeployments = await Deployment.countDocuments({ status: 'ACTIVE' });
    
    // Today's attendance rate
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayAttendanceCount = await Attendance.countDocuments({
      date: today,
      status: { $in: ['PRESENT', 'HALF-DAY'] }
    });
    
    const attendanceRate = activeDeployments > 0 
      ? ((todayAttendanceCount / activeDeployments) * 100).toFixed(1) 
      : 0;

    data.kpis = {
      totalLabour,
      activeDeployments,
      attendanceRate: parseFloat(attendanceRate)
    };

    // 2. ADMIN Role Specific Data
    if (role === 'ADMIN') {
      data.recentLogins = await User.find({ lastLogin: { $exists: true } })
        .sort({ lastLogin: -1 })
        .limit(5)
        .select('name email lastLogin role');
      
      data.systemStatus = {
        auth: 'Operational',
        database: 'Encrypted',
        gateway: 'Protected'
      };
    }

    // 3. HR Role Specific Data
    if (role === 'HR') {
      // Skill distribution for HR
      const masonryCount = await Labour.countDocuments({ isActive: true, skills: 'Masonry' });
      const helperCount = await Labour.countDocuments({ isActive: true, skills: 'General Labour' });
      
      data.workforceStats = {
        masonry: masonryCount,
        helpers: helperCount,
        others: totalLabour - (masonryCount + helperCount)
      };

      // Recent Registrations
      data.recentRegistrations = await Labour.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name labourId skills createdAt');
    }

    // 4. SUPERVISOR Role Specific Data
    if (role === 'SUPERVISOR') {
      // Find the site assigned to THIS supervisor
      const site = await Site.findOne({ supervisorId: userId });
      if (site) {
        data.assignedSite = {
          name: site.name,
          location: site.location,
          onSiteCount: await Attendance.countDocuments({ siteId: site._id, date: today, status: 'PRESENT' }),
          pendingCheckOut: await Attendance.countDocuments({ siteId: site._id, date: today, status: 'PRESENT', checkOutTime: null })
        };
      }
    }

    return ApiResponse.success(res, 'Dashboard KPIs fetched', data);
  } catch (error) {
    console.error("Dashboard KPI Error:", error);
    next(error);
  }
};

/**
 * Get System Audit Logs (Enhanced Search) (FR-6.3)
 */
exports.getSystemAuditLogs = async (req, res, next) => {
  try {
    const { user, actionType, module, search, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (user) query.userId = user;
    if (actionType) query.action = actionType;
    if (module) query.module = module;
    
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { 'details.name': { $regex: search, $options: 'i' } },
        { 'details.labourId': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await SystemAuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SystemAuditLog.countDocuments(query);

    return ApiResponse.success(res, 'System audit logs fetched', {
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Global System Settings
 */
exports.getSystemSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    return ApiResponse.success(res, 'System settings fetched', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Global System Setting
 */
exports.updateSystemSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { 
        value, 
        description, 
        updatedBy: req.user.id, 
        lastUpdated: new Date() 
      },
      { upsert: true, new: true }
    );

    return ApiResponse.success(res, `Setting ${key} updated successfully`, setting);
  } catch (error) {
    next(error);
  }
};
