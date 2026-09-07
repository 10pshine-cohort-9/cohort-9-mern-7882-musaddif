import pool from '../config/db.js';
import { validateNoteTitle, validateNoteContent, validateNoteCategory } from '../utils/validation.js';
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

    // Data normalization
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
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

/**
 * Get all notes for authenticated user
 * GET /api/notes
 */
export const getNotes = async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT id, title, content, category, tags, theme, is_trashed, created_at, updated_at
       FROM notes
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    const notes = result.rows.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      theme: note.theme,
      isTrashed: note.is_trashed,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));

    return res.status(200).json({
      success: true,
      notes,
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
      ['title', title, (value) => value.trim()],
      ['content', content, (value) => value.trim()],
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
