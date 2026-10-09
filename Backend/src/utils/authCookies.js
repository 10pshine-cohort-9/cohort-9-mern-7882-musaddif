import { getRefreshTokenExpiryDays } from './token.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE_MS = 15 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === 'production';

// In production the frontend and backend are on different origins (cross-site),
// so SameSite=Lax causes browsers to silently omit cookies on every XHR/fetch
// request. SameSite=None is required for cross-origin credentialed requests and
// MUST be paired with Secure=true (enforced below in production).
// In development both run on localhost so SameSite=Lax is fine and keeps the
// local dev experience simple (no need for HTTPS).
const baseCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? 'none' : 'lax',
  path: '/',
  maxAge,
});

export const getAccessCookieName = () => ACCESS_COOKIE;
export const getRefreshCookieName = () => REFRESH_COOKIE;

/**
 * Persist access + refresh tokens in httpOnly cookies so they are never
 * exposed to client-side JavaScript. The access cookie maxAge mirrors the
 * short life of the access JWT; the refresh cookie lives as long as the
 * stored refresh token does. Token validity itself is always enforced by
 * the server when the cookie value is consumed.
 */
export const setAuthCookies = (res, { token, refreshToken }) => {
  res.cookie(ACCESS_COOKIE, token, baseCookieOptions(ACCESS_COOKIE_MS));
  res.cookie(
    REFRESH_COOKIE,
    refreshToken,
    baseCookieOptions(getRefreshTokenExpiryDays() * 24 * 60 * 60 * 1000)
  );
};

// clearCookie only removes a cookie when the attributes (path, secure,
// sameSite) exactly match the attributes used when the cookie was set.
// Omitting secure/sameSite here would leave the cookie in place in production.
const clearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? 'none' : 'lax',
  path: '/',
});

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, clearCookieOptions());
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
};