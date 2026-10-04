const dns = require('node:dns');

dns.setServers(['1.1.1.1']);

const app = require('./app');
const { connectDatabase } = require('./config/database');
const { databaseName, mongodbUri } = require('./config/env');

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDatabase(mongodbUri, databaseName);
  app.listen(port, () => {
    console.log(`LifeLink API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start LifeLink API:', error.message);
  process.exitCode = 1;
});