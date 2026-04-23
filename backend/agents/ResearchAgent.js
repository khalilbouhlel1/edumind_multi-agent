// Importation de la classe de base pour l'héritage
import BaseAgent from "./BaseAgent.js";
// Importation du client Groq pour l'accès à l'IA
import groq from "../config/ai.js";
import { subjectPromptLabel } from "../config/subjects.js";

// Classe ResearchAgent : spécialisé dans la recherche d'informations éducatives
// Hérite de BaseAgent pour bénéficier des fonctionnalités de base
class ResearchAgent extends BaseAgent {
  // Constructeur : initialise l'agent avec son nom spécifique
  constructor(onLog) {
    super("Research Agent", onLog);
  }

  // Méthode principale : recherche des informations sur un sujet spécifique
  async call(task, subject) {
    const logs = [];
    const subjectLabel = subjectPromptLabel(subject);

    logs.push(this.log(`Received task: "${task}"`));
    logs.push(this.log("Reasoning: Using Llama 3 (via Groq) to retrieve information..."));

    try {
      const cleanTask = task.replace(/Search for |Research topic /gi, "").replace(/"/g, "");

      const prompt = `
        You are researching for a ${subjectLabel} student. Use terminology, depth level, and examples appropriate for someone studying ${subjectLabel}.
        Provide a concise but informative summary (approx 100 words) about: "${cleanTask}".
        Focus on educational facts aligned with ${subjectLabel}.
      `;

      // Appel à l'API Groq avec le modèle Llama 3.1
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant", // Modèle rapide et efficace pour cette tâche
      });

      // Extraction du texte de la réponse de l'IA
      const text = completion.choices[0]?.message?.content || "No info retrieved.";

      // Journalisation de l'observation des résultats
      logs.push(this.log(`Observation: Retrieved information on "${cleanTask}".`));
      
      // Retourne le résultat de la recherche et les logs associés
      return { result: text, logs };
    } catch (error) {
       // Gestion des erreurs : journalisation et retour d'un message d'erreur
       logs.push(this.log(`Error: ${error.message}`));
       return { result: "Failed to retrieve information.", logs };
    }
  }
}

// Exportation de la classe pour l'utiliser dans l'Orchestrator
export default ResearchAgent;
