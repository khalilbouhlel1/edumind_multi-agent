import express from "express";
import jwt from "jsonwebtoken";
import Orchestrator from "../agents/Orchestrator.js";
import Session from "../models/Session.js";
import { SUBJECT_SET } from "../config/subjects.js";

const router = express.Router();

/**
 * Bearer header (axios) or `token` query param (browser EventSource).
 */
function getUserFromToken(req) {
  let token = null;
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    token = header.slice("Bearer ".length).trim();
  } else if (req.query?.token) {
    token = String(req.query.token).trim();
  }
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret);
    const id = decoded.id ?? decoded.sub;
    const email = decoded.email;
    if (!id || !email) return null;
    let subject = decoded.subject;
    if (!subject || !SUBJECT_SET.has(String(subject))) {
      subject = "mathematics";
    }
    return { id: String(id), email: String(email), subject: String(subject) };
  } catch {
    return null;
  }
}

router.get("/stream", async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const question =
    typeof req.query.question === "string" ? req.query.question.trim() : "";
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
  const rawDiff = typeof req.query.difficulty === "string" ? req.query.difficulty.trim().toLowerCase() : "medium";
  const difficulty = VALID_DIFFICULTIES.has(rawDiff) ? rawDiff : "medium";

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const writeSse = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const orchestrator = new Orchestrator((log) => {
      writeSse(log);
    });

    const subject = user.subject || "mathematics";
    const result = await orchestrator.handleQuestion(question, subject, { difficulty });

    try {
      await Session.create({
        userId: user.id,
        question,
        answer: result.answer,
        quiz: Array.isArray(result.quiz) ? result.quiz : [],
        logs: Array.isArray(result.logs) ? result.logs : [],
        isFavorite: false,
      });
    } catch (dbError) {
      console.error("Session persistence failed (stream):", dbError);
    }

    writeSse({
      done: true,
      answer: result.answer,
      quiz: result.quiz || [],
      logs: result.logs || [],
    });
  } catch (error) {
    console.error("Ask stream error:", error);
    writeSse({ done: true, error: "Internal Server Error" });
  } finally {
    res.end();
  }
});

export default router;
