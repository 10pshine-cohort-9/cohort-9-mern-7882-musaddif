import pool from '../config/db.js';
import { validateNoteTitle, validateNoteContent, validateNoteCategory } from '../utils/validation.js';
import { sanitizeNoteHtml, sanitizePlainText } from '../utils/sanitize.js';
import logger from '../utils/logger.js';

/**
 * Create a new note
 * POST /api/notes
 */
export const createNote = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { title, content, category = 'Personal', tags = '', theme = 'purple' } = req.body;

    // Validation
    const titleErr = validateNoteTitle(title);
    if (titleErr) {
      return res.status(400).json({ success: false, message: titleErr });
    }

    const contentErr = validateNoteContent(content);
    if (contentErr) {
      return res.status(400).json({ success: false, message: contentErr });
    }

    const categoryErr = validateNoteCategory(category);
    if (categoryErr) {
      return res.status(400).json({ success: false, message: categoryErr });
    }

    // Data normalization (sanitize BEFORE storing so XSS payloads never reach
    // the database)
    const trimmedTitle = sanitizePlainText(title).trim();
    const trimmedContent = sanitizeNoteHtml(content).trim();
    const trimmedCategory = category.trim();
    const trimmedTags = tags.trim();

    // Insert note into database
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, content, category, tags, theme)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, content, category, tags, theme, is_trashed, created_at, updated_at`,
      [userId, trimmedTitle, trimmedContent, trimmedCategory, trimmedTags, theme]
    );

    const note = result.rows[0];

    logger.info({ userId, noteId: note.id }, 'Note created');

    return res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        theme: note.theme,
        isTrashed: note.is_trashed,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

const PAGE_LIMIT_DEFAULT = 30;
const PAGE_LIMIT_MAX = 100;
const CONTENT_PREVIEW_LENGTH = 300;

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Opaque keyset cursor: base64url of "<updated_at_iso>|<id>". Keyset pagination
// on (updated_at, id) keeps pagination stable as new notes are created and
// avoids the offset-scan cost of OFFSET/LIMIT on large lists.
const encodeCursor = (row) =>
  Buffer.from(`${row.updated_at_key}|${row.id}`, 'utf8').toString('base64url');

const decodeCursor = (raw) => {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const separatorIndex = decoded.lastIndexOf('|');
    if (separatorIndex <= 0) return null;
    const updatedAt = decoded.slice(0, separatorIndex);
    const idText = decoded.slice(separatorIndex + 1);
    if (!updatedAt || !/^\d+$/.test(idText)) return null;
    return { updatedAt, id: parseInt(idText, 10) };
  } catch {
    return null;
  }
};

const getNoteCounts = async (userId) => {
  const [summary, byCategory] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_trashed = FALSE) AS active,
         COUNT(*) FILTER (WHERE is_trashed = TRUE) AS trashed,
         COUNT(*) AS total
       FROM notes
       WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT category, COUNT(*) AS count
       FROM notes
       WHERE user_id = $1 AND is_trashed = FALSE
       GROUP BY category`,
      [userId]
    ),
  ]);

  const s = summary.rows[0];
  const byCategoryMap = {};
  for (const row of byCategory.rows) {
    byCategoryMap[row.category] = Number(row.count);
  }

  return {
    total: Number(s.total),
    active: Number(s.active),
    trashed: Number(s.trashed),
    byCategory: byCategoryMap,
  };
};

/**
 * Get notes for the authenticated user (paginated).
 * GET /api/notes?scope=active|trash|all&category=&q=&cursor=&limit=
 *
 * The list payload omits note.content (full content is served by GET
 * /api/notes/:id); a short plain-text contentPreview is included instead so
 * list UIs can render cards without multi-MB bodies.
 */
