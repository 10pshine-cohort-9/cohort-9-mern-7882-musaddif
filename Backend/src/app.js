import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import pool from './config/db.js';

dotenv.config();

const app = express();

// 1. Configure CORS
const clientUrl = process.env.CLIENT_URL ;
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// 2. Request Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = false;
  try {
    const result = await pool.query('SELECT 1');
    dbStatus = result.rows.length > 0;
  } catch (err) {
    dbStatus = false;
  }

  return res.status(200).json({
    success: true,
    message: 'Server is running.',
    databaseConnected: dbStatus,
  });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Requested API endpoint not found.',
  });
});

// 6. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);

  const isProduction = process.env.NODE_ENV === 'production';
  const status = err.status || 500;

  return res.status(status).json({
    success: false,
    message: isProduction ? 'Something went wrong.' : err.message || 'Something went wrong.',
  });
});

export default app;
