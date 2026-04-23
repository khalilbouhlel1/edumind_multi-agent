// Importation de la classe de base pour l'héritage
import BaseAgent from "./BaseAgent.js";
// Importation du client Groq pour l'accès à l'IA
import groq from "../config/ai.js";
import { subjectPromptLabel } from "../config/subjects.js";

// Classe PlannerAgent : spécialisé dans la décomposition des questions en sous-tâches
// Hérite de BaseAgent pour bénéficier des fonctionnalités de base
class PlannerAgent extends BaseAgent {
  // Constructeur : initialise l'agent avec son nom spécifique
  constructor(onLog) {
    super("Planner Agent", onLog);
  }

  // Méthode principale : décompose une question utilisateur en étapes de recherche
  async call(userQuestion, subject) {
    const logs = [];
    const subjectLabel = subjectPromptLabel(subject);

    logs.push(this.log(`Received question: "${userQuestion}"`));
    logs.push(this.log("Reasoning: Asking Llama 3 (via Groq) to break down the question..."));

    try {
      const prompt = `
        You are helping a ${subjectLabel} student. Break this question into 1-3 research topics relevant to a ${subjectLabel} context.
        Question: "${userQuestion}"

        Return ONLY a JSON array of strings. Do not add markdown formatting.
      `;

      // Appel à l'API Groq avec le modèle Llama 3.1
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant", // Modèle rapide et efficace pour cette tâche
      });

      // Nettoyage et extraction de la réponse de l'IA
      const text = completion.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() || "[]";
      
      let steps = []; // Tableau pour stocker les étapes de recherche
      try {
        // Tentative de parsing du JSON retourné par l'IA
        steps = JSON.parse(text);
      } catch (e) {
        // En cas d'erreur de parsing, utiliser la question originale comme étape par défaut
        steps = [userQuestion];
        logs.push(this.log("Error parsing AI response, defaulting to original question."));
      }
      
      // Journalisation des sujets identifiés
      logs.push(this.log(`Reasoning: Identified topics: ${steps.join(", ")}`));
      
      // Journalisation de chaque action de recherche planifiée
      steps.forEach(step => {
        logs.push(this.log(`Plan Action: Research topic "${step}"`));
      });

      // Retourne les étapes de recherche et les logs associés
      return { steps, logs };
    } catch (error) {
      // Gestion des erreurs : journalisation et retour de la question originale
      logs.push(this.log(`Error: ${error.message}`));
      return { steps: [userQuestion], logs };
    }
  }
}

// Exportation de la classe pour l'utiliser dans l'Orchestrator
export default PlannerAgent;
