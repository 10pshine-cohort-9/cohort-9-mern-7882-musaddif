import 'dotenv/config';
import app from './src/app.js';
import { testDbConnection } from './src/config/db.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  logger.info('Starting Notes Backend...');
  const dbConnected = await testDbConnection();

  if (!dbConnected) {
    logger.warn('Database connection failed on startup; server will still start.');
  }

  app.listen(PORT, () => {
    logger.info(`Express server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();