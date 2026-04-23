// Importation de Mongoose pour la gestion de la base de données MongoDB
import mongoose from "mongoose";

// Fonction asynchrone pour établir la connexion à la base de données MongoDB
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.log("MongoDB skipped: no MONGO_URI provided");
        return;
    }

    try {
        // Tentative de connexion à MongoDB en utilisant l'URI depuis les variables d'environnement
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected"); // Message de confirmation de connexion réussie
    } catch (error) {
        // Affichage des erreurs en cas d'échec de connexion
        console.error(error);
    }
};

// Exportation de la fonction pour l'utiliser dans d'autres fichiers
export default connectDB;
