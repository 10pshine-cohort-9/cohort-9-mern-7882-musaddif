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
 * Validate that a PostgreSQL connection URL is configured and well-formed.
 */
export const assertDbConfig = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in your .env file.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// protocol.');
  }
};

const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.trim(),
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
export const testDbConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`PostgreSQL connected successfully at ${result.rows[0].now}`);

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
