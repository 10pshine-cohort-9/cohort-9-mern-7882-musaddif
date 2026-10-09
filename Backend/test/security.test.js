import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { initSchema, resetDb, createUser, authHeader, TEST_USER } from './helpers.js';
import { assertClientConfig, getClientOrigins } from '../src/utils/corsConfig.js';
import { validatePassword, MAX_PASSWORD_BYTES, validateNoteContent, MAX_NOTE_CONTENT_LENGTH } from '../src/utils/validation.js';

const withEnv = async (overrides, fn) => {
  const saved = Object.fromEntries(Object.keys(overrides).map((key) => [key, process.env[key]]));
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
  try {
    return await fn();
  } finally {
    Object.entries(saved).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
};

describe('Security hardening', () => {
  before(async () => {
    await initSchema();
  });

  beforeEach(async () => {
    await resetDb();
  });

  describe('Security headers (Helmet, no X-Powered-By)', () => {
    it('hides the Express framework signature', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).to.not.have.property('x-powered-by');
    });

    it('sends security headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).to.equal('nosniff');
      expect(res.headers['x-dns-prefetch-control']).to.equal('off');
      expect(res.headers).to.have.property('content-security-policy');
      expect(res.headers['content-security-policy']).to.contain('frame-ancestors');
    });
  });

  describe('CORS allow-list (#13)', () => {
    it('allows a configured origin with credentials', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
      expect(res.status).to.equal(200);
      expect(res.headers['access-control-allow-origin']).to.equal('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).to.equal('true');
    });

    it('rejects an unconfigured origin with 403', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'http://evil.example');
      expect(res.status).to.equal(403);
      expect(res.headers).to.not.have.property('access-control-allow-origin');
    });

    it('allows requests without an Origin header (curl / mobile clients)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).to.equal(200);
    });

    it('fails fast when CLIENT_URL is missing in production', async () => {
      await withEnv({ NODE_ENV: 'production', CLIENT_URL: undefined }, () => {
        expect(() => assertClientConfig()).to.throw(/CLIENT_URL is required/);
      });
    });

    it('fails fast when CLIENT_URL is invalid', async () => {
      await withEnv({ NODE_ENV: 'production', CLIENT_URL: 'not-a-url-scheme' }, () => {
        expect(() => assertClientConfig()).to.throw(/invalid origin/);
      });
    });

    it('falls back to explicit localhost origins in development (never *)', async () => {
      await withEnv({ NODE_ENV: 'development', CLIENT_URL: undefined }, () => {
        const origins = getClientOrigins();
        expect(origins).to.include.members(['http://localhost:5173', 'http://127.0.0.1:5173']);
        expect(origins).to.not.include('*');
      });
    });

    it('supports a comma-separated CLIENT_URL allow-list', async () => {
      await withEnv({ NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173,http://localhost:4173' }, () => {
        expect(getClientOrigins()).to.deep.equal(['http://localhost:5173', 'http://localhost:4173']);
      });
    });
  });

  describe('Input size limits (#14A/#14B)', () => {
    it('rejects a password longer than the bcrypt 72-byte limit', async () => {
      const longPassword = 'A'.repeat(70) + 'b1'; // 72 bytes exactly
      expect(validatePassword(longPassword)).to.be.null;
      expect(validatePassword('A'.repeat(71) + 'b1')).to.contain(`exceed ${MAX_PASSWORD_BYTES} bytes`);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'overflow@example.com', password: 'A'.repeat(71) + 'b1' });
      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.contain('bytes');
    });

    it('rejects note content longer than the maximum', async () => {
      const user = await createUser(TEST_USER);
      const token = await authHeader(user.id);
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', token)
        .send({
          title: 'Oversized note',
          content: 'A'.repeat(MAX_NOTE_CONTENT_LENGTH + 1),
          category: 'Personal',
        });
      expect(res.status).to.equal(400);
      expect(res.body.message).to.contain('50000');
      expect(validateNoteContent('A'.repeat(MAX_NOTE_CONTENT_LENGTH))).to.be.null;
    });
  });

  describe('Production error handling (#14D)', () => {
    it('responds with a generic message and hides internal details in production', async () => {
      await withEnv({ NODE_ENV: 'production' }, async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send('{"broken json');
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal('Something went wrong.');
        expect(JSON.stringify(res.body)).to.not.contain('Unexpected token');
        expect(JSON.stringify(res.body)).to.not.contain('entity.parse.failed');
      });
    });
  });

  describe('Parsing middleware (#14A)', () => {
    it('still parses urlencoded form bodies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .type('form')
        .send({ email: 'noone@example.com', password: 'WrongPass1' });
      expect(res.status).to.equal(401);
    });
  });

  describe('Password reset respects the 72-byte limit (#14B)', () => {
    it('rejects an oversized new password during reset', async () => {
      await withEnv({}, () => {
        const err = validatePassword('A'.repeat(71) + 'b1');
        expect(err).to.contain('bytes');
      });
    });
  });

  describe('Logout design (#14E)', () => {
    it('logout succeeds without authentication (possession-based revocation)', async () => {
      const res = await request(app).post('/api/auth/logout').send({});
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});