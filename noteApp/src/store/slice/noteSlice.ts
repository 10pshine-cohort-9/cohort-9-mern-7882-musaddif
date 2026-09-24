import { createSlice } from "@reduxjs/toolkit";

import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  restoreNote,
  trashNote,
  updateNote,
} from "../thunk/noteThunk";
import type { Note, NotesCounts, NotesPagination } from "../types";

interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: NotesPagination;
  counts: NotesCounts;
}

const initialState: NoteState = {
  notes: [],
  currentNote: null,
  loading: false,
  loadingMore: false,
  error: null,
  successMessage: null,
  pagination: { limit: 30, hasMore: false, nextCursor: null },
  counts: { total: 0, active: 0, trashed: 0, byCategory: {} },
};

const noteSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentNote: (state) => {
      state.currentNote = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Note
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes.unshift(action.payload.note);
        state.successMessage = action.payload.message || "Note created successfully";
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create note";
      })

      // Get Notes (server-side pagination: replace list on a fresh fetch,
      // append when called with a cursor for infinite scroll).
      .addCase(getNotes.pending, (state, action) => {
        if (action.meta.arg && (action.meta.arg as { cursor?: string | null }).cursor) {
          state.loadingMore = true;
        } else {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(getNotes.fulfilled, (state, action) => {
        const append = Boolean(action.meta.arg && (action.meta.arg as { cursor?: string | null }).cursor);
        state.loading = false;
        state.loadingMore = false;
        state.notes = append
          ? [...state.notes, ...(action.payload.notes || [])]
          : (action.payload.notes || []);
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        if (action.payload.counts) {
          state.counts = action.payload.counts;
        }
      })
      .addCase(getNotes.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload ?? "Failed to fetch notes";
      })

      // Get Note by ID
      .addCase(getNoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNote = action.payload.note;
      })
      .addCase(getNoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch note";
      })

      // Update Note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.note.id);
        if (index >= 0) {
          state.notes[index] = action.payload.note;
        }
        state.currentNote = action.payload.note;
        state.successMessage = action.payload.message || "Note updated successfully";
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update note";
      })

      // Trash Note (list is server-scoped, so a trashed note leaves the active
      // view; the next fetch reconciles counts).
      .addCase(trashNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(trashNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.payload.note.id);
        state.successMessage = action.payload.message || "Note moved to trash";
      })
      .addCase(trashNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to trash note";
      })

      // Restore Note (a restored note leaves the Trash scope).
      .addCase(restoreNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(restoreNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.payload.note.id);
        state.successMessage = action.payload.message || "Note restored successfully";
      })
      .addCase(restoreNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to restore note";
      })

      // Delete Note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.meta.arg);
        state.successMessage = action.payload.message || "Note deleted permanently";
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete note";
      });
  },
});

export const { clearError, clearCurrentNote } = noteSlice.actions;

export type { NoteState };
export default noteSlice.reducer;
