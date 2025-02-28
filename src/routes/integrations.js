/**
 * Routes pour l'intégration avec les plateformes e-commerce
 * Fournit des endpoints pour tester et configurer les intégrations
 */
const express = require('express');
const router = express.Router();
const { initIntegrations } = require('../services/catalogManager');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Chemin vers le fichier de configuration local
const CONFIG_FILE = path.join(process.cwd(), 'config', 'crawler-settings.json');

// Fonction utilitaire pour charger les paramètres
async function loadSettings() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.warn(`Impossible de charger les paramètres: ${error.message}.`);
    return { integrations: {} };
  }
}

/**
 * @route   GET /api/integrations/test
 * @desc    Teste la connexion avec la plateforme d'e-commerce configurée
 * @access  Public
 */
router.get('/test', async (req, res) => {
  try {
    const settings = await loadSettings();
    
    if (!settings.integrations || settings.integrations.platform === 'none') {
      return res.json({ 
        success: false, 
        message: 'Aucune intégration configurée'
      });
    }
    
    // Initialiser les intégrations
    await initIntegrations(settings);
    
    return res.json({
      success: true,
      message: `Intégration avec ${settings.integrations.platform} testée avec succès`,
      platform: settings.integrations.platform
    });
  } catch (error) {
    logger.error(`Erreur lors du test d'intégration: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors du test d'intégration: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/integrations/status
 * @desc    Renvoie le statut de l'intégration actuelle
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const settings = await loadSettings();
    
    return res.json({
      platform: settings.integrations?.platform || 'none',
      shopify: settings.integrations?.shopify?.enabled || false,
      woocommerce: settings.integrations?.woocommerce?.enabled || false,
      aliexpress: settings.integrations?.aliexpress?.enabled || false
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du statut d'intégration: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la récupération du statut d'intégration: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/integrations/search-aliexpress
 * @desc    Recherche des produits sur AliExpress
 * @access  Public
 */
router.post('/search-aliexpress', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un mot-clé de recherche est requis'
      });
    }
    
    const settings = await loadSettings();
    
    // Vérifier si l'intégration AliExpress est configurée
    if (!settings.integrations?.aliexpress?.enabled) {
      return res.status(400).json({ 
        success: false, 
        message: 'L\'intégration AliExpress n\'est pas configurée'
      });
    }
    
    // Initialiser les intégrations
    await initIntegrations(settings);
    
    // Récupérer l'instance d'AliExpress
    const aliExpressIntegration = require('../integrations/aliexpress');
    const aliExpress = new aliExpressIntegration(settings.integrations.aliexpress);
    
    // Rechercher des produits
    const result = await aliExpress.searchProducts(keyword);
    
    return res.json(result);
  } catch (error) {
    logger.error(`Erreur lors de la recherche sur AliExpress: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la recherche sur AliExpress: ${error.message}`
    });
  }
});

module.exports = router;
