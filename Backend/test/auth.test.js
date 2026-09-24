import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { initSchema, resetDb, createUser, authHeader, TEST_USER } from './helpers.js';

describe('Auth API', () => {
  before(async () => {
    await initSchema();
  });

  beforeEach(async () => {
    await resetDb();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: TEST_USER.name, email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.user.email).to.equal(TEST_USER.email);
      expect(res.body.token).to.be.a('string');
      expect(res.body.user).to.not.have.property('password_hash');
    });

    it('does not reveal account existence on duplicate email registration', async () => {
      await createUser(TEST_USER);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Another', email: TEST_USER.email, password: TEST_USER.password });

      // Same status + success flag + message as a brand-new registration so an
      // attacker cannot enumerate registered emails.
      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('User registered successfully.');
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: TEST_USER.password });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'new@example.com', password: 'short' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_USER.email });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await createUser(TEST_USER);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.token).to.be.a('string');
    });

    it('returns 401 for wrong password', async () => {
      await createUser(TEST_USER);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPass1' });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
    });

    it('returns 401 for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_USER.password });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the authenticated user profile', async () => {
      const user = await createUser(TEST_USER);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', await authHeader(user.id));

      expect(res.status).to.equal(200);
      expect(res.body.user.id).to.equal(user.id);
      expect(res.body.user.email).to.equal(TEST_USER.email);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).to.equal(401);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).to.equal(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns success on logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});