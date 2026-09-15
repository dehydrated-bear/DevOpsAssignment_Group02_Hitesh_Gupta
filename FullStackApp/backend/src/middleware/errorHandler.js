const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${messages.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyDB = () => {
  return new AppError('Duplicate field value. Please use another value', 400);
};

const errorHandler = (err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.code === 11000) error = handleDuplicateKeyDB();

  const statusCode = error.statusCode || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;