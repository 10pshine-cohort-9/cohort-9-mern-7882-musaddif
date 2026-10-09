import os from 'node:os';

// Raise the libuv threadpool before any threadpool work begins (bcrypt
// hashing, etc.). The default of 4 serializes CPU-bound jobs; this lets a
// burst of logins/registrations hash concurrently instead of blocking one
// another. Read once by libuv at threadpool init.
process.env.UV_THREADPOOL_SIZE = String(
  Math.min(parseInt(process.env.UV_THREADPOOL_SIZE, 10) || os.cpus().length, 16)
);

export default process.env.UV_THREADPOOL_SIZE;