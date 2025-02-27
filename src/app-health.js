/**
 * Module d'intégration des routes de santé dans l'application principale
 * 
 * Ce fichier doit être importé dans app.js pour ajouter les endpoints de santé
 * nécessaires au monitoring et aux health checks des conteneurs Docker
 */

const healthRoutes = require('./routes/healthRoutes');

/**
 * Configure les routes de santé pour l'application Express
 * @param {object} app - Instance de l'application Express
 */
function setupHealthMonitoring(app) {
  if (!app) {
    throw new Error('L\'instance de l\'application Express est requise');
  }
  
  // Ajout des routes de santé
  app.use('/api/health', healthRoutes);
  
  // Middleware de surveillance de la mémoire
  app.use((req, res, next) => {
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB
    
    // Journaliser si l'utilisation de la mémoire dépasse un seuil
    if (memoryUsage.rss > memoryThreshold) {
      console.warn(`Alerte mémoire: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB utilisés`);
    }
    
    next();
  });
  
  // Gérer la fermeture propre de l'application
  setupGracefulShutdown(app);
}

/**
 * Configure la fermeture propre de l'application lors de l'arrêt du conteneur
 * @param {object} app - Instance de l'application Express
 */
function setupGracefulShutdown(app) {
  // Capture les signaux de terminaison
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
      console.log(`Signal ${signal} reçu, arrêt gracieux de l'application...`);
      
      // Récupérer le serveur HTTP de l'application si disponible
      const server = app.get('server');
      
      if (server) {
        server.close(() => {
          console.log('Serveur HTTP fermé.');
          // Fermer les connexions à la base de données, etc.
          // Puis terminer le processus
          process.exit(0);
        });
        
        // Définir un timeout pour la fermeture forcée
        setTimeout(() => {
          console.error('Fermeture forcée après timeout.');
          process.exit(1);
        }, 30000); // 30 secondes
      } else {
        process.exit(0);
      }
    });
  });
}

module.exports = { setupHealthMonitoring };