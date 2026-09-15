const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    dueDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10,
        message: 'A task can have at most 10 tags'
      }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A task must belong to a user']
    },
    attachmentCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

taskSchema.methods.complete = async function () {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
  return this;
};

taskSchema.methods.reopen = async function () {
  this.status = 'pending';
  this.completedAt = null;
  await this.save();
  return this;
};

taskSchema.statics.countByStatus = function (userId) {
  return this.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
};

taskSchema.statics.dueSoon = function (userId, hours = 24) {
  const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.find({
    user: userId,
    dueDate: { $lte: cutoff, $gte: new Date() },
    status: { $ne: 'completed' }
  }).sort({ dueDate: 1 });
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;