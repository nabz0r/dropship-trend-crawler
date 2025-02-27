/**
 * Configuration des performances pour l'environnement de production
 * Ce fichier contient les optimisations à appliquer pour les environnements de production
 */

const os = require('os');

// Déterminer le nombre de processus à exécuter en fonction des CPU disponibles
const cpuCount = os.cpus().length;

// Configuration de base des performances
const performanceConfig = {
  // Paramètres pour le clustering de Node.js (PM2 ou cluster natif)
  cluster: {
    // Nombre d'instances à exécuter
    // En production, généralement N-1 du nombre de CPU disponibles
    instances: Math.max(1, cpuCount - 1),
    // Répartition de la charge
    mode: 'round-robin'
  },
  
  // Paramètres de cache
  cache: {
    // Activer le cache en production
    enabled: process.env.CACHE_ENABLED === 'true',
    // Durée de vie des éléments en cache (5 minutes par défaut)
    ttl: parseInt(process.env.CACHE_TTL || 300000),
    // Nombre maximum d'éléments en cache
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || 5000),
    // Routes à mettre en cache prioritairement
    routes: [
      '/api/products',
      '/api/trends',
      '/api/trends/history',
      '/api/trends/categories'
    ]
  },
  
  // Paramètres de compression
  compression: {
    // Activer la compression en production
    enabled: true,
    // Niveau de compression (0-9, où 0 = pas de compression, 9 = compression maximale)
    level: 6,
    // Seuil en octets au-dessus duquel la compression est appliquée
    threshold: 1024
  },
  
  // Paramètres de limitation de débit (rate limiting)
  rateLimit: {
    // Activer la limitation de débit
    enabled: true,
    // Fenêtre de temps en minutes
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    // Nombre maximum de requêtes par fenêtre
    max: parseInt(process.env.RATE_LIMIT_MAX || 100),
    // Message d'erreur personnalisé
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  
  // Paramètres de base de données
  database: {
    // Taille du pool de connexions
    poolSize: 10,
    // Timeout de connexion en millisecondes
    connectTimeoutMS: 30000,
    // Timeout de socket en millisecondes
    socketTimeoutMS: 45000,
    // Activer la journalisation des requêtes lentes
    logSlowQueries: true,
    // Seuil pour considérer une requête comme lente (en ms)
    slowQueryThreshold: 500
  },
  
  // Paramètres du crawler
  crawler: {
    // Nombre maximum de requêtes simultanées vers l'API externe
    maxConcurrentRequests: 5,
    // Délai entre les lots de requêtes (en ms)
    batchDelay: 1000,
    // Taille maximale du lot de produits à analyser à la fois
    batchSize: 100
  },
  
  // Paramètres du analyseur
  analyzer: {
    // Nombre maximum d'analyses à effectuer en parallèle
    maxConcurrentAnalyses: 10,
    // Taille maximale du lot d'analyses à effectuer à la fois
    batchSize: 50
  },
  
  // Paramètres divers
  misc: {
    // Activer le mode strict pour MongoDB
    strictQuery: true,
    // Timeout des requêtes HTTP en millisecondes
    httpTimeout: 15000,
    // Délai d'expiration du circuit breaker en millisecondes
    circuitBreakerTimeout: 30000
  }
};

module.exports = performanceConfig;