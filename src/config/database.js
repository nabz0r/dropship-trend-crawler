const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Établit la connexion à la base de données MongoDB
 */
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dropship-crawler';
    
    // Connexion à MongoDB (options obsolètes supprimées)
    await mongoose.connect(mongoUri);
    
    logger.info('Connexion à MongoDB établie avec succès');
    
    // Événements de connexion
    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur de connexion MongoDB: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnecté, tentative de reconnexion...');
    });
    
    // Configuration des options globales
    mongoose.set('strictQuery', true);
    
    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
        process.exit(0);
      } catch (err) {
        logger.error(`Erreur lors de la fermeture de la connexion MongoDB: ${err.message}`);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error(`Impossible de se connecter à MongoDB: ${error.message}`);
    
    // Journaliser les détails additionnels pour le débogage
    if (error.name === 'MongoServerSelectionError') {
      logger.error("Erreur de connexion au serveur MongoDB. Vérifiez que MongoDB est en cours d'exécution.");
    } else if (error.name === 'MongoParseError') {
      logger.error("URI de connexion MongoDB invalide. Vérifiez votre configuration MONGODB_URI.");
    }
    
    // En mode développement, ne pas quitter l'application pour permettre le fonctionnement en mode démo
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Application en mode développement - continuera à fonctionner sans base de données (mode démo)');
      return null;
    }
  }
}

module.exports = { connectDatabase };
