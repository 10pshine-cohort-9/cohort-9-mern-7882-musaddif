import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middleware/authMiddleware.js';
import { generateToken } from '../src/utils/token.js';

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

  it('attaches userId for a valid token', () => {
    const token = generateToken(7);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    const next = (err) => {
      expect(err).to.be.undefined;
    };
    authenticateToken(req, res, next);
    expect(req.userId).to.equal(7);
  });

  it('rejects when no token is provided', () => {
    const req = { headers: {} };
    const res = createRes();
    authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
    expect(res.body.success).to.be.false;
  });

  it('rejects a malformed token', () => {
    const req = { headers: { authorization: 'Bearer malformed' } };
    const res = createRes();
    authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });

  it('rejects a token with missing userId', () => {
    const token = jwtSignatureWithoutUserId();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    authenticateToken(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });

  function jwtSignatureWithoutUserId() {
    return jwt.sign({ foo: 'bar' }, process.env.JWT_SECRET || 'fallback_jwt_secret_key');
  }
});