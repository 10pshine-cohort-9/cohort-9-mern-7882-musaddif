import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { initSchema } from './helpers.js';

describe('Health endpoints (#9)', () => {
  before(async () => {
    await initSchema();
  });

  it('GET /api/health is a lightweight liveness probe (no DB query)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.databaseConnected).to.be.undefined;
    expect(res.body.success).to.be.true;
  });

  it('GET /api/health/ready checks database connectivity for readiness', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).to.equal(200);
    expect(res.body.databaseConnected).to.be.true;
    expect(res.body.success).to.be.true;
  });
});