import BaseAgent from "./BaseAgent.js";
import groq from "../config/ai.js";
import { subjectPromptLabel } from "../config/subjects.js";

class WriterAgent extends BaseAgent {
  constructor(onLog) {
    super("Writer Agent", onLog);
  }

  async call(researchResults, subject) {
    const logs = [];
    const subjectLabel = subjectPromptLabel(subject);

    logs.push(this.log("Received research results. Synthesizing final answer using AI..."));

    const context = researchResults.map((r) => r.result).join("\n\n");

    try {
      const prompt = `
            You are writing an explanation for a ${subjectLabel} student.

            Research Notes:
            ${context}

            Instructions:
            - Adapt your tone: use formal and precise language for mathematics, physics, or computer science; descriptive and contextual language for history or literature; applied and process-oriented for biology, chemistry, or economics.
            - Use examples exclusively from the ${subjectLabel} domain. For example: if the field is computer science, use code snippets or algorithms; if biology, use organism or cell examples; if history, use real historical events; if mathematics, use equations and proofs where appropriate.
            - Assume the student has foundational knowledge in ${subjectLabel} but explain advanced concepts clearly.

            Requirements:
            - Be clear and well structured.
            - Use bullet points if helpful.
            - Stay encouraging and academically appropriate for ${subjectLabel}.
        `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
      });

      const answer = completion.choices[0]?.message?.content || "Could not generate answer.";

      logs.push(this.log("Reasoning: Generated final response based on research context."));

      return { answer, logs };
    } catch (error) {
      logs.push(this.log(`Error: ${error.message}`));
      return { answer: "I encountered an error writing the final response.", logs };
    }
  }
}

export default WriterAgent;