export const getNotes = async (req, res, next) => {
  try {
    const userId = req.userId;
    const limit = Math.min(toPositiveInt(req.query.limit, PAGE_LIMIT_DEFAULT), PAGE_LIMIT_MAX);
    const scope = ['active', 'trash', 'all'].includes(req.query.scope) ? req.query.scope : 'active';

    const conditions = ['user_id = $1'];
    const values = [userId];
    let param = 2;

    if (scope === 'active') {
      conditions.push('is_trashed = FALSE');
    } else if (scope === 'trash') {
      conditions.push('is_trashed = TRUE');
    }

    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    if (category && category !== 'All Notes') {
      conditions.push(`category = $${param}`);
      values.push(category);
      param += 1;
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      conditions.push(`(title ILIKE $${param} OR content ILIKE $${param})`);
      values.push(`%${q}%`);
      param += 1;
    }

    const cursor = typeof req.query.cursor === 'string' ? decodeCursor(req.query.cursor) : null;
    if (cursor) {
      conditions.push(
        `(updated_at < $${param}::timestamp OR (updated_at = $${param}::timestamp AND id < $${param + 1}))`
      );
      values.push(cursor.updatedAt, cursor.id);
      param += 2;
    }

    // Fetch limit+1 rows to know whether another page exists.
    const result = await pool.query(
      `SELECT id, title, content, category, tags, theme, is_trashed, created_at, updated_at,
              to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') AS updated_at_key
       FROM notes
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC, id DESC
       LIMIT ${limit + 1}`,
      values
    );

    const rows = result.rows.slice(0, limit);
    const hasMore = result.rows.length > limit;
    const nextCursor = hasMore ? encodeCursor(rows[rows.length - 1]) : null;

    const notes = rows.map((note) => ({
      id: note.id,
      title: note.title,
      contentPreview: sanitizePlainText(note.content).slice(0, CONTENT_PREVIEW_LENGTH),
      category: note.category,
      tags: note.tags,
      theme: note.theme,
      isTrashed: note.is_trashed,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));

    const counts = await getNoteCounts(userId);

    return res.status(200).json({
      success: true,
      notes,
      pagination: { limit, nextCursor, hasMore },
      counts,
      total: notes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single note by ID
 * GET /api/notes/:id
 */
export const getNoteById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Validate ID is a valid integer
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    const result = await pool.query(
      `SELECT id, title, content, category, tags, theme, is_trashed, created_at, updated_at
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    const note = result.rows[0];

    return res.status(200).json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        theme: note.theme,
        isTrashed: note.is_trashed,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a note
 * PUT /api/notes/:id
 */
export const updateNote = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, content, category, tags = '', theme } = req.body;

    // Validate ID
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    // Check if note exists and belongs to user
    const existingNote = await pool.query(
      'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingNote.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    // Validate input
    if (title !== undefined) {
      const titleErr = validateNoteTitle(title);
      if (titleErr) {
        return res.status(400).json({ success: false, message: titleErr });
      }
    }

    if (content !== undefined) {
      const contentErr = validateNoteContent(content);
      if (contentErr) {
        return res.status(400).json({ success: false, message: contentErr });
      }
    }

    if (category !== undefined) {
      const categoryErr = validateNoteCategory(category);
      if (categoryErr) {
        return res.status(400).json({ success: false, message: categoryErr });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [id, userId];
    let paramCounter = 3;

    const fieldSetters = [
      ['title', title, (value) => sanitizePlainText(value).trim()],
      ['content', content, (value) => sanitizeNoteHtml(value).trim()],
      ['category', category, (value) => value.trim()],
      ['tags', tags, (value) => value.trim()],
      ['theme', theme, (value) => value],
    ];

    for (const [column, value, transform] of fieldSetters) {
      if (value !== undefined) {
        updates.push(`${column} = $${paramCounter}`);
        values.push(transform(value));
        paramCounter += 1;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `UPDATE notes
                   SET ${updates.join(', ')}
                   WHERE id = $1 AND user_id = $2
                   RETURNING id, title, content, category, tags, theme, is_trashed, created_at, updated_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    const note = result.rows[0];

    logger.info({ userId, noteId: note.id }, 'Note updated');

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        theme: note.theme,
        isTrashed: note.is_trashed,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move note to trash
 * PUT /api/notes/:id/trash
 */
export const trashNote = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Validate ID
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    const result = await pool.query(
      `UPDATE notes
       SET is_trashed = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, content, category, tags, theme, is_trashed, created_at, updated_at`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    const note = result.rows[0];

    logger.info({ userId, noteId: note.id }, 'Note moved to trash');

    return res.status(200).json({
      success: true,
      message: 'Note moved to trash successfully.',
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        theme: note.theme,
        isTrashed: note.is_trashed,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a trashed note
 * PUT /api/notes/:id/restore
 */
export const restoreNote = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Validate ID
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    const result = await pool.query(
      `UPDATE notes
       SET is_trashed = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, content, category, tags, theme, is_trashed, created_at, updated_at`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    const note = result.rows[0];

    logger.info({ userId, noteId: note.id }, 'Note restored from trash');

    return res.status(200).json({
      success: true,
      message: 'Note restored successfully.',
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        theme: note.theme,
        isTrashed: note.is_trashed,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete a note
 * DELETE /api/notes/:id
 */
export const deleteNote = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Validate ID
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    logger.info({ userId, noteId: id }, 'Note deleted permanently');

    return res.status(200).json({
      success: true,
      message: 'Note deleted permanently.',
    });
  } catch (error) {
    next(error);
  }
};
