const logger = require('../utils/logger');
const { getUnanalyzedProducts, updateProductAnalysis } = require('../models/product');
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
 */
async function setupAnalyzerJob() {
  try {
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
    let analyzedCount = 0;
    
    for (const product of products) {
      try {
        // Analyser chaque produit
        const analysis = await analyzeProduct(product);
        
        // Mettre à jour la base de données avec les résultats
        if (product._id) {
          await updateProductAnalysis(product._id, analysis);
        }
        
        analyzedCount++;
      } catch (error) {
        logger.error(`Erreur lors de l'analyse du produit ${product._id || 'sans ID'}: ${error.message}`);
      }
    }
    
    logger.info(`Analyse des produits terminée. ${analyzedCount}/${products.length} produits analysés avec succès.`);
    return { total: products.length, analyzed: analyzedCount };
  } catch (error) {
    logger.error(`Erreur dans l'analyseur: ${error.message}`);
    throw error;
  }
}

/**
 * Génère des produits fictifs pour le développement
 */
function getMockProducts(count) {
  const mockProducts = [];
  const productTypes = ['Montre connectée', 'Lampe LED', 'Écouteurs sans fil', 'Organisateur de bureau', 
                       'Gadget de cuisine', 'Accessoire pour smartphone', 'Porte-clés intelligent', 'Chargeur rapide'];
  
  for (let i = 0; i < count; i++) {
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    mockProducts.push({
      _id: `mock-${i + 1}`,
      title: `${productType} - Produit ${i + 1}`,
      description: `Découvrez ce ${productType.toLowerCase()} parfait pour le dropshipping. Fort potentiel de vente avec des marges intéressantes.`,
      url: `https://example.com/product-${i + 1}`,
      source: 'mock_data',
      query: 'produits tendance dropshipping',
      discoveredAt: new Date()
    });
  }
  
  return mockProducts;
}

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
    
    // Analyse de popularité (simulation)
    const popularityScore = calculatePopularityScore(product);
    
    // Analyse de rentabilité (simulation)
    const profitabilityScore = calculateProfitabilityScore(product);
    
    // Analyse de concurrence (simulation)
    const competitionScore = calculateCompetitionScore(product);
    
    // Analyse de saisonnalité (simulation)
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
    
    return {
      score: finalScore,
      recommendation,
      reasons: [
        `Score de popularité: ${popularityScore}/100`,
        `Score de rentabilité: ${profitabilityScore}/100`,
        `Score de concurrence: ${competitionScore}/100`,
        `Score de saisonnalité: ${seasonalityScore}/100`
      ],
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

/**
 * Calcul du score de popularité (simulation)
 */
function calculatePopularityScore(product) {
  // En production, on pourrait utiliser des APIs de réseaux sociaux, Google Trends, etc.
  // Pour l'instant, on simule avec des valeurs aléatoires et quelques heuristiques
  
  let score = 50; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Mots-clés indiquant la popularité
  const popularityKeywords = ['populaire', 'tendance', 'viral', 'trending', 'popular', 'best-seller', 'hot'];
  
  popularityKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 5;
    }
  });
  
  // Ajuster avec un facteur aléatoire pour la simulation
  const randomFactor = Math.floor(Math.random() * 30) - 10; // -10 à +20
  score += randomFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcul du score de rentabilité (simulation)
 */
function calculateProfitabilityScore(product) {
  // En production, on pourrait utiliser des APIs de prix, des données de fournisseurs, etc.
  // Pour l'instant, on simule avec des valeurs aléatoires et quelques heuristiques
  
  let score = 60; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Mots-clés indiquant une bonne rentabilité
  const profitabilityKeywords = ['profit', 'marge', 'rentable', 'profitable', 'low cost', 'high margin'];
  
  profitabilityKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 5;
    }
  });
  
  // Catégories généralement rentables
  const profitableCategories = ['montre', 'bijou', 'accessoire', 'gadget', 'watch', 'jewelry'];
  
  profitableCategories.forEach(category => {
    if (content.includes(category)) {
      score += 3;
    }
  });
  
  // Ajuster avec un facteur aléatoire pour la simulation
  const randomFactor = Math.floor(Math.random() * 25) - 5; // -5 à +20
  score += randomFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcul du score de concurrence (simulation)
 * Un score élevé signifie une faible concurrence (c'est positif)
 */
function calculateCompetitionScore(product) {
  // En production, on pourrait analyser le nombre de vendeurs, les prix moyens, etc.
  // Pour l'instant, on simule avec des valeurs aléatoires et quelques heuristiques
  
  let score = 40; // Score de base (la concurrence est généralement forte)
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Mots-clés indiquant une niche moins concurrentielle
  const lowCompetitionKeywords = ['unique', 'niche', 'spécialisé', 'nouveau', 'innovant', 'breveté'];
  
  lowCompetitionKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 8;
    }
  });
  
  // Mots-clés indiquant une forte concurrence
  const highCompetitionKeywords = ['populaire', 'classique', 'basique', 'standard'];
  
  highCompetitionKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score -= 5;
    }
  });
  
  // Ajuster avec un facteur aléatoire pour la simulation
  const randomFactor = Math.floor(Math.random() * 30) - 10; // -10 à +20
  score += randomFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcul du score de saisonnalité (simulation)
 * Un score élevé signifie que le produit est actuellement en saison
 */
function calculateSeasonalityScore(product) {
  // En production, on pourrait analyser les tendances saisonnières réelles
  // Pour l'instant, on simule avec des valeurs aléatoires et le mois actuel
  
  let score = 50; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Mois actuel
  const currentMonth = new Date().getMonth(); // 0-11
  
  // Produits saisonniers par mois (simplifié)
  const seasonalProducts = {
    0: ['hiver', 'ski', 'neige', 'écharpe'], // Janvier
    1: ['hiver', 'saint-valentin', 'amour'], // Février
    2: ['printemps', 'jardin', 'pâques'], // Mars
    3: ['printemps', 'jardin', 'pâques', 'plein air'], // Avril
    4: ['printemps', 'jardin', 'fête des mères'], // Mai
    5: ['été', 'plage', 'vacances', 'fête des pères'], // Juin
    6: ['été', 'plage', 'vacances', 'piscine'], // Juillet
    7: ['été', 'plage', 'vacances', 'voyage'], // Août
    8: ['rentrée', 'école', 'automne'], // Septembre
    9: ['automne', 'halloween'], // Octobre
    10: ['hiver', 'noël', 'black friday'], // Novembre
    11: ['hiver', 'noël', 'fêtes', 'cadeau'] // Décembre
  };
  
  // Vérifier si le produit correspond à la saison actuelle
  const currentSeasonKeywords = seasonalProducts[currentMonth] || [];
  const nextMonthKeywords = seasonalProducts[(currentMonth + 1) % 12] || [];
  
  currentSeasonKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 10;
    }
  });
  
  nextMonthKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 5; // Bon de se préparer pour la prochaine saison
    }
  });
  
  // Produits toujours à la mode
  const everGreenKeywords = ['intemporel', 'classique', 'essentiel', 'basic', 'evergreen'];
  
  everGreenKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 3;
    }
  });
  
  // Ajuster avec un facteur aléatoire pour la simulation
  const randomFactor = Math.floor(Math.random() * 20) - 5; // -5 à +15
  score += randomFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

module.exports = { setupAnalyzerJob, analyzeProduct };