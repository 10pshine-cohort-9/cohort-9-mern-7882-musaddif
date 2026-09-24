import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import app from '../src/app.js';
import { createRateLimiter } from '../src/utils/rateLimiter.js';

describe('Rate limiting', () => {
  it('returns 429 with the standard JSON envelope after exceeding a limit', async () => {
    const miniApp = express();
    miniApp.use(
      '/x',
      createRateLimiter({ windowMs: 60 * 1000, limit: 3, message: 'Too fast.' })
    );
    miniApp.post('/x', (req, res) => res.json({ ok: true }));

    for (let i = 0; i < 3; i += 1) {
      const ok = await request(miniApp).post('/x');
      expect(ok.status).to.equal(200);
    }

    const blocked = await request(miniApp).post('/x');
    expect(blocked.status).to.equal(429);
    expect(blocked.body.success).to.be.false;
    expect(blocked.body.message).to.equal('Too fast.');
  });

  it('enables the global limiter on the real API', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    const limitHeader = res.headers['ratelimit-limit'] || res.headers['ratelimit-policy'];
    expect(limitHeader).to.not.be.undefined;
  });

  it('applies the dedicated login limiter', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPass1' });
    expect(res.status).to.equal(401);
    const limitHeader = res.headers['ratelimit-limit'] || res.headers['ratelimit-policy'];
    expect(limitHeader).to.not.be.undefined;
    expect(limitHeader).to.include('20');
  });

  it('requires authentication on the AI grammar endpoint', async () => {
    const res = await request(app).post('/api/ai/grammar').send({ text: 'hello world' });
    expect(res.status).to.equal(401);
    expect(res.body.success).to.be.false;
  });
});