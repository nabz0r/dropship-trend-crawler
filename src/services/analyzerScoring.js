/**
 * Module de calcul de score pour l'analyseur de produits
 * Implémente les algorithmes de scoring pour évaluer différents aspects des produits
 */
const { PRODUCT_CATEGORIES, SEASONALITY } = require('../data/productCategories');

/**
 * Calcul du score de popularité avec analyse externe si possible
 */
async function calculatePopularityScore(product) {
  let score = 50; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Mots-clés indiquant la popularité
  const popularityKeywords = ['populaire', 'tendance', 'viral', 'trending', 'popular', 'best-seller', 'hot'];
  
  // Calcul du score de base sur les mots-clés
  let keywordScore = 0;
  popularityKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keywordScore += 5;
    }
  });
  
  // Analyse de la source de découverte
  if (product.source === 'brave_search') {
    // Bonus pour les produits découverts par des recherches ciblées
    score += 10;
    
    // Bonus pour les requêtes spécifiques
    if (product.query && product.query.includes('trending')) {
      score += 5;
    }
  }
  
  // Analyse de la récence
  if (product.discoveredAt) {
    const now = new Date();
    const discoveredDate = new Date(product.discoveredAt);
    const daysSinceDiscovery = Math.floor((now - discoveredDate) / (1000 * 60 * 60 * 24));
    
    // Produits découverts récemment obtiennent un bonus
    if (daysSinceDiscovery < 7) {
      score += Math.max(0, 10 - daysSinceDiscovery); // 10 points pour jour 0, 9 pour jour 1, etc.
    }
  }
  
  // Ajouter le score des mots-clés
  score += keywordScore;
  
  // Facteur de variation contrôlé (pas complètement aléatoire)
  // Générer un identifiant déterministe pour le produit
  const productId = product._id || product.url || (product.title + (product.description || ''));
  
  // Utiliser une fonction de hachage simple pour générer un nombre pseudo-aléatoire basé sur l'ID du produit
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Normaliser entre -10 et +10 pour avoir un ajustement contrôlé
  const variationFactor = (hash % 21) - 10;
  score += variationFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcul du score de rentabilité basé sur la catégorie et les caractéristiques du produit
 */
function calculateProfitabilityScore(product, categoryInfo) {
  let score = 50; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Si une catégorie a été détectée avec une confiance suffisante
  if (categoryInfo.category !== 'inconnu' && categoryInfo.confidence > 0.3) {
    // Utiliser la marge bénéficiaire typique de la catégorie comme base
    const profitMargin = categoryInfo.categoryData.profitMargin;
    
    // Convertir la marge en score (0.2 = 20, 0.5 = 50, etc.)
    score = Math.round(profitMargin * 100);
    
    // Ajuster en fonction du cycle de tendance
    if (categoryInfo.categoryData.trendCycle === 'short') {
      score -= 5; // Pénalité pour les produits à cycle court (risque d'obsolescence)
    } else if (categoryInfo.categoryData.trendCycle === 'long') {
      score += 5; // Bonus pour les produits à cycle long (plus durables)
    }
  }
  
  // Mots-clés indiquant une bonne rentabilité
  const profitabilityKeywords = ['profit', 'marge', 'rentable', 'profitable', 'low cost', 'high margin'];
  
  profitabilityKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 5;
    }
  });
  
  // Pénalités pour les mots-clés négatifs
  const negativeProfitKeywords = ['cher', 'coûteux', 'luxe', 'haut de gamme', 'exclusif'];
  
  negativeProfitKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score -= 5;
    }
  });
  
  // Bonus pour les produits légers (meilleurs pour le dropshipping)
  const lightweightKeywords = ['léger', 'petit', 'compact', 'miniature', 'pliable'];
  
  lightweightKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 3;
    }
  });
  
  // Facteur de variation contrôlé (pas complètement aléatoire)
  const productId = product._id || product.url || (product.title + (product.description || ''));
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Variation plus petite pour la rentabilité (-5 à +5)
  const variationFactor = (hash % 11) - 5;
  score += variationFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcul du score de concurrence basé sur la catégorie et les caractéristiques du produit
 * Un score élevé signifie une faible concurrence (c'est positif)
 */
function calculateCompetitionScore(product, categoryInfo) {
  let score = 50; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Si une catégorie a été détectée avec une confiance suffisante
  if (categoryInfo.category !== 'inconnu' && categoryInfo.confidence > 0.3) {
    // Un niveau de concurrence élevé signifie un score plus bas
    // Inverser le niveau de concurrence pour obtenir le score
    score = Math.round((1 - categoryInfo.categoryData.competitionLevel) * 100);
  }
  
  // Mots-clés indiquant une niche moins concurrentielle
  const lowCompetitionKeywords = [
    'unique', 'niche', 'spécialisé', 'nouveau', 'innovant', 'breveté',
    'artisanal', 'handmade', 'personnalisé', 'sur mesure'
  ];
  
  lowCompetitionKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 5;
    }
  });
  
  // Mots-clés indiquant une forte concurrence
  const highCompetitionKeywords = [
    'populaire', 'classique', 'basique', 'standard', 'commun',
    'universel', 'tendance', 'best-seller'
  ];
  
  highCompetitionKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score -= 3;
    }
  });
  
  // Recherche de termes qui indiquent une grande quantité d'offres
  const highSupplyKeywords = ['lot de', 'pack', 'ensemble', 'set', 'collection', 'grossiste'];
  
  highSupplyKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score -= 4;
    }
  });
  
  // Variation contrôlée
  const productId = product._id || product.url || (product.title + (product.description || ''));
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Variation pour la concurrence (-8 à +8)
  const variationFactor = (hash % 17) - 8;
  score += variationFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcul du score de saisonnalité basé sur les caractéristiques du produit et la période actuelle
 */
