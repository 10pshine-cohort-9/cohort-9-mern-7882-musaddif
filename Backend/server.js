import app from './src/app.js';
import { testDbConnection } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start Server after checking DB Connection
const startServer = async () => {
  console.log('[Server] Starting Notes Backend...');
  await testDbConnection();

  app.listen(PORT, () => {
    console.log(`[Server] Express server running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();