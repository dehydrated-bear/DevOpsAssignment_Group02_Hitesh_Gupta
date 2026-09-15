const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, search, sortBy = 'createdAt', order = 'desc' } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const filter = { user: req.user.id };

  if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
    filter.status = status;
  }

  if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
    filter.priority = priority;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(200).json({ success: true, data: task });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, tags } = req.body;

  if (!title) {
    throw new AppError('Task title is required', 400);
  }

  const task = await Task.create({
    title,
    description: description || '',
    status: status || 'pending',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    tags: tags || [],
    user: req.user.id
  });

  res.status(201).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  }

  if (req.body.status === 'completed') {
    task.completedAt = new Date();
  } else if (task.status !== 'completed') {
    task.completedAt = null;
  }

  await task.save();

  res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await task.complete();

  res.status(200).json({ success: true, data: task });
});

const getStats = asyncHandler(async (req, res) => {
  const rows = await Task.countByStatus(req.user.id);

  const stats = {
    pending: 0,
    'in-progress': 0,
    completed: 0
  };

  for (const row of rows) {
    stats[row._id] = row.count;
  }

  stats.total = rows.reduce((sum, row) => sum + row.count, 0);

  res.status(200).json({ success: true, data: stats });
});

const getDueSoon = asyncHandler(async (req, res) => {
  const hours = parseInt(req.query.hours, 10) || 24;
  const tasks = await Task.dueSoon(req.user.id, hours);

  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getStats,
  getDueSoon
};