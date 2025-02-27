/**
 * Routes pour la vérification de l'état de l'application
 * Utilisées pour les health checks des conteneurs et systèmes de monitoring
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { version } = require('../../package.json');

/**
 * @route   GET /api/health
 * @desc    Vérification basique de l'état de l'application
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    version
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Vérification détaillée de l'état de l'application et ses dépendances
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  // Vérifier l'état de MongoDB
  let mongoStatus = 'ok';
  let mongoDetails = null;

  try {
    if (mongoose.connection.readyState !== 1) {
      mongoStatus = 'error';
      mongoDetails = 'Connexion MongoDB non établie';
    } else {
      // Effectuer un ping pour vérifier la réactivité
      const adminDb = mongoose.connection.db.admin();
      const pingResult = await adminDb.ping();
      mongoDetails = pingResult.ok === 1 ? 'Réponse normale' : 'Réponse anormale';
    }
  } catch (error) {
    mongoStatus = 'error';
    mongoDetails = error.message;
  }

  // État du système
  const systemInfo = {
    memory: {
      total: process.memoryUsage().heapTotal,
      used: process.memoryUsage().heapUsed,
      rss: process.memoryUsage().rss
    },
    cpu: process.cpuUsage()
  };

  // État global
  const overallStatus = mongoStatus === 'ok' ? 'ok' : 'degraded';
  
  res.status(overallStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date(),
    uptime: process.uptime(),
    version,
    services: {
      database: {
        status: mongoStatus,
        details: mongoDetails
      }
    },
    system: systemInfo,
    env: process.env.NODE_ENV
  });
});

module.exports = router;