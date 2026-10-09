import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { initSchema, resetDb, createUser, authHeader, TEST_USER } from './helpers.js';
import pool from './helpers.js';
import { generateResetToken, hashResetToken } from '../src/utils/token.js';

describe('Session management', () => {
  before(async () => {
    await initSchema();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const issueResetToken = async (userId) => {
    const raw = generateResetToken();
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, hashResetToken(raw), new Date(Date.now() + 15 * 60 * 1000)]
    );
    return raw;
  };

  describe('Refresh token rotation', () => {
    it('issues a refresh token on login and rotates it on refresh', async () => {
      await createUser(TEST_USER);
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(login.status).to.equal(200);
      expect(login.body.refreshToken).to.be.a('string');

      const rotated = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken });

      expect(rotated.status).to.equal(200);
      expect(rotated.body.success).to.be.true;
      expect(rotated.body.token).to.be.a('string');
      expect(rotated.body.refreshToken).to.be.a('string');
      expect(rotated.body.refreshToken).to.not.equal(login.body.refreshToken);
    });

    it('rejects reuse of a consumed refresh token', async () => {
      await createUser(TEST_USER);
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      const rotated = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken });
      expect(rotated.status).to.equal(200);

      const reused = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken });
      expect(reused.status).to.equal(401);
    });

    it('returns 400 when refresh token is missing', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});
      expect(res.status).to.equal(400);
    });

    it('returns a working access token from a rotated refresh', async () => {
      const user = await createUser({ name: 'Rot', email: 'rot@example.com', password: TEST_USER.password });
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rot@example.com', password: TEST_USER.password });
      const rotated = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken });
      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${rotated.body.token}`);
      expect(me.status).to.equal(200);
      expect(me.body.user.id).to.equal(user.id);
    });
  });

  describe('Logout revocation', () => {
    it('revokes the refresh token on logout', async () => {
      await createUser(TEST_USER);
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      const logout = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: login.body.refreshToken });
      expect(logout.status).to.equal(200);
      expect(logout.body.success).to.be.true;

      const refresh = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken });
      expect(refresh.status).to.equal(401);
    });

    it('still returns success for an unauthenticated logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });

  describe('Password reset', () => {
    it('resets the password and consumes the token atomically (no double reuse)', async () => {
      await createUser(TEST_USER);
      const raw = await issueResetToken((await pool.query('SELECT id FROM users WHERE email = $1', [TEST_USER.email])).rows[0].id);
      const body = { token: raw, password: 'NewPass456' };

      const [r1, r2] = await Promise.all([
        request(app).post('/api/auth/reset-password').send(body),
        request(app).post('/api/auth/reset-password').send(body),
      ]);

      expect([r1.status, r2.status].sort()).to.deep.equal([200, 400]);

      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });
      expect(oldLogin.status).to.equal(401);

      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'NewPass456' });
      expect(newLogin.status).to.equal(200);
    });

    it('invalidates previously issued JWTs after password reset', async () => {
      const user = await createUser(TEST_USER);
      const oldAuth = await authHeader(user.id);

      const meBefore = await request(app).get('/api/auth/me').set('Authorization', oldAuth);
      expect(meBefore.status).to.equal(200);

      const raw = await issueResetToken(user.id);
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: raw, password: 'NewPass456' });
      expect(res.status).to.equal(200);

      const meAfter = await request(app).get('/api/auth/me').set('Authorization', oldAuth);
      expect(meAfter.status).to.equal(401);
    });

    it('invalidates existing refresh sessions after password reset', async () => {
      const user = await createUser(TEST_USER);
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });
      expect(login.status).to.equal(200);

      const raw = await issueResetToken(user.id);
      await request(app)
        .post('/api/auth/reset-password')
        .send({ token: raw, password: 'NewPass456' });

      const refresh = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: login.body.refreshToken });
      expect(refresh.status).to.equal(401);
    });
  });
});