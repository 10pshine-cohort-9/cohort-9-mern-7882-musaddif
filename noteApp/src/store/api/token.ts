import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Access/refresh token storage.
 *
 * Tokens are kept in memory for the API client AND persisted to the device
 * keychain (expo-secure-store) so sessions survive app restarts without ever
 * being written to AsyncStorage/plaintext storage. On web (where
 * expo-secure-store is unavailable) only the in-memory copy is used.
 */
const ACCESS_KEY = "notes.access_token";
const REFRESH_KEY = "notes.refresh_token";

let authToken: string | null = null;
let refreshToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

const canUseSecureStore = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

const saveToSecureStore = async (key: string, value: string | null): Promise<void> => {
  if (!(await canUseSecureStore())) return;
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    // Non-fatal: the in-memory copy keeps the current session working.
  }
};

export const setAuthToken = (token: string | null): void => {
  authToken = token;
  void saveToSecureStore(ACCESS_KEY, token);
};

export const getAuthToken = (): string | null => authToken;

export const setRefreshToken = (token: string | null): void => {
  refreshToken = token;
  void saveToSecureStore(REFRESH_KEY, token);
};

export const getRefreshToken = (): string | null => refreshToken;

/**
 * Loads persisted tokens from the device keychain (if available). Returns the
 * in-memory values as a fallback.
 */
export const restoreTokensFromSecureStore = async (): Promise<{
  token: string | null;
  refreshToken: string | null;
}> => {
  if (!(await canUseSecureStore())) {
    return { token: authToken, refreshToken };
  }
  try {
    const storedToken = await SecureStore.getItemAsync(ACCESS_KEY);
    const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
    return { token: storedToken ?? null, refreshToken: storedRefresh ?? null };
  } catch {
    return { token: authToken, refreshToken };
  }
};

export const clearSecureTokens = async (): Promise<void> => {
  await saveToSecureStore(ACCESS_KEY, null);
  await saveToSecureStore(REFRESH_KEY, null);
};

/**
 * Registers a callback invoked when a refresh attempt fails (e.g. the
 * refresh token is expired or revoked). The store wires this up to sign the
 * user out so protected routes redirect to the login screen.
 */
export const setOnSessionExpired = (handler: (() => void) | null): void => {
  onSessionExpired = handler;
};

export const fireSessionExpired = (): void => {
  onSessionExpired?.();
};