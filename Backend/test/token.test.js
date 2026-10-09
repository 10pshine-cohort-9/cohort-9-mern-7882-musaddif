import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import {
  generateToken,
  verifyToken,
  generateResetToken,
  hashResetToken,
  generateRefreshToken,
  hashRefreshToken,
  assertJwtConfig,
} from '../src/utils/token.js';

describe('Token utilities', () => {
  it('generates a verifiable access JWT containing the userId', () => {
    const token = generateToken(42);
    const decoded = verifyToken(token);
    expect(decoded.userId).to.equal(42);
    expect(decoded.type).to.equal('access');
    expect(decoded.tokenVersion).to.equal(0);
  });

  it('embeds the provided token version in the token', () => {
    const token = generateToken(42, 3);
    const decoded = verifyToken(token);
    expect(decoded.tokenVersion).to.equal(3);
  });

  it('rejects an invalid token', () => {
    expect(() => verifyToken('invalid.token.value')).to.throw();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ userId: 1, tokenVersion: 0, type: 'access' }, process.env.JWT_SECRET, {
      expiresIn: -1,
    });
    expect(() => verifyToken(expired)).to.throw();
  });

  it('asserts a strong JWT_SECRET is configured', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'x'.repeat(48);
    let ok = true;
    try {
      assertJwtConfig();
    } catch (e) {
      ok = false;
    }
    process.env.JWT_SECRET = original;
    expect(ok).to.be.true;
  });

  it('throws when JWT_SECRET is missing', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    let threw = false;
    try {
      assertJwtConfig();
    } catch (e) {
      threw = true;
      expect(e.message).to.not.include(original);
    }
    process.env.JWT_SECRET = original;
    expect(threw).to.be.true;
  });

  it('throws when JWT_SECRET is too short', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'short';
    let threw = false;
    try {
      assertJwtConfig();
    } catch (e) {
      threw = true;
    }
    process.env.JWT_SECRET = original;
    expect(threw).to.be.true;
  });

  it('generates random reset tokens of expected length', () => {
    const t1 = generateResetToken();
    const t2 = generateResetToken();
    expect(t1).to.have.length(64);
    expect(t1).to.not.equal(t2);
  });

  it('hashes reset tokens deterministically with SHA-256', () => {
    const token = 'abcdef123456';
    const h1 = hashResetToken(token);
    const h2 = hashResetToken(token);
    expect(h1).to.equal(h2);
    expect(h1).to.have.length(64);
  });

  it('generates and hashes refresh tokens', () => {
    const raw = generateRefreshToken();
    expect(raw).to.have.length(96);
    const h1 = hashRefreshToken(raw);
    const h2 = hashRefreshToken(raw);
    expect(h1).to.equal(h2);
    expect(h1).to.have.length(64);
  });
});