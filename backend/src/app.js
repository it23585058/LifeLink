const cors = require('cors');
const express = require('express');

const { clientOrigin } = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const donorRoutes = require('./routes/donors.routes');
const bloodRequestRoutes = require('./routes/blood-requests.routes');
const hospitalRoutes = require('./routes/hospitals.routes');
const bloodInventoryRoutes = require('./routes/blood-inventory.routes');
const reservationRoutes = require('./routes/reservations.routes');
const transferRoutes = require('./routes/transfers.routes');

const app = express();

app.use(cors({ origin: clientOrigin === '*' ? true : clientOrigin }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/blood-inventory', bloodInventoryRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/transfers', transferRoutes);

app.use((error, request, response, next) => {
  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: 'Validation failed', details: error.errors });
  }

  if (error.code === 11000) {
    return response.status(409).json({ error: 'This donor response already exists.' });
  }

  console.error('Request failed:', error.message);
  return response.status(500).json({ error: 'Internal server error' });
});

module.exports = app;