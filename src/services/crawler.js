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
    
    // On pourrait implémenter ici une logique plus sophistiquée
    // par exemple avec du NLP ou des règles spécifiques
    
    // Pour l'instant, on filtre simplement sur des mots-clés basiques
    const relevantKeywords = [
      'produit', 'product', 'vente', 'sale', 'tendance', 'trending',
      'populaire', 'popular', 'dropshipping', 'ecommerce', 'e-commerce',
      'mode', 'fashion', 'gadget', 'accessoire', 'accessory', 'montre', 'watch'
    ];
    
    // Algorithme simplifié de scoring des résultats
    return results.filter(result => {
      const content = (result.title + ' ' + result.description).toLowerCase();
      let score = 0;
      
      relevantKeywords.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      
      // On attribue un score supplémentaire si le titre ou la description contient des mots-clés spécifiques
      if (content.includes('dropshipping')) score += 20;
      if (content.includes('tendance') || content.includes('trending')) score += 15;
      if (content.includes('populaire') || content.includes('popular')) score += 15;
      
      // Ajouter le score au résultat pour référence
      result.relevanceScore = score;
      
      return score >= minRelevanceScore;
    });
  } catch (error) {
    logger.error(`Erreur lors du filtrage des produits: ${error.message}`);
    return results;
  }
}

module.exports = { setupCrawlerJob, searchProducts, filterRelevantProducts };