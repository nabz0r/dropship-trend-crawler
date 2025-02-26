require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { setupCrawlerJob } = require('./services/crawler');
const { setupAnalyzerJob } = require('./services/analyzer');
const { setupCatalogManager } = require('./services/catalogManager');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/trends', require('./routes/trends'));
app.use('/api/settings', require('./routes/settings'));

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

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
});