import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'notes_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
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
      // Auto-create database tables from schema.sql if they don't exist
      const schemaPath = path.join(process.cwd(), 'src', 'config', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        logger.info('Database tables initialized successfully.');
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
