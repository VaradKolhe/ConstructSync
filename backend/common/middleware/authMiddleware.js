const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const mongoose = global.mongooseInstance || require('mongoose');
const User = require('../models/UserMinimal');

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
    
    // SECURITY UPGRADE: Check if user session still exists in DB
    // This makes "Kill Session" instant
    const user = await User.findById(decoded.id).select('refreshToken isActive');

    if (!user || !user.refreshToken || !user.isActive) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return ApiResponse.error(res, 'Session terminated or account deactivated', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
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
