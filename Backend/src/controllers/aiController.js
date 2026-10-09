import { correctGrammar } from "../services/grammarService.js";

export const checkGrammar = async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message: "Text is required.",
      });
    }

    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text cannot be empty.",
      });
    }

    // Prevent extremely large requests
    const MAX_TEXT_LENGTH = 10000;

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Text cannot exceed ${MAX_TEXT_LENGTH} characters.`,
      });
    }

    // Send text to AI model
    const correctedText = await correctGrammar(text);

    return res.status(200).json({
      success: true,
      data: {
        originalText: text,
        correctedText,
      },
    });
  } catch (error) {
    console.error('Grammar correction error:', error);

    // Backpressure from the worker queue: respond quickly instead of piling
    // more requests onto a saturated inference worker.
    if (error.code === 'QUEUE_FULL' || error.code === 'TIMEOUT') {
      return res.status(429).json({
        success: false,
        message: 'Grammar service is busy. Please try again later.',
      });
    }

    // Worker/model unavailable: service degradation, not an app bug.
    return res.status(503).json({
      success: false,
      message: 'Grammar service is temporarily unavailable. Please try again later.',
    });
  }
};