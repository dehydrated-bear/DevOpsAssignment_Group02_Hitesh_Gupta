const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { generateToken } = require('../utils/token');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Please provide name, email, and password', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password });

  const token = generateToken({ id: user._id, role: user.role });

  res.status(201).json({
    success: true,
    token,
    user
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await User.findByEmail(email);
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    success: true,
    token,
    user
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'taskCount'
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (name && name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { name: name ? name.trim() : req.user.name } },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getMe
};