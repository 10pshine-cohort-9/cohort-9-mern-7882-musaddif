import { getRefreshTokenExpiryDays } from './token.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE_MS = 15 * 60 * 1000;

const isSecureRequest = () => process.env.NODE_ENV === 'production';

const baseCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isSecureRequest(),
  sameSite: 'lax',
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

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
};