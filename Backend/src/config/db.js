import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'notes_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export const testDbConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`[Database] PostgreSQL connected successfully at ${result.rows[0].now}`);
    // Auto-create database tables from schema.sql if they don't exist
    const schemaPath = path.join(process.cwd(), 'src', 'config', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('[Database] Database tables initialized successfully.');
    }
    return true;
  } catch (error) {
    console.error(`[Database Error] PostgreSQL connection failed: ${error.message}`);
    return false;
  } finally {
    client?.release();
  }
}
export default pool;
