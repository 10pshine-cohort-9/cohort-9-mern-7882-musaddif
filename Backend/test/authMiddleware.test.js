import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middleware/authMiddleware.js';
import { generateToken } from '../src/utils/token.js';
import { initSchema, resetDb, createUser, TEST_USER } from './helpers.js';

describe('authenticateToken middleware', () => {
  const createRes = () => ({
    statusCode: 0,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  });

  before(async () => {
    await initSchema();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('attaches userId for a valid token', async () => {
    const user = await createUser({ name: 'M', email: 'm@example.com', password: TEST_USER.password });
    const token = generateToken(user.id, 0);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(req.userId).to.equal(user.id);
    expect(res.statusCode).to.equal(0);
  });

  it('rejects when no token is provided', async () => {
    const req = { headers: {} };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
    expect(res.body.success).to.be.false;
  });

  it('rejects a malformed token', async () => {
    const req = { headers: { authorization: 'Bearer malformed' } };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });

  it('rejects a token with missing userId', async () => {
    const token = jwt.sign({ foo: 'bar' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });

  it('rejects a token whose type is not access', async () => {
    const token = jwt.sign({ userId: 1, tokenVersion: 0, type: 'refresh' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });

  it('rejects a token with a stale token version (revoked session)', async () => {
    const user = await createUser({ name: 'M', email: 'm2@example.com', password: TEST_USER.password });
    const token = generateToken(user.id, 99);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });

  it('rejects a token for a deleted user', async () => {
    const token = generateToken(999999, 0);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    await authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });
});