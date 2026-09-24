import { expect } from 'chai';
import pool, { initSchema, resetDb, createUser } from './helpers.js';
import { cleanupExpiredTokens } from '../src/utils/tokenCleanup.js';

const SECONDS_PER_DAY = 24 * 60 * 60;

describe('Token expiry cleanup (#7)', () => {
  before(async () => {
    await initSchema();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('deletes expired reset tokens and keeps active ones', async () => {
    const user = await createUser({ name: 'Cleanup', email: 'cleanup@example.com', password: 'StrongPass1' });

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at) VALUES ($1, 'expired-hash', NOW() - $2::interval, NULL)",
      [user.id, '1 day']
    );
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at) VALUES ($1, 'used-hash', NOW() + $2::interval, NOW())",
      [user.id, '1 day']
    );
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at) VALUES ($1, 'alive-hash', NOW() + $2::interval, NULL)",
      [user.id, '1 day']
    );

    await cleanupExpiredTokens(); // assertions query the DB directly

    const remaining = await pool.query(
      'SELECT token_hash FROM password_reset_tokens ORDER BY token_hash'
    );
    expect(remaining.rows.map((row) => row.token_hash)).to.deep.equal(['alive-hash']);
  });

  it('deletes revoked and expired refresh tokens and keeps valid sessions', async () => {
    const user = await createUser({ name: 'Refresh', email: 'refresh@example.com', password: 'StrongPass1' });

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked_at) VALUES ($1, 'revoked-hash', NOW() + $2::interval, NOW())",
      [user.id, '1 day']
    );
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked_at) VALUES ($1, 'expired-hash', NOW() - $2::interval, NULL)",
      [user.id, '1 day']
    );
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked_at) VALUES ($1, 'valid-hash', NOW() + $2::interval, NULL)",
      [user.id, '1 day']
    );

    await cleanupExpiredTokens();

    const remaining = await pool.query(
      'SELECT token_hash FROM refresh_tokens ORDER BY token_hash'
    );
    expect(remaining.rows.map((row) => row.token_hash)).to.deep.equal(['valid-hash']);
  });

  it('is a no-op when there is nothing to clean (no error)', async () => {
    await cleanupExpiredTokens();
    expect(true).to.be.true;
  });

  it('runs repeatedly without error (startTokenCleanup interval)', async () => {
    // startTokenCleanup runs once immediately, then schedules an unref'd timer.
    // Use a long interval to avoid any interference in tests.
    const tokenCleanup = await import('../src/utils/tokenCleanup.js');
    const timer = tokenCleanup.startTokenCleanup(SECONDS_PER_DAY);
    expect(timer).to.have.property('refresh').that.is.a('function'); // a node Timeout
    clearInterval(timer);
  });
});