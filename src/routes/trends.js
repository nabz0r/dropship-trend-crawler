const express = require('express');
const router = express.Router();
const Product = require('../models/productSchema');
const logger = require('../utils/logger');
const { cacheMiddleware } = require('../utils/cache');

// Configuration des durées de cache en millisecondes
const CACHE_DURATION = {
  TRENDS: 5 * 60 * 1000,        // 5 minutes pour les tendances générales
  HISTORY: 30 * 60 * 1000,      // 30 minutes pour l'historique
  CATEGORIES: 15 * 60 * 1000,   // 15 minutes pour les catégories
  SEARCH_TERMS: 10 * 60 * 1000  // 10 minutes pour les termes de recherche
};

// GET /api/trends - Récupère les tendances actuelles
router.get('/', cacheMiddleware(CACHE_DURATION.TRENDS), async (req, res) => {
  try {
    // Agrégation pour obtenir les tendances basées sur les scores d'analyse
    const trends = await Product.aggregate([
      // Sélectionner uniquement les produits analysés
      { $match: { analyzed: true } },
      // Trier par score d'analyse
      { $sort: { 'analysis.score': -1 } },
      // Limiter aux 20 premiers résultats
      { $limit: 20 },
      // Projeter uniquement les champs nécessaires
      { $project: {
        title: 1,
        url: 1,
        score: '$analysis.score',
        recommendation: '$analysis.recommendation',
        discoveredAt: 1,
        catalogStatus: 1
      }}
    ]);
    
    res.json(trends);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des tendances: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des tendances' });
  }
});

// GET /api/trends/history - Historique des tendances
router.get('/history', cacheMiddleware(CACHE_DURATION.HISTORY), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    // Agrégation pour obtenir l'historique des tendances par jour
    const history = await Product.aggregate([
      // Sélectionner les produits découverts dans la période spécifiée
      { $match: { 
        discoveredAt: { $gte: daysAgo },
        analyzed: true 
      }},
      // Grouper par jour
      { $group: {
        _id: { 
          $dateToString: { format: "%Y-%m-%d", date: "$discoveredAt" } 
        },
        averageScore: { $avg: "$analysis.score" },
        count: { $sum: 1 },
        recommended: { 
          $sum: { 
            $cond: [{ $eq: ["$analysis.recommendation", "index"] }, 1, 0] 
          }
        }
      }},
      // Trier par date
      { $sort: { _id: 1 } },
      // Renommer les champs
      { $project: {
        date: "$_id",
        averageScore: 1,
        count: 1,
        recommended: 1,
        _id: 0
      }}
    ]);
    
    res.json(history);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// GET /api/trends/categories - Tendances par catégorie
router.get('/categories', cacheMiddleware(CACHE_DURATION.CATEGORIES), async (req, res) => {
  try {
    // Agrégation pour obtenir les tendances par catégorie
    const categories = await Product.aggregate([
      // Sélectionner uniquement les produits avec catégorie et analysés
      { $match: { 
        'metadata.category': { $exists: true, $ne: null },
        analyzed: true 
      }},
      // Grouper par catégorie
      { $group: {
        _id: "$metadata.category",
        averageScore: { $avg: "$analysis.score" },
        count: { $sum: 1 },
        recommended: { 
          $sum: { 
            $cond: [{ $eq: ["$analysis.recommendation", "index"] }, 1, 0] 
          }
        }
      }},
      // Trier par score moyen
      { $sort: { averageScore: -1 } },
      // Renommer les champs
      { $project: {
        category: "$_id",
        averageScore: 1,
        count: 1,
        recommended: 1,
        _id: 0
      }}
    ]);
    
    res.json(categories);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des catégories: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// GET /api/trends/search-terms - Termes de recherche les plus efficaces
router.get('/search-terms', cacheMiddleware(CACHE_DURATION.SEARCH_TERMS), async (req, res) => {
  try {
    // Agrégation pour obtenir les termes de recherche les plus efficaces
    const searchTerms = await Product.aggregate([
      // Sélectionner uniquement les produits avec query et analysés
      { $match: { 
        query: { $exists: true, $ne: null },
        analyzed: true 
      }},
      // Grouper par terme de recherche
      { $group: {
        _id: "$query",
        averageScore: { $avg: "$analysis.score" },
        count: { $sum: 1 },
        recommended: { 
          $sum: { 
            $cond: [{ $eq: ["$analysis.recommendation", "index"] }, 1, 0] 
          }
        }
      }},
      // Trier par score moyen
      { $sort: { averageScore: -1 } },
      // Limiter aux 10 premiers résultats
      { $limit: 10 },
      // Renommer les champs
      { $project: {
        term: "$_id",
        averageScore: 1,
        count: 1,
        recommended: 1,
        _id: 0
      }}
    ]);
    
    res.json(searchTerms);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des termes de recherche: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des termes de recherche' });
  }
});

module.exports = router;