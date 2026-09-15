const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired, please log in again', 401);
    }
    throw new AppError('Invalid token', 401);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated', 401);
  }

  req.user = user;
  next();
});

const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };