import Constants from "expo-constants";
import { create } from "axios";
import { Platform } from "react-native";

import { getAuthToken } from "./token";

const API_PORT = 5000;

/**
 * Host of the Metro dev server (e.g. `192.168.1.20` when running on LAN).
 * On a physical device the backend runs on the same machine as Metro, so we
 * reuse that host instead of `localhost`, which would point at the phone.
 */
const getDevServerHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.replace(/^\w+:\/\//, "").split("/")[0].split(":")[0];
  return host || null;
};

/**
 * Resolve the API base URL.
 *
 * - Set `EXPO_PUBLIC_API_URL` (e.g. in `.env`) to point at a deployed backend or
 *   a LAN address when running on a physical device.
 * - When unset, reuse the Metro dev-server host for devices/emulators on the LAN.
 * - Fall back to `10.0.2.2` for the Android emulator and `localhost` otherwise.
 */
const getBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured && configured.trim()) {
    return configured.trim().replace(/\/+$/, "");
  }

  if (Platform.OS !== "web") {
    const devHost = getDevServerHost();
    if (devHost && devHost !== "localhost" && devHost !== "127.0.0.1") {
      return `http://${devHost}:${API_PORT}/api`;
    }
  }

  const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${host}:${API_PORT}/api`;
};

export const API_BASE_URL = getBaseUrl();

const api = create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
