import { createSlice } from '@reduxjs/toolkit';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  trashNote,
  restoreNote,
  deleteNote,
} from '../thunk/noteThunk';

const initialState = {
  notes: [],
  currentNote: null,
  loading: false,
  error: null,
  successMessage: null,
};

const noteSlice = createSlice({
  name: 'notes',
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
        state.notes.push(action.payload.note);
        state.successMessage = action.payload.message || 'Note created successfully';
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Notes
      .addCase(getNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.notes || [];
      })
      .addCase(getNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.error = action.payload;
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
        state.successMessage = action.payload.message || 'Note updated successfully';
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Trash Note
      .addCase(trashNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(trashNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.note.id);
        if (index >= 0) {
          state.notes[index] = action.payload.note;
        }
        state.successMessage = action.payload.message || 'Note moved to trash';
      })
      .addCase(trashNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Restore Note
      .addCase(restoreNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(restoreNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.note.id);
        if (index >= 0) {
          state.notes[index] = action.payload.note;
        }
        state.successMessage = action.payload.message || 'Note restored successfully';
      })
      .addCase(restoreNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.successMessage = action.payload.message || 'Note deleted permanently';
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentNote } = noteSlice.actions;
export default noteSlice.reducer;
