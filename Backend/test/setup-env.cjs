/* Preload hook for Mocha (CommonJS) - runs before any ESM test file is loaded.
 * Creates the test database if it does not exist and points the app pool at it.
 */
require('dotenv').config();
const { Pool } = require('pg');

const TEST_DB_NAME = 'notes_db_test';

const requireDatabaseUrl = () => {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
    throw new Error('DATABASE_URL must be set (tests refuse to use fallback credentials).');
  }
  return process.env.DATABASE_URL.trim();
};

const bootstrap = async () => {
  const databaseUrl = requireDatabaseUrl();
  const testDatabaseUrl = new URL(databaseUrl);

  const adminPool = new Pool({ connectionString: databaseUrl });

  try {
    const exists = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
    if (exists.rows.length === 0) {
      // CREATE DATABASE cannot run inside a transaction block
      const quotedTestDbName = TEST_DB_NAME.replaceAll('"', '""');
      await adminPool.query(`CREATE DATABASE "${quotedTestDbName}"`);
    }
  } finally {
    await adminPool.end();
  }

  // Point the application pool at the test database
  testDatabaseUrl.pathname = `/${encodeURIComponent(TEST_DB_NAME)}`;
  process.env.DATABASE_URL = testDatabaseUrl.toString();
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