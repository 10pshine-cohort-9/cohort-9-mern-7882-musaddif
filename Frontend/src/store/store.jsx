import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';
import authReducer from './slice/authSlice';

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

const persistConfig = {
    key: 'auth',
    storage: customStorage,
    whitelist: ['token', 'user'], // Only persist token and user data
};

const rootReducer = combineReducers({
    auth: persistReducer(persistConfig, authReducer),
    // add other reducers here when needed
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