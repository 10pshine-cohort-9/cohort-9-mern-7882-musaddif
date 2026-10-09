import { create, type AxiosError } from "axios";

import type { RefreshResponse } from "../types";
import {
  fireSessionExpired,
  getAuthToken,
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
} from "./token";

/**
 * Resolve the API base URL at bundle time. Expo inlines EXPO_PUBLIC_* values
 * into native builds; refusing to fall back prevents a production APK from
 * silently targeting a development host.
 */
const getBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (!configured?.trim()) {
    throw new Error("EXPO_PUBLIC_API_URL must be configured before building the app.");
  }

  const baseUrl = configured.trim().replace(/\/+$/, "");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL must be an absolute HTTP(S) URL.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_URL must use HTTP or HTTPS.");
  }

  if (
    !__DEV__ &&
    (parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1")
  ) {
    throw new Error("Production builds require a deployed HTTPS API URL.");
  }

  return baseUrl;
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

const isAuthUrl = (url?: string): boolean =>
  typeof url === "string" && url.startsWith("/auth/");

let refreshInFlight: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;
    if (
      !response ||
      response.status !== 401 ||
      !config ||
      (config as { _retry?: boolean })._retry ||
      isAuthUrl(config.url)
    ) {
      return Promise.reject(error);
    }

    (config as { _retry?: boolean })._retry = true;

    if (refreshInFlight) {
      try {
        await refreshInFlight;
      } catch {
        // Fall through to retry; if the retry 401s again the refresh below
        // has already cleared the session.
      }
      return api(config);
    }

    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      const { data } = await api.post<RefreshResponse>("/auth/refresh", {
        refreshToken,
      });
      setAuthToken(data.token);
      setRefreshToken(data.refreshToken);
    })();

    try {
      await refreshInFlight;
      return api(config);
    } catch {
      fireSessionExpired();
      return Promise.reject(error);
    } finally {
      refreshInFlight = null;
    }
  }
);

export default api;
