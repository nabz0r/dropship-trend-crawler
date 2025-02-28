const axios = require('axios');
const logger = require('../utils/logger');
const { saveProductData } = require('../models/product');
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
      crawler: {
        searchQueries: [
          'produits tendance dropshipping',
          'best selling products online',
          'trending products ecommerce',
          'viral products social media'
        ],
        maxResults: 20,
        minRelevanceScore: 30
      }
    };
  }
}

/**
 * Utilise l'API Brave Search pour découvrir des produits tendance
 */
async function setupCrawlerJob() {
  try {
    logger.info('Démarrage du crawler');
    
    // Charger les paramètres de configuration
    const settings = await loadSettings();
    const { searchQueries, maxResults = 20 } = settings.crawler || {};
    
    // Liste des requêtes à exécuter
    const queriesToExecute = searchQueries || [
      'produits tendance dropshipping',
      'best selling products online',
      'trending products ecommerce',
      'viral products social media'
    ];
    
    let totalDiscovered = 0;
    let totalSaved = 0;
    
    for (const query of queriesToExecute) {
      logger.info(`Exécution de la requête: ${query}`);
      
      // Utiliser l'API Brave Search
      const results = await searchProducts(query, maxResults);
      
      // Traiter les résultats
      if (results && results.length > 0) {
        logger.info(`${results.length} résultats trouvés pour "${query}"`);
        totalDiscovered += results.length;
        
        // Filtrer les résultats pertinents
        const relevantResults = await filterRelevantProducts(results);
        logger.info(`${relevantResults.length} résultats pertinents pour "${query}"`);
        
        // Enregistrer les données dans la base de données
        for (const product of relevantResults) {
          try {
            await saveProductData(product);
            totalSaved++;
          } catch (error) {
            logger.error(`Erreur lors de l'enregistrement du produit: ${error.message}`);
          }
        }
      }
    }
    
    logger.info(`Crawling terminé avec succès. ${totalDiscovered} produits découverts, ${totalSaved} produits enregistrés.`);
    return { totalDiscovered, totalSaved };
  } catch (error) {
    logger.error(`Erreur dans le crawler: ${error.message}`);
    throw error;
  }
}

/**
 * Effectue une recherche de produits via l'API Brave
 */
async function searchProducts(query, count = 20) {
  try {
    // Vérifier si l'API key est configurée
    if (!process.env.BRAVE_API_KEY) {
      logger.warn('Clé API Brave Search non configurée. Utilisation des données de démo.');
      return getMockSearchResults(query, count);
    }
    
    // Appel à l'API Brave Search
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: count
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY
      }
    });
    
    // Extraire et formater les résultats pertinents
    if (response.data && response.data.web && response.data.web.results) {
      return response.data.web.results.map(result => ({
        title: result.title,
        description: result.description,
        url: result.url,
        source: 'brave_search',
        query: query,
        discoveredAt: new Date()
      }));
    }
    
    return [];
  } catch (error) {
    logger.error(`Erreur lors de la recherche: ${error.message}`);
    logger.info('Utilisation des données de démo en raison de l\'erreur.');
    return getMockSearchResults(query, count);
  }
}

/**
 * Génère des résultats de recherche fictifs pour le développement
 */
function getMockSearchResults(query, count) {
  const mockResults = [];
  const productTypes = ['Montre connectée', 'Lampe LED', 'Écouteurs sans fil', 'Organisateur de bureau', 
                       'Gadget de cuisine', 'Accessoire pour smartphone', 'Porte-clés intelligent', 'Chargeur rapide'];
  
  for (let i = 0; i < count; i++) {
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    mockResults.push({
      title: `${productType} - Produit Tendance ${i + 1}`,
      description: `Découvrez ce ${productType.toLowerCase()} parfait pour le dropshipping. Fort potentiel de vente avec des marges intéressantes. Produit populaire en 2025.`,
      url: `https://example.com/product-${i + 1}`,
      source: 'brave_search',
      query: query,
      discoveredAt: new Date()
    });
  }
  
  return mockResults;
}

/**
 * Filtre les résultats pertinents au dropshipping
 */
