import { createAsyncThunk } from "@reduxjs/toolkit";

import api from "../api/client";
import { getErrorMessage } from "../api/error";
import type { MessageResponse, NoteResponse, NotesResponse } from "../types";

export interface NotePayload {
  title: string;
  content: string;
  category: string;
  tags: string;
  theme: string;
}

export const createNote = createAsyncThunk<
  NoteResponse,
  NotePayload,
  { rejectValue: string }
>("notes/createNote", async (noteData, { rejectWithValue }) => {
  try {
    const response = await api.post<NoteResponse>("/notes", noteData);
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to create note"));
  }
});

export const getNotes = createAsyncThunk<NotesResponse, void, { rejectValue: string }>(
  "notes/getNotes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<NotesResponse>("/notes");
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch notes"));
    }
  }
);

export const getNoteById = createAsyncThunk<
  NoteResponse,
  string | number,
  { rejectValue: string }
>("notes/getNoteById", async (noteId, { rejectWithValue }) => {
  try {
    const response = await api.get<NoteResponse>(`/notes/${noteId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch note"));
  }
});

export const updateNote = createAsyncThunk<
  NoteResponse,
  { id: string | number; noteData: NotePayload },
  { rejectValue: string }
>("notes/updateNote", async ({ id, noteData }, { rejectWithValue }) => {
  try {
    const response = await api.put<NoteResponse>(`/notes/${id}`, noteData);
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to update note"));
  }
});

export const trashNote = createAsyncThunk<NoteResponse, number, { rejectValue: string }>(
  "notes/trashNote",
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.put<NoteResponse>(`/notes/${noteId}/trash`);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to trash note"));
    }
  }
);

export const restoreNote = createAsyncThunk<NoteResponse, number, { rejectValue: string }>(
  "notes/restoreNote",
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.put<NoteResponse>(`/notes/${noteId}/restore`);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to restore note"));
    }
  }
);

export const deleteNote = createAsyncThunk<MessageResponse, number, { rejectValue: string }>(
  "notes/deleteNote",
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.delete<MessageResponse>(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete note"));
    }
  }
);
