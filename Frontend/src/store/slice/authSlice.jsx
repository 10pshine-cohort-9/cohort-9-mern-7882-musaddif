import { createSlice } from '@reduxjs/toolkit';
import { loginUser, registerUser, forgotPassword, resetPassword, getUserProfile, logoutUser } from '../thunk/authThunk';

const clearPersistedAuth = () => {
    const keys = ['persist:auth', 'auth', 'token', 'user', 'isAuthenticated'];
    keys.forEach((key) => localStorage.removeItem(key));
};

const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    successMessage: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
            state.successMessage = null;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.loading = false;
            state.error = null;
            state.successMessage = null;
            clearPersistedAuth();
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Forgot Password
            .addCase(forgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message || 'Reset link sent successfully';
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message || 'Password reset successfully';
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get Profile
            .addCase(getUserProfile.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
            })
            .addCase(getUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Logout User
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.error = null;
                state.successMessage = null;
                clearPersistedAuth();
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.user = null;
                state.token = null;
                state.error = null;
                state.successMessage = null;
                clearPersistedAuth();
            });
    },
});

export const { clearError, logout } = authSlice.actions;

export default authSlice.reducer;