import dns from 'node:dns';

import app from './app.js';
import { connectDatabase } from './config/database.js';
import { databaseName, mongodbUri } from './config/env.js';
import authRoutes from './routes/auth.js';

dns.setServers(['1.1.1.1']);

const port = Number(process.env.PORT || 5000);

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