// Importation des différents agents spécialisés
import PlannerAgent from "./PlannerAgent.js"; // Agent pour la planification des tâches
import ResearchAgent from "./ResearchAgent.js"; // Agent pour la recherche d'informations
import WriterAgent from "./WriterAgent.js"; // Agent pour la rédaction des réponses
import QuizAgent from "./QuizAgent.js";

// Classe Orchestrator : coordonne le flux de travail entre les différents agents
// C'est le chef d'orchestre qui gère la séquence d'exécution des agents
class Orchestrator {
  /**
   * @param {(log: { agent: string, message: string, timestamp: string }) => void} [onLog] — invoked as soon as each log entry is created inside an agent
   */
  constructor(onLog) {
    this.onLog = typeof onLog === "function" ? onLog : null;
    this.planner = new PlannerAgent(this.onLog);
    this.researcher = new ResearchAgent(this.onLog);
    this.writer = new WriterAgent(this.onLog);
    this.quiz = new QuizAgent(this.onLog);
  }

  // Méthode principale pour traiter une question utilisateur
  // Orchestre le flux complet : planification → recherche → rédaction
  async handleQuestion(question, subject) {
    let allLogs = []; // Tableau pour accumuler tous les logs des agents

    // ÉTAPE 1 : Planification
    const planResult = await this.planner.call(question, subject);
    allLogs = [...allLogs, ...planResult.logs];

    const researchResults = [];
    for (const step of planResult.steps) {
        const researchResult = await this.researcher.call(step, subject);
        allLogs = [...allLogs, ...researchResult.logs];
        researchResults.push({ step, result: researchResult.result });
    }

    const writerResult = await this.writer.call(researchResults, subject);
    allLogs = [...allLogs, ...writerResult.logs];

    const quizResult = await this.quiz.call(writerResult.answer, subject);
    allLogs = [...allLogs, ...quizResult.logs];

    return {
        answer: writerResult.answer,
        logs: allLogs,
        quiz: quizResult.quiz || [],
    };
  }
}

// Exportation de la classe Orchestrator pour l'utiliser dans les routes
export default Orchestrator;
