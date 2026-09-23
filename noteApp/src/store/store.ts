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

import { setAuthToken } from "./api/token";
import authReducer from "./slice/authSlice";
import noteReducer from "./slice/noteSlice";

const persistConfig = {
  key: "auth",
  storage: AsyncStorage,
  whitelist: ["token", "user"],
};

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

// Keep the in-memory token used by the API client in sync with the store.
setAuthToken(store.getState().auth.token);
store.subscribe(() => {
  setAuthToken(store.getState().auth.token);
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
