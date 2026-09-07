import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/db.js';
import { generateToken } from '../src/utils/token.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Apply the schema.sql to the connected (test) database.
 */
export const initSchema = async () => {
  const schemaPath = path.join(process.cwd(), 'src', 'config', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
};

/**
 * Remove all rows from every table so each test starts clean.
 */
export const resetDb = async () => {
  await pool.query('TRUNCATE TABLE password_reset_tokens, notes, users RESTART IDENTITY CASCADE');
};

/**
 * Insert a user directly and return the stored row.
 */
export const createUser = async ({ name, email, password }) => {
  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, passwordHash]
  );
  return result.rows[0];
};

/**
 * Build an Authorization header for a given user id.
 */
export const authHeader = (userId) => `Bearer ${generateToken(userId)}`;

/**
 * Insert a note directly and return the created note.
 */
export const createNoteRow = async ({ userId, title, content, category = 'Personal', tags = '', theme = 'purple', isTrashed = false }) => {
  const result = await pool.query(
    `INSERT INTO notes (user_id, title, content, category, tags, theme, is_trashed)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, title, content, category, tags, theme, is_trashed, created_at, updated_at`,
    [userId, title, content, category, tags, theme, isTrashed]
  );
  return result.rows[0];
};

export const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'StrongPass1',
};

export default pool;