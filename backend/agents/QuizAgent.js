import BaseAgent from "./BaseAgent.js";
import groq from "../config/ai.js";
import { subjectPromptLabel } from "../config/subjects.js";

const MAX_ANSWER_CHARS = 12000;

const normalizeQuizItem = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const question = String(raw.question ?? "").trim();
  if (!question) return null;

  let options = raw.options;
  if (!Array.isArray(options)) return null;
  options = options.map((o) => String(o ?? "").trim()).filter(Boolean);
  if (options.length !== 4) return null;

  let answer = String(raw.answer ?? "").trim();
  if (!options.includes(answer)) {
    const idx = Number.parseInt(String(raw.answer).trim(), 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < 4 && options[idx]) {
      answer = options[idx];
    } else {
      return null;
    }
  }

  return { question, options, answer };
};

const parseQuizJson = (text) => {
  let cleaned = String(text || "")
    .replace(/```json|```/gi, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end <= start) {
      throw new Error("No JSON array found in model output");
    }
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  if (!Array.isArray(parsed)) return [];
  const out = [];
  for (const item of parsed) {
    const norm = normalizeQuizItem(item);
    if (norm) out.push(norm);
    if (out.length === 3) break;
  }
  return out;
};

class QuizAgent extends BaseAgent {
  constructor(onLog) {
    super("Quiz Agent", onLog);
  }

  /**
   * @param {string} finalAnswerText
   * @returns {Promise<{ quiz: Array<{question: string, options: string[], answer: string}>, logs: object[] }>}
   */
  async call(finalAnswerText, subject) {
    const logs = [];
    const material = String(finalAnswerText || "").slice(0, MAX_ANSWER_CHARS);
    const subjectLabel = subjectPromptLabel(subject);

    logs.push(this.log("Received final answer text; generating 3 multiple-choice questions..."));

    if (!material.trim()) {
      logs.push(this.log("Skipped quiz: empty answer text."));
      return { quiz: [], logs };
    }

    const prompt = `
You are a Quiz Agent creating checks for a ${subjectLabel} student. Given the study material below, create exactly 3 multiple-choice questions that test key ideas from the material, using vocabulary and scenarios appropriate for ${subjectLabel}.

Material:
"""
${material}
"""

Return ONLY a valid JSON array (no markdown, no commentary). The array length must be 3.
Each element must be an object with:
- "question": string (the question text)
- "options": array of exactly 4 strings (distinct answer choices)
- "answer": string that MUST exactly equal one of the four strings in "options" (the correct choice)
`.trim();

    try {
      logs.push(this.log("Reasoning: Asking Llama 3 (via Groq) to build quiz JSON..."));

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
      });

      const text = completion.choices[0]?.message?.content?.trim() || "[]";
      let quiz = [];

      try {
        quiz = parseQuizJson(text);
      } catch (parseErr) {
        logs.push(this.log(`Error parsing quiz JSON: ${parseErr.message}`));
        return { quiz: [], logs };
      }

      if (quiz.length < 3) {
        logs.push(this.log(`Warning: only ${quiz.length} valid question(s) after validation.`));
      } else {
        logs.push(this.log("Successfully built 3 quiz questions."));
      }

      return { quiz, logs };
    } catch (error) {
      logs.push(this.log(`Error: ${error.message}`));
      return { quiz: [], logs };
    }
  }
}

export default QuizAgent;
