// Must be the first import so UV_THREADPOOL_SIZE is set before any module that
// queues libuv work (bcrypt, etc.) is evaluated.
import './src/config/threadPool.js';

import os from 'node:os';
import cluster from 'node:cluster';
import app from './src/app.js';
import { testDbConnection, assertDbConfig } from './src/config/db.js';
import { assertJwtConfig } from './src/utils/token.js';
import { assertClientConfig } from './src/utils/corsConfig.js';
import { startTokenCleanup } from './src/utils/tokenCleanup.js';
import logger from './src/utils/logger.js';

const PORT = parseInt(process.env.PORT || '5000', 10);
const CLUSTER_WORKERS = parseInt(process.env.CLUSTER_WORKERS || '1', 10);

const startServer = async () => {
  logger.info('Starting Notes Backend...');

  // Fail fast if the JWT secret is missing or too weak, if required
  // database credentials were not provided (never fall back to defaults),
  // or if the CORS allow-list cannot be resolved (CLIENT_URL required in
  // production and must be valid).
  try {
    assertJwtConfig();
    assertDbConfig();
    assertClientConfig();
  } catch (error) {
    logger.error(`Configuration error: ${error.message}`);
    process.exit(1);
  }

  const dbConnected = await testDbConnection();

  if (!dbConnected) {
    logger.warn('Database connection failed on startup; server will still start.');
  }

  const server = app.listen(PORT, () => {
    logger.info(`Express server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Keep-alive tuning: bound how long sockets stay connected so idle client /
  // load-balancer connections cannot accumulate. (Default Node value is 5s.)
  const keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS, 10) || 5000;
  server.keepAliveTimeout = keepAliveTimeout;
  server.headersTimeout = keepAliveTimeout + 2000;

  // Periodic expiry cleanup for reset/refresh tokens (idempotent across
  // cluster workers). Skipped in tests, which import app directly.
  if (process.env.NODE_ENV !== 'test') {
    startTokenCleanup();
  }
};

const run = async () => {
  const workerCount = process.env.NODE_ENV === 'test' ? 1 : CLUSTER_WORKERS;

  // Optional multi-process mode (#5): stateless JWTs make horizontal scaling
  // straightforward. Note that each worker also owns a grammar-inference
  // worker thread, so total memory grows with the worker count — tune
  // CLUSTER_WORKERS accordingly (default 1 = single process, unchanged
  // behaviour).
  if (cluster.isPrimary && workerCount > 1) {
    logger.info(`Primary forking ${workerCount} workers`);
    for (let i = 0; i < workerCount; i += 1) {
      cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(
        { workerPid: worker.process.pid, code, signal },
        'Worker exited; reforking'
      );
      cluster.fork();
    });
  } else {
    await startServer();
  }
};

run();