import mongoose from 'mongoose';

async function connectDatabase(mongodbUri, databaseName) {
  await mongoose.connect(mongodbUri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10_000,
  });
}

function getDatabaseStatus() {
  return [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting',
  ][mongoose.connection.readyState];
}

export {
  connectDatabase,
  getDatabaseStatus,
};