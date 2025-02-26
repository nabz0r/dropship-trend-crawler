/**
 * Base de données des catégories de produits pour l'analyse
 * Fournit des informations sur les différentes catégories de produits et leurs caractéristiques
 */

// Base de données de produits pour l'analyse de marché
const PRODUCT_CATEGORIES = {
  technologie: {
    profitMargin: 0.30,
    competitionLevel: 0.8,
    trendCycle: 'medium',
    keywords: ['smartphone', 'ordinateur', 'tablette', 'gadget', 'tech', 'électronique', 'connecte', 'bluetooth']
  },
  mode: {
    profitMargin: 0.45,
    competitionLevel: 0.7,
    trendCycle: 'short',
    keywords: ['vêtement', 'mode', 'fashion', 'bijou', 'accessoire', 'montre', 'lunette', 'chapeau']
  },
  maison: {
    profitMargin: 0.35,
    competitionLevel: 0.6,
    trendCycle: 'long',
    keywords: ['meuble', 'cuisine', 'déco', 'décoration', 'intérieur', 'rangement', 'outil', 'jardin']
  },
  sport: {
    profitMargin: 0.25,
    competitionLevel: 0.5,
    trendCycle: 'medium',
    keywords: ['sport', 'fitness', 'exercice', 'musculation', 'yoga', 'vélo', 'randonnée', 'training']
  },
  beauté: {
    profitMargin: 0.50,
    competitionLevel: 0.9,
    trendCycle: 'short',
    keywords: ['beauté', 'cosmétique', 'soin', 'maquillage', 'crème', 'parfum', 'visage', 'cheveu']
  },
  enfants: {
    profitMargin: 0.40,
    competitionLevel: 0.6,
    trendCycle: 'medium',
    keywords: ['enfant', 'bébé', 'jouet', 'jeu', 'parent', 'puériculture', 'éducatif']
  },
  animaux: {
    profitMargin: 0.30,
    competitionLevel: 0.5,
    trendCycle: 'long',
    keywords: ['animal', 'chien', 'chat', 'animalerie', 'pet', 'accessoire animal']
  }
};

// Types de saisonnalité des produits
const SEASONALITY = {
  // Fêtes et événements
  events: {
    'nouvel an': { months: [0, 11], boost: 15 },
    'saint-valentin': { months: [1], boost: 20 },
    'pâques': { months: [2, 3], boost: 15 },
    'fête des mères': { months: [4], boost: 25 },
    'fête des pères': { months: [5], boost: 20 },
    'rentrée': { months: [7, 8], boost: 25 },
    'halloween': { months: [9], boost: 20 },
    'black friday': { months: [10], boost: 30 },
    'noël': { months: [10, 11], boost: 30 },
    'cadeau': { months: [10, 11, 0], boost: 15 }
  },
  // Saisons
  seasons: {
    'hiver': { months: [11, 0, 1], boost: 15 },
    'printemps': { months: [2, 3, 4], boost: 15 },
    'été': { months: [5, 6, 7], boost: 15 },
    'automne': { months: [8, 9, 10], boost: 15 },
    // Activités saisonnières
    'plage': { months: [5, 6, 7], boost: 25 },
    'ski': { months: [11, 0, 1], boost: 25 },
    'jardin': { months: [3, 4, 5, 6], boost: 20 },
    'vacances': { months: [6, 7], boost: 20 },
    'voyage': { months: [5, 6, 7, 8], boost: 15 }
  }
};

module.exports = { PRODUCT_CATEGORIES, SEASONALITY };