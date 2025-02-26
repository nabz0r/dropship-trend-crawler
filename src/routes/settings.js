const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Chemin vers le fichier de configuration local
const CONFIG_FILE = path.join(process.cwd(), 'config', 'crawler-settings.json');

// Paramètres par défaut
const DEFAULT_SETTINGS = {
  crawler: {
    interval: 3600000, // 1 heure en millisecondes
    searchQueries: [
      'produits tendance dropshipping',
      'best selling products online',
      'trending products ecommerce',
      'viral products social media'
    ],
    maxResults: 20,
    minRelevanceScore: 30
  },
  analyzer: {
    minScoreToIndex: 70,
    minScoreToWatch: 40,
    factors: {
      popularity: 0.4,
      profitability: 0.3,
      competition: 0.2,
      seasonality: 0.1
    }
  },
  catalogManager: {
    autoIndex: true,
    autoDeindex: false,
    minPerformanceDays: 14
  }
};

// Fonction utilitaire pour charger les paramètres
async function loadSettings() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si le fichier n'existe pas ou est corrompu, utiliser les paramètres par défaut
    logger.warn(`Impossible de charger les paramètres: ${error.message}. Utilisation des paramètres par défaut.`);
    return DEFAULT_SETTINGS;
  }
}

// Fonction utilitaire pour sauvegarder les paramètres
async function saveSettings(settings) {
  try {
    // Créer le dossier config s'il n'existe pas
    await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
    
    // Écrire les paramètres au format JSON
    await fs.writeFile(CONFIG_FILE, JSON.stringify(settings, null, 2), 'utf8');
    logger.info('Paramètres sauvegardés avec succès');
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde des paramètres: ${error.message}`);
    return false;
  }
}

// GET /api/settings - Récupère les paramètres actuels
router.get('/', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des paramètres: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

// PUT /api/settings - Met à jour les paramètres
router.put('/', async (req, res) => {
  try {
    const currentSettings = await loadSettings();
    
    // Fusionner les paramètres actuels avec les nouveaux paramètres
    const newSettings = {
      ...currentSettings,
      ...req.body
    };
    
    // Sauvegarder les paramètres mis à jour
    const success = await saveSettings(newSettings);
    
    if (success) {
      res.json(newSettings);
    } else {
      res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres' });
    }
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des paramètres: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// GET /api/settings/crawler - Paramètres du crawler
router.get('/crawler', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings.crawler || DEFAULT_SETTINGS.crawler);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des paramètres du crawler: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres du crawler' });
  }
});

// PUT /api/settings/crawler - Met à jour les paramètres du crawler
router.put('/crawler', async (req, res) => {
  try {
    const settings = await loadSettings();
    
    // Mettre à jour uniquement les paramètres du crawler
    settings.crawler = {
      ...settings.crawler,
      ...req.body
    };
    
    // Sauvegarder les paramètres mis à jour
    const success = await saveSettings(settings);
    
    if (success) {
      res.json(settings.crawler);
    } else {
      res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres du crawler' });
    }
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des paramètres du crawler: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres du crawler' });
  }
});

// GET /api/settings/analyzer - Paramètres de l'analyseur
router.get('/analyzer', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings.analyzer || DEFAULT_SETTINGS.analyzer);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des paramètres de l'analyseur: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres de l\'analyseur' });
  }
});

// PUT /api/settings/analyzer - Met à jour les paramètres de l'analyseur
router.put('/analyzer', async (req, res) => {
  try {
    const settings = await loadSettings();
    
    // Mettre à jour uniquement les paramètres de l'analyseur
    settings.analyzer = {
      ...settings.analyzer,
      ...req.body
    };
    
    // Sauvegarder les paramètres mis à jour
    const success = await saveSettings(settings);
    
    if (success) {
      res.json(settings.analyzer);
    } else {
      res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres de l\'analyseur' });
    }
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des paramètres de l'analyseur: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres de l\'analyseur' });
  }
});

// GET /api/settings/reset - Réinitialiser les paramètres par défaut
router.get('/reset', async (req, res) => {
  try {
    // Sauvegarder les paramètres par défaut
    const success = await saveSettings(DEFAULT_SETTINGS);
    
    if (success) {
      res.json(DEFAULT_SETTINGS);
    } else {
      res.status(500).json({ error: 'Erreur lors de la réinitialisation des paramètres' });
    }
  } catch (error) {
    logger.error(`Erreur lors de la réinitialisation des paramètres: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation des paramètres' });
  }
});

module.exports = router;