const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');

const protect = (req, res, next) => {
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
      return ApiResponse.error(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
