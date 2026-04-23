// Importation des dépendances nécessaires
import express from "express"; // Framework web pour Node.js
import dotenv from "dotenv"; // Gestion des variables d'environnement
import connectDB from "./config/db.js"; // Configuration de la connexion à la base de données
import cors from "cors"; // Middleware pour autoriser les requêtes cross-origin
import askRouter from "./routes/ask.js"; // Routeur pour les questions d'étude
import streamAskRouter from "./routes/stream.js";
import authRouter from "./routes/auth.js";
import sessionsRouter from "./routes/sessions.js";
import quizRouter from "./routes/quiz.js";
import authMiddleware from "./middleware/authMiddleware.js";

// Configuration des variables d'environnement à partir du fichier .env
dotenv.config();

// Connexion à la base de données MongoDB
connectDB();

// Initialisation de l'application Express
const app = express();

// Configuration des middlewares
app.use(express.json()); // Permet de parser le JSON dans les requêtes entrantes
app.use(cors()); // Active le CORS pour permettre les requêtes du frontend

// Configuration des routes
app.use("/api/auth", authRouter);

const askApi = express.Router();
askApi.use(streamAskRouter); // GET /stream — SSE (JWT: Bearer or ?token=)
askApi.use(authMiddleware);
askApi.use(askRouter); // POST /
app.use("/api/ask", askApi);
app.use("/api/sessions", authMiddleware, sessionsRouter);
app.use("/api/quiz", authMiddleware, quizRouter);

// Définition du port d'écoute du serveur
const PORT = 5000;

// Démarrage du serveur et affichage d'un message de confirmation
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));