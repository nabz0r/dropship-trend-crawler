require('dotenv').config();
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { connectDatabase } = require('./config/database');
const { setupCrawlerJob } = require('./services/crawler');
const { setupAnalyzerJob } = require('./services/analyzer');
const { setupCatalogManager } = require('./services/catalogManager');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à la base de données
(async () => {
  try {
    // Tenter de se connecter à MongoDB, mais continuer même si la connexion échoue
    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn(`Connexion à MongoDB échouée: ${dbError.message}. Le système fonctionnera en mode démo.`);
    }
    
    // Démarrer le serveur indépendamment de la connexion à la base de données
    startServer();
  } catch (error) {
    logger.error(`Erreur lors du démarrage de l'application: ${error.message}`);
    process.exit(1);
  }
})();

function startServer() {
  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Routes API
  app.use('/api/products', require('./routes/products'));
  app.use('/api/trends', require('./routes/trends'));
  app.use('/api/settings', require('./routes/settings'));
  
  // Route pour déclencher manuellement un job de crawling
  app.post('/api/crawl', async (req, res) => {
    try {
      logger.info('Démarrage manuel du job de crawling');
      
      // Lancer les jobs en arrière-plan
      const crawlPromise = setupCrawlerJob();
      const analyzePromise = setupAnalyzerJob();
      const catalogPromise = setupCatalogManager();
      
      // Répondre immédiatement pour ne pas bloquer le client
      res.json({ 
        status: 'processing',
        message: 'Job de crawling démarré avec succès. Les résultats seront disponibles dans quelques instants.'
      });
      
      // Attendre que les jobs se terminent
      try {
        await Promise.all([crawlPromise, analyzePromise, catalogPromise]);
        logger.info('Job de crawling manuel terminé avec succès');
      } catch (jobError) {
        logger.error(`Erreur lors du job de crawling manuel: ${jobError.message}`);
      }
    } catch (error) {
      logger.error(`Erreur lors du lancement du job de crawling manuel: ${error.message}`);
      res.status(500).json({ 
        status: 'error',
        message: 'Erreur lors du lancement du job de crawling'
      });
    }
  });
  
  // Route par défaut pour servir l'application frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  
  // Planification des tâches de crawling (toutes les heures)
  cron.schedule('0 * * * *', async () => {
    logger.info('Démarrage du job de crawling horaire');
    try {
      await setupCrawlerJob();
      await setupAnalyzerJob();
      await setupCatalogManager();
      logger.info('Job de crawling terminé avec succès');
    } catch (error) {
      logger.error(`Erreur lors du job de crawling: ${error.message}`);
    }
  });
  
  // Exécuter un premier crawling au démarrage (sauf en mode production)
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Exécution du job de crawling initial (mode développement)');
    setTimeout(async () => {
      try {
        await setupCrawlerJob();
        await setupAnalyzerJob();
        await setupCatalogManager();
        logger.info('Job de crawling initial terminé avec succès');
      } catch (error) {
        logger.error(`Erreur lors du job de crawling initial: ${error.message}`);
      }
    }, 2000); // Délai de 2 secondes pour laisser le serveur démarrer
  }
  
  // Démarrage du serveur
  app.listen(PORT, () => {
    logger.info(`Serveur démarré sur le port ${PORT}`);
    logger.info(`Interface web disponible à http://localhost:${PORT}`);
    logger.info(`API disponible à http://localhost:${PORT}/api`);
  });
}