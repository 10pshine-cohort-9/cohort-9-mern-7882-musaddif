import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import pool from './config/db.js';
import logger from './utils/logger.js';
import { getClientOrigins } from './utils/corsConfig.js';
import aiRoutes from './routes/aiRoutes.js';
import { apiLimiter } from './utils/rateLimiter.js';

dotenv.config();

const app = express();

// Hide the Express framework signature (X-Powered-By).
app.disable('x-powered-by');

// Trust the configured number of proxy hops so rate limiting sees the real
// client IP when deployed behind a reverse proxy (set TRUST_PROXY accordingly).
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// Security headers (Helmet). CSP on the JSON API is minimal (it only serves
// data, never HTML); the SPA's own CSP is delivered by the frontend build.
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // API consumed cross-origin; not an embeddable document
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // served to web + mobile clients
    strictTransportSecurity: isProduction ? { maxAge: 15552000, includeSubDomains: true } : false,
  })
);

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

// 2. Configure CORS — allow-list configured via CLIENT_URL only. Never `*`.
//    Requests without an Origin header (curl, native mobile clients,
//    same-origin proxied requests) are allowed; unknown browser origins are
//    rejected with 403 so they never receive credentials.
const clientOrigins = getClientOrigins();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (clientOrigins.includes(origin)) return callback(null, true);
      const err = new Error('Origin not allowed by CORS.');
      err.status = 403;
      return callback(err);
    },
    credentials: true,
  })
);

// 3. Request Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Response compression for large note payloads (before routes). Express keeps
// its default weak ETags, so conditional GETs (If-None-Match -> 304) work.
app.use(compression());

// Global API rate limiting (route-specific stricter limits are applied in the
// auth and AI route files).
app.use('/api', apiLimiter);

// 4. Health Check Endpoints
// Liveness: process is alive — no database touch, safe for load balancer probes
// to hit frequently without adding DB load.
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running.',
  });
});

// Readiness: process is up AND can serve requests (database reachable).
app.get('/api/health/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      message: 'Ready.',
      databaseConnected: true,
    });
  } catch (err) {
    logger.error({ err }, 'Readiness check failed');
    return res.status(503).json({
      success: false,
      message: 'Not ready.',
      databaseConnected: false,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use("/api/ai", aiRoutes);


// 5. 404 Handler
app.use((req, res) => {
  logger.warn({ method: req.method, url: req.originalUrl }, 'Endpoint not found');
  return res.status(404).json({
    success: false,
    message: 'Requested API endpoint not found.',
  });
});

// 6. Centralized Error Handling Middleware
// In production, respond with a generic message so internal details (SQL
// errors, stack traces, dependency internals) are never exposed to clients.
// Full error details are still captured server-side by the logger above.
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
