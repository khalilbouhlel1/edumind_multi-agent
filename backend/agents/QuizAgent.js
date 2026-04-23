import BaseAgent from "./BaseAgent.js";
import groq from "../config/ai.js";
import { subjectPromptLabel } from "../config/subjects.js";

const MAX_ANSWER_CHARS = 12000;
const MAX_RETRIES = 2;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Determine how many questions to ask based on material length.
 */
const calcQuestionCount = (material) => {
  const words = material.trim().split(/\s+/).length;
  if (words < 150) return 2;
  if (words < 500) return 3;
  return 5;
};

/**
 * Normalize a single quiz item. Supports MCQ and True/False types.
 * Adds optional `explanation` and `type` fields.
 */
const normalizeQuizItem = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const question = String(raw.question ?? "").trim();
  if (!question) return null;

  const type = String(raw.type ?? "mcq").toLowerCase();

  // ── True/False ──────────────────────────────────────────────────────────
  if (type === "true_false") {
    const options = ["True", "False"];
    const rawAnswer = String(raw.answer ?? "").trim().toLowerCase();
    const answer =
      rawAnswer === "true" || rawAnswer === "false"
        ? rawAnswer.charAt(0).toUpperCase() + rawAnswer.slice(1)
        : null;
    if (!answer) return null;
    return {
      type: "true_false",
      question,
      options,
      answer,
      explanation: String(raw.explanation ?? "").trim() || null,
    };
  }

  // ── MCQ (default) ────────────────────────────────────────────────────────
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

  return {
    type: "mcq",
    question,
    options,
    answer,
    explanation: String(raw.explanation ?? "").trim() || null,
  };
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
  }
  return out;
};

// ─── Agent ──────────────────────────────────────────────────────────────────

class QuizAgent extends BaseAgent {
  constructor(onLog) {
    super("Quiz Agent", onLog);
  }

  /**
   * @param {string} finalAnswerText
   * @param {string} subject
   * @param {{ difficulty?: 'easy'|'medium'|'hard' }} [options]
   * @returns {Promise<{ quiz: Array, logs: object[] }>}
   */
  async call(finalAnswerText, subject, options = {}) {
    const logs = [];
    const material = String(finalAnswerText || "").slice(0, MAX_ANSWER_CHARS);
    const subjectLabel = subjectPromptLabel(subject);
    const difficulty = options.difficulty ?? "medium";
    const targetCount = calcQuestionCount(material);

    logs.push(
      this.log(
        `Generating ${targetCount} ${difficulty}-difficulty questions (MCQ + True/False mix)...`
      )
    );

    if (!material.trim()) {
      logs.push(this.log("Skipped quiz: empty answer text."));
      return { quiz: [], logs };
    }

    const difficultyInstructions = {
      easy: "Focus on basic recall and simple definitions. Questions should be straightforward.",
      medium:
        "Mix recall with comprehension. Some questions should require understanding, not just memorization.",
      hard:
        "Focus on application and analysis. Questions should require students to apply concepts to new scenarios or compare/contrast ideas.",
    };

    const prompt = `
You are a Quiz Agent creating review questions for a ${subjectLabel} student. Given the study material below, create exactly ${targetCount} questions that test key ideas.

Difficulty level: ${difficulty.toUpperCase()} — ${difficultyInstructions[difficulty]}

Mix question types:
- Most questions should be "mcq" (multiple-choice with 4 options)
- At least 1 question should be "true_false" (True/False)

Material:
"""
${material}
"""

Return ONLY a valid JSON array (no markdown, no commentary). The array length must be exactly ${targetCount}.
Each element must be an object with these fields:
- "type": either "mcq" or "true_false"
- "question": string (the question text)
- "options": 
    - For "mcq": array of exactly 4 distinct strings
    - For "true_false": ["True", "False"]
- "answer": string that MUST exactly equal one of the values in "options"
- "explanation": string (1-2 sentences explaining why the answer is correct — this helps students learn)
`.trim();

    let quiz = [];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logs.push(
          this.log(
            `Attempt ${attempt}/${MAX_RETRIES}: Asking Llama 3 to build quiz JSON...`
          )
        );

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
        });

        const text =
          completion.choices[0]?.message?.content?.trim() || "[]";

        try {
          quiz = parseQuizJson(text);
        } catch (parseErr) {
          logs.push(
            this.log(`Attempt ${attempt} parse error: ${parseErr.message}`)
          );
          if (attempt < MAX_RETRIES) continue;
          return { quiz: [], logs };
        }

        if (quiz.length >= targetCount) {
          // Trim to exact count
          quiz = quiz.slice(0, targetCount);
          logs.push(
            this.log(
              `Successfully built ${quiz.length} quiz questions on attempt ${attempt}.`
            )
          );
          break;
        }

        logs.push(
          this.log(
            `Attempt ${attempt}: only ${quiz.length}/${targetCount} valid question(s). ${
              attempt < MAX_RETRIES ? "Retrying..." : "Using partial result."
            }`
          )
        );
      } catch (error) {
        logs.push(this.log(`Attempt ${attempt} error: ${error.message}`));
        if (attempt >= MAX_RETRIES) {
          return { quiz, logs };
        }
      }
    }

    return { quiz, logs };
  }
}

export default QuizAgent;
