import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, generateResetToken, hashResetToken } from '../src/utils/token.js';

describe('Token utilities', () => {
  it('generates a verifiable JWT containing the userId', () => {
    const token = generateToken(42);
    const decoded = verifyToken(token);
    expect(decoded.userId).to.equal(42);
  });

  it('rejects an invalid token', () => {
    expect(() => verifyToken('invalid.token.value')).to.throw();
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
});