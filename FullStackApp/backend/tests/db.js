const mongoose = require('mongoose');

let dbSetup = false;

async function setupTestDB() {
  if (dbSetup) {
    return;
  }

  const uri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/taskmanager_test';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  dbSetup = true;
}

async function teardownDB() {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
}

async function clearCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

module.exports = { setupTestDB, teardownDB, clearCollections };