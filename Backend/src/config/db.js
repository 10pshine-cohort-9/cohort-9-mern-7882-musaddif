import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Validate that database credentials are configured. Fails fast (rather than
 * silently connecting with default credentials) when required values are
 * missing. Host/port defaults are kept: they are not secrets.
 */
export const assertDbConfig = () => {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length > 0) {
    const hint = `Set ${missing.join(', ')} in your .env file — the server refuses to start with fallback credentials.`;
    throw new Error(`Database credentials are not configured. ${hint}`);
  }
};

const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Pool sizing & timeouts: without a max, the pg default of 10 connections is
  // shared by every request, and slow queries can hold slots indefinitely.
  // These bounds let the pool absorb bursts and fail fast instead of queueing
  // forever. Raise PG_POOL_MAX to match your Postgres limits (and front with
  // PgBouncer at higher scale).
  max: toNumber(process.env.PG_POOL_MAX, 20),
  idleTimeoutMillis: toNumber(process.env.PG_POOL_IDLE_TIMEOUT, 30000),
  connectionTimeoutMillis: toNumber(process.env.PG_CONNECT_TIMEOUT, 10000),
  statement_timeout: toNumber(process.env.PG_STATEMENT_TIMEOUT, 30000),
  query_timeout: toNumber(process.env.PG_QUERY_TIMEOUT, 30000),
  application_name: process.env.PG_APP_NAME || 'notes-backend',
  allowExitOnIdle: false,
});

// A crashed backend should not kill the whole process; log instead.
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

// Utility to verify database connection and initialize tables on startup
export const testDbConnection = async (dbNameOverride) => {
  let client;
  try {
    const targetPool = dbNameOverride ? new Pool({ ...pool.options, database: dbNameOverride }) : pool;
    client = await targetPool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`PostgreSQL connected successfully at ${result.rows[0].now}`);

    if (!dbNameOverride) {
      // Idempotent, cwd-independent schema bootstrap (schema.sql uses
      // IF NOT EXISTS everywhere, and the path is resolved relative to this
      // module). Concurrent replicas may both attempt bootstrap — the loser of
      // the race is harmless, so a schema hiccup is logged, never fatal.
      const schemaPath = path.join(__dirname, 'schema.sql');
      try {
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(schemaSql);
          logger.info('Database tables initialized successfully.');
        }
      } catch (schemaError) {
        logger.warn({ err: schemaError }, 'Schema bootstrap skipped (idempotent, safe to retry)');
      }
    }

    client.release();
    return true;
  } catch (error) {
    logger.error({ err: error }, 'PostgreSQL connection failed');
    if (client) {
      client.release();
    }
    return false;
  }
};

export default pool;
