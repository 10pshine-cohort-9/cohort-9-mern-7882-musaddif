import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData, { rejectWithValue }) => {
    try {
      const response = await api.post('/notes', noteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create note');
    }
  }
);

export const getNotes = createAsyncThunk(
  'notes/getNotes',
  async ({ scope = 'active', category, q, limit, cursor } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/notes', {
        params: { scope, category, q, limit, cursor },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notes');
    }
  }
);

export const getNoteById = createAsyncThunk(
  'notes/getNoteById',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch note');
    }
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, noteData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notes/${id}`, noteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update note');
    }
  }
);

export const trashNote = createAsyncThunk(
  'notes/trashNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notes/${noteId}/trash`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to trash note');
    }
  }
);

export const restoreNote = createAsyncThunk(
  'notes/restoreNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notes/${noteId}/restore`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to restore note');
    }
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete note');
    }
  }
);
