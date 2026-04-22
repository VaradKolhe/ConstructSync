const { Labour, Deployment, Attendance, User, SystemAuditLog } = require('../models/MinimalModels');
const ApiResponse = require('../../../common/utils/apiResponse');

/**
 * Get Dashboard KPIs (Role-Specific) (FR-6.1)
 */
exports.getDashboardKPIs = async (req, res, next) => {
  try {
    const role = req.user.role;
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
      const masonryCount = await Labour.countDocuments({ isActive: true, skills: 'MASON' });
      const helperCount = await Labour.countDocuments({ isActive: true, skills: 'HELPER' });
      
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
      // Find one site the supervisor might be assigned to (mocking site assignment for now)
      const site = await Site.findOne();
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
    next(error);
  }
};

/**
 * Get System Audit Logs (FR-6.3)
 */
exports.getSystemAuditLogs = async (req, res, next) => {
  try {
    const { user, actionType, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (user) query.userId = user;
    if (actionType) query.action = actionType;
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
