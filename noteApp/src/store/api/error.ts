import { isAxiosError } from "axios";

import { API_BASE_URL } from "./client";

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (error.code === "ERR_NETWORK") {
      return __DEV__
        ? `Unable to reach the server at ${API_BASE_URL}. Make sure the backend is running and reachable from this device.`
        : "Unable to reach the server. Please check your connection.";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};
