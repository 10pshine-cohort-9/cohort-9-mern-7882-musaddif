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
    console.error("Grammar correction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check grammar.",
    });
  }
};