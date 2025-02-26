/**
 * Service d'analyse des produits découverts
 * Détermine le potentiel des produits pour le dropshipping en utilisant un algorithme de scoring multi-facteurs
 */
const logger = require('../utils/logger');
const { getUnanalyzedProducts, updateProductAnalysis } = require('../models/product');
const { AppError, catchAsync } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

// Import des utilitaires d'analyse
const {
  detectProductCategory,
  generateRecommendationReasons,
  estimatePriceAndMargin,
  getMockProducts
} = require('./analyzerUtils');

// Import des fonctions de scoring
const {
  calculatePopularityScore,
  calculateProfitabilityScore,
  calculateCompetitionScore,
  calculateSeasonalityScore
} = require('./analyzerScoring');

// Chemin vers le fichier de configuration local
const CONFIG_FILE = path.join(process.cwd(), 'config', 'crawler-settings.json');

// Fonction utilitaire pour charger les paramètres
async function loadSettings() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si le fichier n'existe pas ou est corrompu, utiliser les paramètres par défaut
    logger.warn(`Impossible de charger les paramètres: ${error.message}. Utilisation des paramètres par défaut.`);
    return {
      analyzer: {
        minScoreToIndex: 70,
        minScoreToWatch: 40,
        factors: {
          popularity: 0.4,
          profitability: 0.3,
          competition: 0.2,
          seasonality: 0.1
        }
      }
    };
  }
}

/**
 * Analyse les produits découverts pour déterminer leur potentiel
 * Utilise le catchAsync pour une gestion centralisée des erreurs
 */
const setupAnalyzerJob = catchAsync(async () => {
  logger.info('Démarrage de l\'analyseur de produits');
  
  // Récupérer les produits non encore analysés
  let products = [];
  try {
    products = await getUnanalyzedProducts();
  } catch (error) {
    logger.error(`Erreur lors de la récupération des produits: ${error.message}`);
    logger.info('Utilisation de produits fictifs pour le développement.');
    products = getMockProducts(5);
  }
  
  logger.info(`${products.length} produits à analyser`);
  
  // Analyser les produits en parallèle pour de meilleures performances
  const analysisPromises = products.map(async product => {
    try {
      // Analyser chaque produit
      const analysis = await analyzeProduct(product);
      
      // Mettre à jour la base de données avec les résultats
      if (product._id) {
        await updateProductAnalysis(product._id, analysis);
      }
      
      return { success: true, productId: product._id };
    } catch (error) {
      logger.error(`Erreur lors de l'analyse du produit ${product._id || 'sans ID'}: ${error.message}`);
      return { success: false, productId: product._id, error: error.message };
    }
  });
  
  // Attendre que toutes les analyses soient terminées
  const results = await Promise.allSettled(analysisPromises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
  
  logger.info(`Analyse des produits terminée. ${successful} produits analysés avec succès, ${failed} échecs.`);
  return { total: products.length, analyzed: successful, failed };
});

/**
 * Analyse un produit spécifique pour déterminer son potentiel
 */
async function analyzeProduct(product) {
  try {
    // Charger les paramètres de configuration
    const settings = await loadSettings();
    const { minScoreToIndex = 70, minScoreToWatch = 40, factors } = settings.analyzer || {};
    
    // Facteurs de pondération par défaut
    const weights = factors || {
      popularity: 0.4,
      profitability: 0.3,
      competition: 0.2,
      seasonality: 0.1
    };
    
    // Détecter la catégorie du produit
    const categoryInfo = detectProductCategory(product);
    
    // Analyse des facteurs du produit
    const popularityScore = await calculatePopularityScore(product);
    const profitabilityScore = calculateProfitabilityScore(product, categoryInfo);
    const competitionScore = calculateCompetitionScore(product, categoryInfo);
    const seasonalityScore = calculateSeasonalityScore(product);
    
    // Calcul du score pondéré
    const weightedScore = 
      (popularityScore * weights.popularity) +
      (profitabilityScore * weights.profitability) +
      (competitionScore * weights.competition) +
      (seasonalityScore * weights.seasonality);
    
    // Normalisation du score entre 0 et 100
    const finalScore = Math.round(weightedScore);
    
    // Détermination de la recommandation
    let recommendation;
    if (finalScore >= minScoreToIndex) {
      recommendation = 'index';
    } else if (finalScore >= minScoreToWatch) {
      recommendation = 'watch';
    } else {
      recommendation = 'skip';
    }
    
    // Générer des raisons détaillées de la recommandation
    const reasons = generateRecommendationReasons(
      product,
      categoryInfo, 
      popularityScore, 
      profitabilityScore, 
      competitionScore, 
      seasonalityScore,
      recommendation
    );
    
    // Estimer des données de prix et de marge potentielle
    const priceEstimation = estimatePriceAndMargin(product, categoryInfo);
    
    return {
      score: finalScore,
      recommendation,
      category: categoryInfo.category,
      categoryConfidence: Math.round(categoryInfo.confidence * 100),
      factors: {
        popularity: popularityScore,
        profitability: profitabilityScore,
        competition: competitionScore,
        seasonality: seasonalityScore
      },
      reasons,
      priceEstimation,
      analyzedAt: new Date()
    };
  } catch (error) {
    logger.error(`Erreur lors de l'analyse du produit: ${error.message}`);
    return {
      score: 0,
      recommendation: 'error',
      reasons: [`Erreur d'analyse: ${error.message}`],
      analyzedAt: new Date()
    };
  }
}

module.exports = { setupAnalyzerJob, analyzeProduct };