async function filterRelevantProducts(results) {
  try {
    // Charger les paramètres de configuration
    const settings = await loadSettings();
    const { minRelevanceScore = 30 } = settings.crawler || {};
    
    // Expressions régulières pour identifier les URLs de produits
    const productUrlPatterns = [
      /\/product\//i,
      /\/products\//i,
      /\/item\//i,
      /\/p\/[a-z0-9]/i,
      /\/dp\/[a-z0-9]/i,
      /\/buy\//i,
      /\/shop\/[a-z0-9]/i,
      /\/goods\//i,
      /[0-9]{5,}\.html/i,  // Format AliExpress
    ];
    
    // Domaines connus d'e-commerce
    const ecommerceDomains = [
      'amazon.com', 'aliexpress.com', 'ebay.com', 'etsy.com', 'shopify.com', 
      'woocommerce.com', 'walmart.com', 'target.com', 'bestbuy.com', 'banggood.com'
    ];
    
    // Mots-clés caractéristiques des pages produits
    const productPageKeywords = [
      'price', 'buy', 'add to cart', 'shipping', 'delivery', 'stock',
      'order', 'purchase', 'shopping cart', 'checkout', 'payment',
      'prix', 'acheter', 'panier', 'livraison', 'expédition'
    ];
    
    // Algorithme amélioré de scoring des résultats
    return results.filter(result => {
      const content = (result.title + ' ' + result.description).toLowerCase();
      const url = result.url.toLowerCase();
      let score = 0;
      
      // 1. Vérifier si l'URL correspond à un modèle de page produit
      const isProductUrl = productUrlPatterns.some(pattern => pattern.test(url));
      if (isProductUrl) {
        score += 25;
      }
      
      // 2. Vérifier si l'URL provient d'un domaine e-commerce connu
      const isEcommerceDomain = ecommerceDomains.some(domain => url.includes(domain));
      if (isEcommerceDomain) {
        score += 20;
      }
      
      // 3. Vérifier les mots-clés caractéristiques des pages produits
      for (const keyword of productPageKeywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 5;
          break;  // Limiter le bonus à 5 points même avec plusieurs correspondances
        }
      }
      
      // 4. Analyser pour la présence de prix (formats variés)
      const pricePatterns = [
        /\$\d+(\.\d{2})?/,  // $xx.xx
        /\d+(\.\d{2})?\s?\$/,  // xx.xx$
        /\d+(\.\d{2})?\s?USD/i,  // xx.xx USD
        /\d+(\.\d{2})?\s?€/,  // xx.xx€
        /€\s?\d+(\.\d{2})?/,  // €xx.xx
        /\d+(\.\d{2})?\s?EUR/i,  // xx.xx EUR
        /\£\d+(\.\d{2})?/,  // £xx.xx
        /\d+(\.\d{2})?\s?GBP/i,  // xx.xx GBP
      ];
      
      const hasPriceFormat = pricePatterns.some(pattern => pattern.test(content));
      if (hasPriceFormat) {
        score += 20;
      }
      
      // 5. Mots-clés de relevance originaux (mots liés au dropshipping)
      const relevantKeywords = [
        'produit', 'product', 'vente', 'sale', 'tendance', 'trending',
        'populaire', 'popular', 'dropshipping', 'ecommerce', 'e-commerce',
        'mode', 'fashion', 'gadget', 'accessoire', 'accessory', 'montre', 'watch'
      ];
      
      for (const keyword of relevantKeywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }
      
      // Bonus spécifiques
      if (content.includes('dropshipping')) score += 20;
      if (content.includes('tendance') || content.includes('trending')) score += 15;
      if (content.includes('populaire') || content.includes('popular')) score += 15;
      
      // Stocker le score pour référence
      result.relevanceScore = score;
      
      // Bonus de debug: ajouter la raison du score élevé pour faciliter l'analyse
      if (score >= minRelevanceScore) {
        result.matchReason = [];
        if (isProductUrl) result.matchReason.push('URL pattern');
        if (isEcommerceDomain) result.matchReason.push('E-commerce domain');
        if (hasPriceFormat) result.matchReason.push('Price format');
      }
      
      return score >= minRelevanceScore;
    });
  } catch (error) {
    logger.error(`Erreur lors du filtrage des produits: ${error.message}`);
    return results;
  }
}

module.exports = { setupCrawlerJob, searchProducts, filterRelevantProducts };
