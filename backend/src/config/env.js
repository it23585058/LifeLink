const dotenv = require('dotenv');

dotenv.config();

const requiredEnvironmentVariables = ['MONGODB_URI'];

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(`${variableName} is required. Copy backend/.env.example to backend/.env and set it locally.`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI,
  databaseName: process.env.MONGODB_DB_NAME || 'LifeLink',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
};