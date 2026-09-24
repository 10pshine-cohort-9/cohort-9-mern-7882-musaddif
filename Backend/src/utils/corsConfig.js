/**
 * CORS origin configuration.
 *
 * The backend must never fall back to a wildcard origin: credentials-carrying
 * (cookie) requests rely on an explicit allow-list. CLIENT_URL is required in
 * production and fails fast when missing/invalid. Outside production it may be
 * omitted — in that case only explicit localhost origins are allowed (never `*`).
 */

const parseOrigins = (raw) =>
  String(raw || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isValidHttpOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
};

// Explicit development origins used ONLY when CLIENT_URL is not configured and
// the app is not running in production — this avoids any wildcard fallback.
export const DEV_CLIENT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

/**
 * Resolve the list of allowed client origins from CLIENT_URL.
 * @returns {string[]}
 * @throws {Error} When CLIENT_URL is missing in production or contains an
 *   invalid origin (also thrown in development for invalid values).
 */
export const getClientOrigins = () => {
  const raw = process.env.CLIENT_URL;
  if (raw) {
    const origins = parseOrigins(raw);
    if (origins.length === 0) {
      throw new Error('CLIENT_URL must contain at least one allowed origin.');
    }
    const invalid = origins.find((origin) => !isValidHttpOrigin(origin));
    if (invalid) {
      throw new Error(`CLIENT_URL contains an invalid origin: "${invalid}".`);
    }
    return origins;
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_CLIENT_ORIGINS;
  }

  throw new Error('CLIENT_URL is required when NODE_ENV=production.');
};

/**
 * Fail-fast guard: validates that the CORS allow-list can be resolved. Called
 * during server startup so a misconfigured deployment exits before listening.
 */
export const assertClientConfig = () => getClientOrigins();