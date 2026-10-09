import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";

import {
  restoreTokensFromSecureStore,
  setAuthToken,
  setOnSessionExpired,
  setRefreshToken,
} from "./api/token";
import authReducer, { logout, sessionRestored } from "./slice/authSlice";
import noteReducer from "./slice/noteSlice";

// Tokens are persisted to the OS keychain (expo-secure-store), never to
// AsyncStorage. Only the non-sensitive user object is persisted here.
const persistConfig = {
  key: "notes-auth-v2",
  storage: AsyncStorage,
  whitelist: ["user"],
};

// Purge any legacy persisted auth (key 'persist:auth') that may still hold
// raw tokens written before the keychain-based storage was introduced.
AsyncStorage.removeItem("persist:auth").catch(() => {});

const rootReducer = combineReducers({
  auth: persistReducer(persistConfig, authReducer),
  notes: noteReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Keep the in-memory tokens used by the API client in sync with the store;
// setAuthToken/setRefreshToken also mirror writes to the keychain.
setAuthToken(store.getState().auth.token);
setRefreshToken(store.getState().auth.refreshToken);
store.subscribe(() => {
  const { token, refreshToken } = store.getState().auth;
  setAuthToken(token);
  setRefreshToken(refreshToken);
});

// When a refresh attempt fails, sign the user out so the protected route
// layout redirects to the login screen.
setOnSessionExpired(() => {
  store.dispatch(logout());
});

export const persistor = persistStore(store);

// Restore the keychain-persisted session so returning users skip login.
void restoreTokensFromSecureStore().then(({ token, refreshToken }) => {
  store.dispatch(sessionRestored({ token, refreshToken }));
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;