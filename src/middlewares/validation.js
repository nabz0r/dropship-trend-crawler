/**
 * Middleware de validation des entrées
 * Fournit des fonctions de validation pour les différentes routes de l'API
 */
const logger = require('../utils/logger');

/**
 * Valide un ID de produit
 * @param {string} id - L'ID à valider
 * @returns {boolean} - true si l'ID est valide
 */
const isValidId = (id) => {
  // Un ID MongoDB est une chaîne hexadécimale de 24 caractères
  // Accepte également les IDs de test qui commencent par 'mock-'
  return /^[0-9a-fA-F]{24}$/.test(id) || /^mock-[\w-]+$/.test(id);
};

/**
 * Valide une URL
 * @param {string} url - L'URL à valider
 * @returns {boolean} - true si l'URL est valide
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Middleware de validation pour un ID de produit
 */
const validateProductId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !isValidId(id)) {
    logger.warn(`Tentative d'accès avec un ID invalide: ${id}`);
    return res.status(400).json({ 
      error: 'ID de produit invalide',
      details: 'L\'ID doit être une chaîne hexadécimale de 24 caractères'
    });
  }
  
  next();
};

/**
 * Middleware de validation pour une pagination
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  // Valider la page si présente
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ 
        error: 'Paramètre de pagination invalide', 
        details: 'La page doit être un nombre positif'
      });
    }
  }
  
  // Valider la limite si présente
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        error: 'Paramètre de pagination invalide', 
        details: 'La limite doit être un nombre entre 1 et 100'
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation pour les données d'un produit
 */
const validateProductData = (req, res, next) => {
  const { title, url } = req.body;
  const errors = [];
  
  // Vérifier le titre
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Le titre est requis et doit contenir au moins 3 caractères');
  }
  
  // Vérifier l'URL
  if (!url || !isValidUrl(url)) {
    errors.push('Une URL valide est requise');
  }
  
  // Si des erreurs sont présentes, renvoyer une réponse d'erreur
  if (errors.length > 0) {
    logger.warn(`Validation échouée pour les données de produit: ${JSON.stringify(errors)}`);
    return res.status(400).json({ error: 'Validation échouée', details: errors });
  }
  
  next();
};

/**
 * Middleware de validation pour une analyse de produit
 */
const validateAnalysisData = (req, res, next) => {
  const { analysis } = req.body;
  const errors = [];
  
  // Vérifier si l'analyse est présente
  if (!analysis || typeof analysis !== 'object') {
    errors.push('Les données d\'analyse sont requises');
  } else {
    // Vérifier le score
    if (analysis.score === undefined || 
        typeof analysis.score !== 'number' || 
        analysis.score < 0 || 
        analysis.score > 100) {
      errors.push('Le score doit être un nombre entre 0 et 100');
    }
    
    // Vérifier la recommandation
    const validRecommendations = ['index', 'deindex', 'watch', 'skip', 'error'];
    if (!analysis.recommendation || 
        !validRecommendations.includes(analysis.recommendation)) {
      errors.push(`La recommandation doit être l'une des suivantes: ${validRecommendations.join(', ')}`);
    }
  }
  
  // Si des erreurs sont présentes, renvoyer une réponse d'erreur
  if (errors.length > 0) {
    logger.warn(`Validation échouée pour les données d'analyse: ${JSON.stringify(errors)}`);
    return res.status(400).json({ error: 'Validation échouée', details: errors });
  }
  
  next();
};

/**
 * Middleware de validation pour le statut catalogue
 */
const validateCatalogStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['new', 'indexed', 'deindexed', 'pending'];
  
  if (!status || !validStatuses.includes(status)) {
    logger.warn(`Statut catalogue invalide: ${status}`);
    return res.status(400).json({ 
      error: 'Statut catalogue invalide', 
      details: `Le statut doit être l'un des suivants: ${validStatuses.join(', ')}`
    });
  }
  
  next();
};

/**
 * Middleware de validation pour les paramètres d'historique
 */
const validateHistoryParams = (req, res, next) => {
  const { days } = req.query;
  
  if (days !== undefined) {
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({ 
        error: 'Paramètre invalide', 
        details: 'Le nombre de jours doit être compris entre 1 et 365'
      });
    }
  }
  
  next();
};

module.exports = {
  validateProductId,
  validatePagination,
  validateProductData,
  validateAnalysisData,
  validateCatalogStatus,
  validateHistoryParams
};