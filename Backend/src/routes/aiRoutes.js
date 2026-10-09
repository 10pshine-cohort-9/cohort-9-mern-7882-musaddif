import express from "express";
import { checkGrammar } from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { aiLimiter } from "../utils/rateLimiter.js";

const router = express.Router();

// The grammar endpoint runs an expensive local model, so it requires
// authentication and has a dedicated strict rate limit.
router.post("/grammar", authenticateToken, aiLimiter, checkGrammar);

export default router;