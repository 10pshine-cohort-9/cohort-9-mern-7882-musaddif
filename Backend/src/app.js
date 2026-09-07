import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import pool from './config/db.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

// 1. HTTP request/response logging (Pino)
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// 2. Configure CORS
const clientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// 3. Request Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = false;
  try {
    const result = await pool.query('SELECT 1');
    dbStatus = result.rows.length > 0;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    dbStatus = false;
  }

  return res.status(200).json({
    success: true,
    message: 'Server is running.',
    databaseConnected: dbStatus,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// 5. 404 Handler
app.use((req, res) => {
  logger.warn({ method: req.method, url: req.originalUrl }, 'Endpoint not found');
  return res.status(404).json({
    success: false,
    message: 'Requested API endpoint not found.',
  });
});

// 6. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');

  const isProduction = process.env.NODE_ENV === 'production';
  const status = err.status || 500;

  return res.status(status).json({
    success: false,
    message: isProduction ? 'Something went wrong.' : err.message || 'Something went wrong.',
  });
});

export default app;
