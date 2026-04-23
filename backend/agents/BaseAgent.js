// Classe de base pour tous les agents IA du système
// Définit la structure commune et les fonctionnalités partagées
class BaseAgent {
  constructor(name, onLog) {
    this.name = name;
    this.onLog = typeof onLog === "function" ? onLog : null;
  }

  log(message) {
    const entry = {
      agent: this.name,
      message,
      timestamp: new Date().toISOString(),
    };
    if (this.onLog) {
      this.onLog(entry);
    }
    return entry;
  }

  // Méthode abstraite que chaque agent doit implémenter
  // Cette méthode définit le comportement principal de l'agent
  async call(input) {
    throw new Error("Method 'call' must be implemented");
  }
}

// Exportation de la classe de base pour l'héritage par d'autres agents
export default BaseAgent;
