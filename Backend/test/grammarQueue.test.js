import { expect } from 'chai';
import { BoundedTaskQueue } from '../src/services/grammarQueue.js';
import { LruCache } from '../src/services/grammarCache.js';

describe('BoundedTaskQueue', () => {
  it('executes jobs and resolves results', async () => {
    const queue = new BoundedTaskQueue({ maxPending: 4, executor: async (x) => x * 2, timeoutMs: 1000 });
    const results = await Promise.all([queue.submit(1), queue.submit(2), queue.submit(3)]);
    expect(results).to.deep.equal([2, 4, 6]);
  });

  it('serializes work through a single-flight executor', async () => {
    let concurrent = 0;
    let peakConcurrent = 0;
    const queue = new BoundedTaskQueue({
      maxPending: 10,
      timeoutMs: 1000,
      executor: async (x) => {
        concurrent += 1;
        peakConcurrent = Math.max(peakConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 5));
        concurrent -= 1;
        return x;
      },
    });
    await Promise.all(Array.from({ length: 5 }, (_, i) => queue.submit(i)));
    expect(peakConcurrent).to.equal(1);
  });

  it('rejects with QUEUE_FULL when the queue saturates', async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const queue = new BoundedTaskQueue({
      maxPending: 2,
      timeoutMs: 5000,
      executor: async () => {
        await gate;
        return 'done';
      },
    });

    const first = queue.submit('a');
    queue.submit('b');
    queue.submit('c');

    const fourth = queue.submit('d');
    let queueError;
    try {
      await fourth;
    } catch (error) {
      queueError = error;
    }
    expect(queueError).to.be.instanceOf(Error);
    expect(queueError.message).to.contain('busy');
    expect(queueError.code).to.equal('QUEUE_FULL');

    release();
    expect(await first).to.equal('done');
  });

  it('rejects with TIMEOUT when a job exceeds the timeout', async () => {
    const queue = new BoundedTaskQueue({
      maxPending: 2,
      timeoutMs: 30,
      executor: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'too slow';
      },
    });

    const job = queue.submit('x');
    let queueError;
    try {
      await job;
    } catch (error) {
      queueError = error;
    }
    expect(queueError).to.be.instanceOf(Error);
    expect(queueError.message).to.contain('timed out');
    expect(queueError.code).to.equal('TIMEOUT');
  });
});

describe('LruCache', () => {
  it('stores and returns values', () => {
    const cache = new LruCache({ maxEntries: 3 });
    cache.set('a', 1);
    expect(cache.get('a')).to.equal(1);
    expect(cache.has('a')).to.be.true;
  });

  it('evicts the least-recently-used entry beyond capacity', () => {
    const cache = new LruCache({ maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // a becomes most-recently-used
    cache.set('c', 3); // evicts b
    expect(cache.get('b')).to.equal(undefined);
    expect(cache.get('a')).to.equal(1);
    expect(cache.get('c')).to.equal(3);
  });

  it('refreshes recency on get', () => {
    const cache = new LruCache({ maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3); // evicts b, keeps a
    expect(cache.get('a')).to.equal(1);
    expect(cache.has('b')).to.be.false;
  });
});