import { Worker } from 'node:worker_threads';
import { BoundedTaskQueue } from './grammarQueue.js';
import { LruCache } from './grammarCache.js';
import logger from '../utils/logger.js';

/**
 * Grammar service client.
 *
 * Inference runs in a dedicated worker thread (grammarWorker.js) so the main
 * event loop is never blocked by the ONNX forward pass. Requests are serialized
 * through a bounded single-flight queue (the model processes one job at a time)
 * with an input cache for identical texts and a per-job timeout.
 */

const CACHE_MAX_ENTRIES = parseInt(process.env.GRAMMAR_CACHE_MAX || '100', 10);
const MAX_PENDING = parseInt(process.env.GRAMMAR_MAX_QUEUE || '16', 10);
const JOB_TIMEOUT_MS = parseInt(process.env.GRAMMAR_JOB_TIMEOUT_MS || '120000', 10);

const cache = new LruCache({ maxEntries: CACHE_MAX_ENTRIES });
const normalizeKey = (text) => text.trim().toLowerCase();

let worker = null;
let workerBooting = false;
let nextJobId = 1;
const inflight = new Map(); // id -> { resolve, reject }

const rejectAllInflight = (error) => {
  error.code = 'AI_FAILED';
  for (const job of inflight.values()) job.reject(error);
  inflight.clear();
};

const handleWorkerMessage = ({ id, ok, correctedText, error }) => {
  const job = inflight.get(id);
  if (!job) return; // already timed out or rejected
  inflight.delete(id);
  if (ok) {
    job.resolve(correctedText);
  } else {
    const err = new Error(error || 'Grammar correction failed.');
    err.code = 'AI_FAILED';
    job.reject(err);
  }
};

const getWorker = () => {
  if (worker || workerBooting) return worker;

  workerBooting = true;
  logger.info('Grammar service: spawning inference worker thread');
  const spawned = new Worker(new URL('./grammarWorker.js', import.meta.url));
  spawned.unref(); // tests / short-lived processes may exit; the http server keeps it alive otherwise
  spawned.on('message', handleWorkerMessage);
  spawned.on('error', (err) => {
    logger.error({ err }, 'Grammar worker error');
    rejectAllInflight(new Error(err.message || 'Grammar service unavailable.'));
    worker = null;
    workerBooting = false;
  });
  spawned.on('exit', (code) => {
    logger.warn({ code }, 'Grammar worker exited');
    rejectAllInflight(new Error('Grammar service unavailable.'));
    worker = null;
    workerBooting = false;
  });
  worker = spawned;
  workerBooting = false;
  return worker;
};

const submitToWorker = (text) =>
  new Promise((resolve, reject) => {
    const jobId = (nextJobId += 1);
    inflight.set(jobId, { resolve, reject });
    const w = getWorker();
    if (!w) {
      inflight.delete(jobId);
      reject(Object.assign(new Error('Grammar service is starting up; please try again.'), { code: 'AI_FAILED' }));
      return;
    }
    try {
      w.postMessage({ id: jobId, text });
    } catch (error) {
      inflight.delete(jobId);
      reject(Object.assign(new Error('Grammar service is starting up; please try again.'), { code: 'AI_FAILED' }));
    }
  });

const queue = new BoundedTaskQueue({
  maxPending: MAX_PENDING,
  executor: submitToWorker,
  timeoutMs: JOB_TIMEOUT_MS,
});

export const correctGrammar = (text) => {
  const key = normalizeKey(text);
  const cached = cache.get(key);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  return queue.submit(text).then((correctedText) => {
    cache.set(key, correctedText);
    return correctedText;
  });
};