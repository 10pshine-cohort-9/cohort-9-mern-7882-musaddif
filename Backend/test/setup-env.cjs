/* Preload hook for Mocha (CommonJS) - runs before any ESM test file is loaded.
 * Creates the test database if it does not exist and points the app pool at it.
 */
require('dotenv').config();
const { Pool } = require('pg');

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'notes_db_test';
const adminDb = process.env.DB_NAME || 'notes_db';

const requireConfig = (key) => {
  if (!process.env[key] || !process.env[key].trim()) {
    throw new Error(`${key} must be set (tests refuse to use fallback credentials).`);
  }
  return process.env[key].trim();
};

const bootstrap = async () => {
  const dbUser = requireConfig('DB_USER');
  const dbPassword = requireConfig('DB_PASSWORD');
  const dbName = requireConfig('DB_NAME');

  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: adminDb,
    user: dbUser,
    password: dbPassword,
  });

  const exists = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
  if (exists.rows.length === 0) {
    // CREATE DATABASE cannot run inside a transaction block
    await adminPool.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  }
  await adminPool.end();

  // Point the application pool at the test database
  process.env.DB_NAME = TEST_DB_NAME;
  process.env.NODE_ENV = 'test';
  if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = 'warn';
  }
};

bootstrap()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Test database bootstrap failed:', err.message);
    process.exit(1);
  });