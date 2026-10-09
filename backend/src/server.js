const dns = require('node:dns');

const app = require('./app');
const { connectDatabase } = require('./config/database');
const { databaseName, mongodbUri, port } = require('./config/env');
const authRoutes = require('./routes/auth');

dns.setServers(['1.1.1.1']);

app.use('/api/auth', authRoutes);

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