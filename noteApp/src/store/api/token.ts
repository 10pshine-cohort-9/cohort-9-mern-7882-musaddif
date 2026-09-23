/**
 * In-memory access token holder.
 *
 * The API client reads the token from here so that it does not need to import
 * the Redux store (which would create a circular dependency). The store keeps
 * this value in sync through a subscription set up in `store.ts`.
 */
let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const getAuthToken = (): string | null => authToken;
