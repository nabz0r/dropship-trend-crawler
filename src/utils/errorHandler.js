/**
 * Système centralisé de gestion des erreurs
 * Fournit une classe d'erreur personnalisée et un middleware pour gérer les erreurs de manière uniforme
 */
const logger = require('./logger');

/**
 * Classe d'erreur personnalisée pour les erreurs opérationnelles de l'application
 */
class AppError extends Error {
  /**
   * Crée une nouvelle erreur d'application
   * @param {string} message - Message d'erreur
   * @param {number} statusCode - Code HTTP de l'erreur
   * @param {boolean} isOperational - Indique si l'erreur est opérationnelle (prévisible) ou une erreur de programmation
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    // Capturer la trace de la pile pour le débogage
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs spécifiques pour différentes situations
 */
class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, true);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation échouée', details = []) {
    super(message, 400, true);
    this.details = details;
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Erreur de base de données', originalError = null) {
    super(message, 500, true);
    this.originalError = originalError;
  }
}

class ApiError extends AppError {
  constructor(message = 'Erreur d\'API externe', statusCode = 500) {
    super(message, statusCode, true);
  }
}

/**
 * Génère un message d'erreur standardisé pour les réponses client
 * @param {Error} err - L'erreur à formater
 * @param {boolean} includeDetails - Inclure les détails de débogage
 * @returns {Object} - Objet d'erreur formatté
 */
const formatError = (err, includeDetails = false) => {
  // Format de base pour toutes les erreurs
  const formattedError = {
    status: err.status || 'error',
    message: err.message || 'Une erreur inattendue est survenue'
  };

  // Ajouter les détails si présents et demandés
  if (err.details && (includeDetails || err.isOperational)) {
    formattedError.details = err.details;
  }

  // Ajouter des informations de débogage en mode développement
  if (includeDetails && process.env.NODE_ENV === 'development') {
    formattedError.stack = err.stack;
    if (err.originalError) {
      formattedError.originalError = {
        message: err.originalError.message,
        stack: err.originalError.stack
      };
    }
  }

  return formattedError;
};

/**
 * Middleware de gestion des erreurs pour Express
 */
const errorHandler = (err, req, res, next) => {
  // Assigner un code de statut par défaut si nécessaire
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Journalisation de l'erreur
  const errorLogMessage = `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`;
  
  if (err.statusCode >= 500) {
    logger.error(errorLogMessage);
    if (err.stack) {
      logger.error(err.stack);
    }
  } else {
    logger.warn(errorLogMessage);
  }
  
  // Erreurs MongoDB spécifiques
  if (err.name === 'CastError') {
    const message = `Valeur invalide pour le champ ${err.path}: ${err.value}`;
    err = new ValidationError(message);
  }
  
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(val => val.message);
    err = new ValidationError('Validation des données échouée', details);
  }
  
  if (err.code === 11000) { // Erreur de duplication
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplication détectée pour le champ ${field}. Valeur: ${err.keyValue[field]}`;
    err = new ValidationError(message);
  }
  
  // Env de développement: envoyer tous les détails
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json(formatError(err, true));
  }
  // Env de production: séparer les erreurs opérationnelles des erreurs de programmation
  else {
    // Erreur opérationnelle - envoyer le message à l'utilisateur
    if (err.isOperational) {
      res.status(err.statusCode).json(formatError(err, false));
    }
    // Erreur de programmation - ne pas divulguer les détails à l'utilisateur
    else {
      logger.error('ERREUR NON OPERATIONNELLE', err);
      res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue. Veuillez réessayer plus tard.'
      });
    }
  }
};

/**
 * Fonction pour envelopper les contrôleurs async et éviter d'avoir à utiliser try/catch partout
 * @param {Function} fn - Fonction async à exécuter
 * @returns {Function} - Fonction avec gestion d'erreurs intégrée
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  ApiError,
  errorHandler,
  catchAsync,
  formatError
};