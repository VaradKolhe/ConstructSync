const { Labour, Deployment, Attendance, User, SystemAuditLog } = require('../models/MinimalModels');
const ApiResponse = require('../../../common/utils/apiResponse');

/**
 * Get Admin Dashboard KPIs (FR-6.1)
 */
exports.getDashboardKPIs = async (req, res, next) => {
  try {
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
      ? ((todayAttendanceCount / activeDeployments) * 100).toFixed(2) 
      : 0;

    // Recent logins
    const recentLogins = await User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(5)
      .select('name email lastLogin role');

    return ApiResponse.success(res, 'Dashboard KPIs fetched', {
      totalLabour,
      activeDeployments,
      attendanceRate: parseFloat(attendanceRate),
      recentLogins
    });
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
