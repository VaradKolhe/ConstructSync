const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const mongoose = global.mongooseInstance || require('mongoose');
const User = require('../models/UserMinimal');
const SystemSetting = require('../models/SystemSettingMinimal');

const protect = async (req, res, next) => {
  let token;

  // FR-2.9: Read token from HTTP-only cookie first
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } 
  // Fallback to Authorization header (for legacy/testing)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized, no token', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // --- GLOBAL MAINTENANCE PROTOCOL ---
    try {
      if (req.user.role !== 'ADMIN') {
        const maintenanceSetting = await SystemSetting.findOne({ key: 'MAINTENANCE_MODE' }).maxTimeMS(2000);
        if (maintenanceSetting && (maintenanceSetting.value === true || maintenanceSetting.value === 'true')) {
          return ApiResponse.error(res, 'SYSTEM OFFLINE: Global maintenance in progress. Only Admin access authorized.', 503);
        }
      }
    } catch (dbError) {
      console.error('[AuthMiddleware] Maintenance check failed, bypassing:', dbError.message);
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired', 401);
    }
    return ApiResponse.error(res, 'Not authorized, token failed', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`[Auth] 403 Forbidden: User role ${req.user?.role} not in authorized roles [${roles.join(', ')}]`);
      return ApiResponse.error(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
