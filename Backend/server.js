import app from './src/app.js';
import { testDbConnection } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("[Server] Starting Notes Backend...");

    const dbReady = await testDbConnection();

    if (!dbReady) {
      console.error("[Server] Database is unavailable.");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`[Server] Express server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
};

startServer();