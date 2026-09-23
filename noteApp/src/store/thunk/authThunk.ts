import { createAsyncThunk } from "@reduxjs/toolkit";

import api from "../api/client";
import { getErrorMessage } from "../api/error";
import type { AuthResponse, MessageResponse } from "../types";

export const loginUser = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginUser", async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthResponse>("/auth/login", userData);
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Login failed"));
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: string }
>("auth/registerUser", async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post<AuthResponse>("/auth/register", userData);
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Registration failed"));
  }
});

export const forgotPassword = createAsyncThunk<
  MessageResponse,
  string,
  { rejectValue: string }
>("auth/forgotPassword", async (email, { rejectWithValue }) => {
  try {
    const response = await api.post<MessageResponse>("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to send reset link"));
  }
});

export const resetPassword = createAsyncThunk<
  MessageResponse,
  { token: string; password: string },
  { rejectValue: string }
>("auth/resetPassword", async ({ token, password }, { rejectWithValue }) => {
  try {
    const response = await api.post<MessageResponse>("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Password reset failed"));
  }
});

export const getUserProfile = createAsyncThunk<
  { success: boolean; user: AuthResponse["user"] },
  void,
  { rejectValue: string }
>("auth/getUserProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ success: boolean; user: AuthResponse["user"] }>("/auth/me");
    return response.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to get profile"));
  }
});

export const logoutUser = createAsyncThunk<MessageResponse, void, { rejectValue: string }>(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<MessageResponse>("/auth/logout");
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Logout failed"));
    }
  }
);
