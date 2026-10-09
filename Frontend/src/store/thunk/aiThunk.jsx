import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const checkGrammar = createAsyncThunk(
  'ai/checkGrammar',
  async (text, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/grammar', { text });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check grammar');
    }
  }
);
