/**
 * Système de mise en cache en mémoire pour améliorer les performances
 * Utilise une approche de mémoire en-mémoire simple pour éviter les requêtes répétées
 */
const logger = require('./logger');

// Classe de cache simple
class SimpleCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes par défaut
    this.checkPeriod = options.checkPeriod || 60000; // Vérifie les clés expirées toutes les minutes
    this.maxItems = options.maxItems || 100; // Nombre maximum d'éléments en cache

    // Démarrer le nettoyage périodique
    this.intervalId = setInterval(() => this.deleteExpiredItems(), this.checkPeriod);
  }

  /**
   * Définit une valeur dans le cache
   * @param {string} key - La clé de l'élément
   * @param {any} value - La valeur à stocker
   * @param {number} ttl - Durée de vie en millisecondes (facultatif)
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;

    // Si le cache atteint la limite, supprimer l'élément le plus ancien
    if (this.cache.size >= this.maxItems && !this.cache.has(key)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
    
    logger.info(`Cache: Clé '${key}' ajoutée au cache (Expire: ${new Date(expiresAt).toISOString()})`);
    return true;
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - La clé à récupérer
   * @returns {any|null} La valeur ou null si non trouvée/expirée
   */
  get(key) {
    const item = this.cache.get(key);

    // Vérifier si l'élément existe et n'est pas expiré
    if (item && item.expiresAt > Date.now()) {
      logger.info(`Cache: Hit pour '${key}'`);
      return item.value;
    }

    // Suppression si expiré
    if (item) {
      logger.info(`Cache: Miss pour '${key}' (expiré)`);
      this.cache.delete(key);
    } else {
      logger.info(`Cache: Miss pour '${key}' (non trouvé)`);
    }

    return null;
  }

  /**
   * Supprime une clé du cache
   * @param {string} key - La clé à supprimer
   */
  delete(key) {
    const result = this.cache.delete(key);
    if (result) {
      logger.info(`Cache: Clé '${key}' supprimée du cache`);
    }
    return result;
  }

  /**
   * Supprime toutes les clés expirées
   */
  deleteExpiredItems() {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cache: ${deletedCount} éléments expirés supprimés`);
    }
  }

  /**
   * Vide complètement le cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache: ${size} éléments supprimés (cache vidé)`);
  }

  /**
   * Trouve la clé la plus ancienne dans le cache
   * @private
   */
  findOldestKey() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Libère les ressources lors de la fermeture de l'application
   */
  close() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Créer une seule instance du cache
const cache = new SimpleCache({
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  checkPeriod: 60 * 1000,     // 1 minute
  maxItems: 1000              // 1000 éléments maximum
});

/**
 * Middleware Express pour mettre en cache les réponses
 * @param {number} duration - Durée de vie du cache en millisecondes (optionnel)
 */
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Générer une clé de cache basée sur l'URL et la méthode
    const key = `${req.method}:${req.originalUrl}`;
    
    // Vérifier si la réponse est dans le cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // Intercepter la méthode json pour mettre en cache la réponse
    const originalJson = res.json;
    res.json = function(data) {
      // Stocker dans le cache avant d'envoyer la réponse
      cache.set(key, data, duration);
      // Restaurer le comportement original
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Arrêter proprement le cache lors de la fermeture de l'application
process.on('SIGINT', () => {
  cache.close();
});

module.exports = { cache, cacheMiddleware };