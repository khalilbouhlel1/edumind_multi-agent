import express from "express";
import QuizAgent from "../agents/QuizAgent.js";

const router = express.Router();

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/**
 * POST /api/quiz/regenerate
 * Body: { answer: string, difficulty?: "easy"|"medium"|"hard" }
 * Protected by authMiddleware (mounted in index.js)
 */
router.post("/regenerate", async (req, res) => {
  const { answer, difficulty: rawDiff } = req.body;

  if (!answer || typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({ error: "answer text is required" });
  }

  const difficulty = VALID_DIFFICULTIES.has(String(rawDiff ?? "").toLowerCase())
    ? String(rawDiff).toLowerCase()
    : "medium";

  const subject = req.user?.subject ?? "mathematics";

  try {
    const agent = new QuizAgent();
    const { quiz, logs } = await agent.call(answer.trim(), subject, { difficulty });
    return res.json({ quiz, logs });
  } catch (err) {
    console.error("Quiz regeneration error:", err);
    return res.status(500).json({ error: "Failed to regenerate quiz" });
  }
});

export default router;
