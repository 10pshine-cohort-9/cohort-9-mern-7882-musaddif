import express from "express";
import { checkGrammar } from "../controllers/aiController.js";

const router = express.Router();

router.post("/grammar", checkGrammar);

export default router;