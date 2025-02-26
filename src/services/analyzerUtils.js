/**
 * Fonctions utilitaires pour l'analyseur de produits
 * Fournit des outils d'analyse et de scoring pour évaluer le potentiel des produits
 */
const { PRODUCT_CATEGORIES, SEASONALITY } = require('../data/productCategories');

/**
 * Détermine la catégorie d'un produit basée sur son titre et sa description
 * @param {Object} product - Le produit à analyser
 * @returns {Object} La catégorie détectée et le score de confiance
 */
function detectProductCategory(product) {
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  const scores = {};
  let highestScore = 0;
  let detectedCategory = null;
  
  // Calculer un score pour chaque catégorie
  for (const [category, data] of Object.entries(PRODUCT_CATEGORIES)) {
    let score = 0;
    
    // Vérifier les mots-clés
    for (const keyword of data.keywords) {
      if (content.includes(keyword)) {
        score += 1;
      }
    }
    
    scores[category] = score;
    
    if (score > highestScore) {
      highestScore = score;
      detectedCategory = category;
    }
  }
  
  // Déterminer le niveau de confiance
  let confidence = 0;
  if (highestScore > 0) {
    // Normaliser la confiance entre 0 et 1
    const totalKeywords = Object.values(PRODUCT_CATEGORIES)
      .reduce((sum, cat) => sum + cat.keywords.length, 0);
    confidence = Math.min(1, highestScore / (totalKeywords * 0.1));
  }
  
  return {
    category: detectedCategory || 'inconnu',
    confidence,
    categoryData: detectedCategory ? PRODUCT_CATEGORIES[detectedCategory] : null,
    scores
  };
}

/**
 * Interprète le score numérique en un message lisible
 */
function interpretScore(score, factor) {
  if (score >= 80) return `Excellent niveau de ${factor} (${score}/100)`;
  if (score >= 60) return `Bon niveau de ${factor} (${score}/100)`;
  if (score >= 40) return `Niveau moyen de ${factor} (${score}/100)`;
  if (score >= 20) return `Niveau faible de ${factor} (${score}/100)`;
  return `Niveau très faible de ${factor} (${score}/100)`;
}

/**
 * Génère des raisons détaillées pour la recommandation
 */
function generateRecommendationReasons(
  product, 
  categoryInfo, 
  popularityScore, 
  profitabilityScore, 
  competitionScore, 
  seasonalityScore,
  recommendation
) {
  const reasons = [];
  
  // Ajouter des informations sur la catégorie
  if (categoryInfo.category !== 'inconnu') {
    reasons.push(`Produit détecté dans la catégorie "${categoryInfo.category}" (confiance: ${Math.round(categoryInfo.confidence * 100)}%)`);
  } else {
    reasons.push("Catégorie du produit non identifiée clairement");
  }
  
  // Interprétation des scores individuels
  reasons.push(`Popularité: ${interpretScore(popularityScore, 'popularité')}`);
  reasons.push(`Rentabilité: ${interpretScore(profitabilityScore, 'rentabilité')}`);
  reasons.push(`Concurrence: ${interpretScore(competitionScore, 'concurrence')}`);
  reasons.push(`Saisonnalité: ${interpretScore(seasonalityScore, 'saisonnalité')}`);
  
  // Raisons spécifiques à la recommandation
  if (recommendation === 'index') {
    reasons.push(`Ce produit montre un excellent potentiel et devrait être intégré à votre catalogue.`);
  } else if (recommendation === 'watch') {
    reasons.push(`Ce produit présente un potentiel intéressant mais nécessite plus d'observation avant de l'intégrer.`);
  } else if (recommendation === 'skip') {
    reasons.push(`Ce produit ne présente pas un potentiel suffisant pour être intégré au catalogue actuellement.`);
  }
  
  return reasons;
}

/**
 * Estime le prix et la marge potentielle d'un produit
 */
function estimatePriceAndMargin(product, categoryInfo) {
  // Valeurs par défaut
  let estimatedWholesalePrice = 15;
  let estimatedRetailPrice = 30;
  let margin = 0.5;
  
  // Ajuster en fonction de la catégorie si disponible
  if (categoryInfo.categoryData) {
    margin = categoryInfo.categoryData.profitMargin;

    // Estimer le prix de gros en fonction de la catégorie et de la complexité du produit
    const content = (product.title + ' ' + (product.description || '')).toLowerCase();
    const isComplex = ['premium', 'luxe', 'haut de gamme', 'professionnel', 'avancé'].some(term => content.includes(term));
    
    if (categoryInfo.category === 'technologie') {
      estimatedWholesalePrice = isComplex ? 35 : 20;
    } else if (categoryInfo.category === 'mode') {
      estimatedWholesalePrice = isComplex ? 25 : 12;
    } else if (categoryInfo.category === 'maison') {
      estimatedWholesalePrice = isComplex ? 30 : 15;
    } else if (categoryInfo.category === 'beauté') {
      estimatedWholesalePrice = isComplex ? 20 : 8;
    }
    
    // Calculer le prix de vente recommandé
    estimatedRetailPrice = Math.round(estimatedWholesalePrice / (1 - margin));
  }
  
  return {
    estimatedWholesalePrice,
    estimatedRetailPrice,
    marginPercentage: Math.round(margin * 100),
    profitPerUnit: estimatedRetailPrice - estimatedWholesalePrice
  };
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

module.exports = {
  detectProductCategory,
  interpretScore,
  generateRecommendationReasons,
  estimatePriceAndMargin,
  getMockProducts
};