function calculateSeasonalityScore(product) {
  let score = 50; // Score de base
  
  // Analyse du titre et de la description
  const content = (product.title + ' ' + (product.description || '')).toLowerCase();
  
  // Mois actuel (0-11)
  const currentMonth = new Date().getMonth();
  
  // Vérifier les événements saisonniers
  let seasonalBonus = 0;
  let matchCount = 0;
  
  // Vérifier les événements
  for (const [event, data] of Object.entries(SEASONALITY.events)) {
    if (content.includes(event)) {
      // Vérifier si l'événement est dans la saison actuelle ou prochaine
      if (data.months.includes(currentMonth)) {
        // Événement actuel - bonus maximal
        seasonalBonus += data.boost;
      } else if (data.months.includes((currentMonth + 1) % 12)) {
        // Événement dans le mois prochain - bonus réduit
        seasonalBonus += Math.floor(data.boost * 0.7);
      } else if (data.months.includes((currentMonth + 2) % 12)) {
        // Événement dans deux mois - petit bonus
        seasonalBonus += Math.floor(data.boost * 0.3);
      }
      matchCount++;
    }
  }
  
  // Vérifier les saisons
  for (const [season, data] of Object.entries(SEASONALITY.seasons)) {
    if (content.includes(season)) {
      // Vérifier si la saison correspond à la période actuelle
      if (data.months.includes(currentMonth)) {
        // Saison actuelle - bonus maximal
        seasonalBonus += data.boost;
      } else {
        // Saison prochaine - bonus réduit
        const monthsUntil = getMonthsUntilSeason(currentMonth, data.months);
        if (monthsUntil <= 3) {
          // Saison approchante
          seasonalBonus += Math.floor(data.boost * (1 - (monthsUntil / 4)));
        }
      }
      matchCount++;
    }
  }
  
  // Ajouter le bonus saisonnier au score
  if (matchCount > 0) {
    // Moyenner le bonus si plusieurs correspondances
    seasonalBonus = Math.round(seasonalBonus / matchCount);
    score += seasonalBonus;
  }
  
  // Produits toujours à la mode (intemporels)
  const everGreenKeywords = ['intemporel', 'classique', 'essentiel', 'basic', 'evergreen', 'quotidien'];
  
  everGreenKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 3;
    }
  });
  
  // Variabilité contrôlée
  const productId = product._id || product.url || (product.title + (product.description || ''));
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Variation pour la saisonnalité (-7 à +7)
  const variationFactor = (hash % 15) - 7;
  score += variationFactor;
  
  // S'assurer que le score est dans la plage 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcule le nombre de mois jusqu'à une saison spécifique
 */
function getMonthsUntilSeason(currentMonth, seasonMonths) {
  // Trouver le mois de saison le plus proche
  let minDistance = 12;
  
  for (const seasonMonth of seasonMonths) {
    // Calculer la distance en tenant compte du caractère cyclique des mois
    let distance = (seasonMonth - currentMonth + 12) % 12;
    
    // Mettre à jour la distance minimale
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  return minDistance;
}

module.exports = {
  calculatePopularityScore,
  calculateProfitabilityScore,
  calculateCompetitionScore,
  calculateSeasonalityScore
};