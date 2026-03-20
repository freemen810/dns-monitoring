import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import db from './db.js';
import { initializeScheduler, shutdownScheduler } from './cron.js';
import { errorHandler } from './middleware/errorHandler.js';

import monitorsRouter from './routes/monitors.js';
import resultsRouter from './routes/results.js';
import alertsRouter from './routes/alerts.js';
import statsRouter from './routes/stats.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));

// Routes
app.use('/api/monitors', monitorsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function start() {
  try {
    await initializeScheduler();

    app.listen(PORT, () => {
      console.log(`DNS Monitor API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  shutdownScheduler();
  try {
    await db.close();
  } catch (error) {
    console.error('Error closing database:', error);
  }
  process.exit(0);
});

start();
