const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[db] MongoDB connected: ${uri}`);
  } catch (error) {
    console.error('[db] MongoDB connection error:', error.message);
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[db] MongoDB reconnected');
  });

  return mongoose.connection;
}

module.exports = connectDB;