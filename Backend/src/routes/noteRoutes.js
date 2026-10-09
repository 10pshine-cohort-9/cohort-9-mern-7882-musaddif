import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  trashNote,
  restoreNote,
  deleteNote,
} from '../controllers/noteController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// All note routes require authentication
router.use(authenticateToken);

// Create a new note
router.post('/', createNote);

// Get all notes for authenticated user
router.get('/', getNotes);

// Get a single note by ID
router.get('/:id', getNoteById);

// Update a note
router.put('/:id', updateNote);

// Move a note to trash
router.put('/:id/trash', trashNote);

// Restore a note from trash
router.put('/:id/restore', restoreNote);

// Permanently delete a note
router.delete('/:id', deleteNote);

export default router;
