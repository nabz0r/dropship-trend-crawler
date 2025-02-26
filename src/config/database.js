const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Établit la connexion à la base de données MongoDB
 */
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dropship-crawler';
    
    // Options de connexion
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Connexion à MongoDB
    await mongoose.connect(mongoUri, options);
    
    logger.info('Connexion à MongoDB établie avec succès');
    
    // Événements de connexion
    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur de connexion MongoDB: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnecté, tentative de reconnexion...');
    });
    
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
    process.exit(1);
  }
}

module.exports = { connectDatabase };