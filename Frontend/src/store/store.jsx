import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';
import authReducer from './slice/authSlice';
import noteReducer from './slice/noteSlice';

// Custom storage wrapper to avoid Vite module resolution issues with redux-persist
const customStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, item) => {
        localStorage.setItem(key, item);
        return Promise.resolve();
    },
    removeItem: (key) => {
        localStorage.removeItem(key);
        return Promise.resolve();
    },
};

// Tokens are stored in httpOnly cookies by the server, never in localStorage.
// Persist only the non-sensitive user object (a boolean auth flag is enough to
// restore the UI shell before the first request re-validates the session).
const persistConfig = {
    key: 'notes-auth',
    storage: customStorage,
    whitelist: ['user', 'isAuthenticated'],
};

// Purge any legacy persisted auth (key 'persist:auth') that may still contain
// raw tokens written before the cookie-based flow.
try {
    localStorage.removeItem('persist:auth');
} catch {
    // ignore storage errors
}

const rootReducer = combineReducers({
    auth: persistReducer(persistConfig, authReducer),
    notes: noteReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types from redux-persist to avoid serializability warnings
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER', 'persist/FLUSH', 'persist/PAUSE', 'persist/PURGE'],
            },
        }),
});

export const persistor = persistStore(store);