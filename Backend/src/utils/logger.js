import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';
const logDir = path.join(__dirname, '..', '..', 'logs');
const logFile = path.join(logDir, 'app.log');

let transport;

if (isProduction) {
  // In production write structured JSON logs to a file.
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  transport = pino.transport({
    targets: [
      { target: 'pino/file', options: { destination: logFile }, level: 'info' },
    ],
  });
} else {
  // In development use the human-friendly pino-pretty output.
  transport = pino.transport({
    targets: [
      { target: 'pino/file', options: { destination: 1 }, level: 'debug' },
    ],
  });
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'notes-backend' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'password_hash',
        'token',
        '*.password',
        '*.token',
      ],
      censor: '[REDACTED]',
    },
  },
  transport
);

export default logger;
