```javascript
import cors from 'cors';
import express from 'express';

import { clientOrigin } from './config/env.js';

import healthRoutes from './routes/health.routes.js';
import donorRoutes from './routes/donors.routes.js';
import bloodRequestRoutes from './routes/blood-requests.routes.js';
import medicalDocumentRoutes from './routes/medical-documents.routes.js';
import hospitalRoutes from './routes/hospitals.routes.js';
import bloodInventoryRoutes from './routes/blood-inventory.routes.js';
import reservationRoutes from './routes/reservations.routes.js';
import transferRoutes from './routes/transfers.routes.js';

const app = express();

app.use(
  cors({
    origin: clientOrigin === '*' ? true : clientOrigin,
  })
);

app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/medical-documents', medicalDocumentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/blood-inventory', bloodInventoryRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/transfers', transferRoutes);

app.use((error, request, response, next) => {
  if (error?.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({
        error: 'Medical document must be 10 MB or smaller.',
      });
    }

    return response.status(400).json({ error: error.message });
  }

  if (
    error instanceof Error &&
    error.message === 'Only PDF, JPG, JPEG and PNG files are allowed.'
  ) {
    return response.status(400).json({ error: error.message });
  }

  if (error?.name === 'ValidationError') {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.errors,
    });
  }

  if (error?.code === 11000) {
    return response.status(409).json({
      error: 'This donor already exists.',
    });
  }

  console.error('Request failed:', error);

  return response.status(500).json({
    error: error?.message || 'Internal server error',
  });
});

export default app;
```