/**
 * Single-flight bounded task queue with up to `maxPending` queued jobs and a
 * per-job timeout. Provides backpressure: when the queue is saturated the
 * submit rejects immediately with code QUEUE_FULL so the API can return a
 * quick 429 instead of letting requests pile up behind a slow model.
 */
export class BoundedTaskQueue {
  constructor({ maxPending = 16, executor, timeoutMs = 120000 }) {
    this.maxPending = maxPending;
    this.executor = executor;
    this.timeoutMs = timeoutMs;
    this.pending = [];
    this.inFlight = 0;
  }

  submit(payload) {
    if (this.pending.length >= this.maxPending) {
      return Promise.reject(
        Object.assign(new Error('AI service is busy; please try again later.'), { code: 'QUEUE_FULL' })
      );
    }
    return new Promise((resolve, reject) => {
      this.pending.push({ payload, resolve, reject });
      this._pump();
    });
  }

  _pump() {
    while (this.inFlight < 1 && this.pending.length > 0) {
      const job = this.pending.shift();
      this.inFlight += 1;

      const timeout = setTimeout(() => {
        job.reject(
          Object.assign(new Error('Grammar check timed out; please try again later.'), { code: 'TIMEOUT' })
        );
        this.inFlight -= 1;
        this._pump();
      }, this.timeoutMs);

      Promise.resolve(this.executor(job.payload))
        .then((result) => {
          clearTimeout(timeout);
          job.resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          job.reject(error);
        })
        .finally(() => {
          this.inFlight -= 1;
          this._pump();
        });
    }
  }
}