// Importation du framework Express pour la gestion des routes
import express from "express";
// Importation de la classe Orchestrator pour coordonner les agents
import Orchestrator from "../agents/Orchestrator.js";
import Session from "../models/Session.js";

// Création d'un routeur Express pour gérer les routes liées aux questions
const router = express.Router();

// POST /api/ask — protégé par authMiddleware dans index.js (req.user disponible)
router.post("/", async (req, res) => {
  // Extraction de la question depuis le corps de la requête
  const { question } = req.body;

  // Validation : vérification que la question est bien fournie
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // Création d'une nouvelle instance de l'Orchestrator
    const orchestrator = new Orchestrator();

    const subject = req.user.subject || "mathematics";
    const result = await orchestrator.handleQuestion(question, subject);

    try {
      await Session.create({
        userId: req.user.id,
        question: String(question).trim(),
        answer: result.answer,
        quiz: Array.isArray(result.quiz) ? result.quiz : [],
        logs: Array.isArray(result.logs) ? result.logs : [],
        isFavorite: false,
      });
    } catch (dbError) {
      console.error("Session persistence failed:", dbError);
    }

    res.json(result);
  } catch (error) {
    // Gestion des erreurs : journalisation et retour d'une réponse d'erreur
    console.error("Error processing question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exportation du routeur pour l'utiliser dans l'application principale
export default router;
