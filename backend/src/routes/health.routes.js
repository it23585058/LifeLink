const express = require('express');

const { getDatabaseStatus } = require('../config/database');

const router = express.Router();

router.get('/', (request, response) => {
  const databaseStatus = getDatabaseStatus();
  const isHealthy = databaseStatus === 'connected';

  response.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    database: databaseStatus,
  });
});

module.exports = router;