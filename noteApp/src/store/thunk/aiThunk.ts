import { createAsyncThunk } from "@reduxjs/toolkit";

import api from "../api/client";
import { getErrorMessage } from "../api/error";
import type { GrammarResponse } from "../types";

export const checkGrammar = createAsyncThunk<
  GrammarResponse,
  string,
  { rejectValue: string }
>("ai/checkGrammar", async (text, { rejectWithValue }) => {
  try {
    const response = await api.post<GrammarResponse>("/ai/grammar", { text });
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to check grammar"));
  }
});
