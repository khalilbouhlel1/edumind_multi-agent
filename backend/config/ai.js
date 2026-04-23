// Importation du SDK Groq pour l'accès aux modèles d'IA
import Groq from "groq-sdk";
// Importation de dotenv pour la gestion des variables d'environnement
import dotenv from "dotenv";

// Configuration des variables d'environnement
dotenv.config();

// Initialisation du client Groq avec la clé API depuis les variables d'environnement
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Exportation de l'instance Groq pour l'utiliser dans les agents
export default groq;
