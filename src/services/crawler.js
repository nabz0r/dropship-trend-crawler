const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Utilise l'API Brave Search pour découvrir des produits tendance
 */
async function setupCrawlerJob() {
  try {
    logger.info('Démarrage du crawler');
    
    // Liste des requêtes à exécuter
    const searchQueries = [
      'produits tendance dropshipping',
      'best selling products online',
      'trending products ecommerce',
      'viral products social media',
      // Ajoutez d'autres requêtes pertinentes ici
    ];
    
    for (const query of searchQueries) {
      logger.info(`Exécution de la requête: ${query}`);
      
      // Utiliser l'API Brave Search
      const results = await searchProducts(query);
      
      // Traiter les résultats
      if (results && results.length > 0) {
        logger.info(`${results.length} résultats trouvés pour "${query}"`);
        
        // Enregistrer les données dans la base de données
        // Cette partie sera implémentée ultérieurement avec MongoDB
        console.log(`Stockage de ${results.length} résultats dans la base de données`);
      }
    }
    
    logger.info('Crawling terminé avec succès');
  } catch (error) {
    logger.error(`Erreur dans le crawler: ${error.message}`);
    throw error;
  }
}

/**
 * Effectue une recherche de produits via l'API Brave
 */
async function searchProducts(query) {
  try {
    // Appel à l'API Brave Search
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: 20
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
    return [];
  }
}

// Fonction utilitaire pour filtrer les résultats pertinents au dropshipping
async function filterRelevantProducts(results) {
  // On pourrait implémenter ici une logique plus sophistiquée
  // par exemple avec du NLP ou des règles spécifiques
  
  // Pour l'instant, on filtre simplement sur des mots-clés basiques
  const relevantKeywords = [
    'produit', 'product', 'vente', 'sale', 'tendance', 'trending',
    'populaire', 'popular', 'dropshipping', 'ecommerce', 'e-commerce'
  ];
  
  return results.filter(result => {
    const content = (result.title + ' ' + result.description).toLowerCase();
    return relevantKeywords.some(keyword => content.includes(keyword.toLowerCase()));
  });
}

module.exports = { setupCrawlerJob, searchProducts, filterRelevantProducts };