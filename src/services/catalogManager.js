const logger = require('../utils/logger');
const { getProductsByRecommendation, updateCatalogStatus } = require('../models/product');
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
      catalogManager: {
        autoIndex: true,
        autoDeindex: false,
        minPerformanceDays: 14
      }
    };
  }
}

/**
 * Gère l'ajout et le retrait des produits du catalogue de dropshipping
 */
async function setupCatalogManager() {
  try {
    logger.info('Démarrage du gestionnaire de catalogue');
    
    // Charger les paramètres de configuration
    const settings = await loadSettings();
    const { autoIndex = true, autoDeindex = false } = settings.catalogManager || {};
    
    let productsToIndex = [];
    let productsToDeindex = [];
    
    try {
      // Produits à ajouter au catalogue
      if (autoIndex) {
        productsToIndex = await getProductsByRecommendation('index');
      }
      
      // Produits à retirer du catalogue
      if (autoDeindex) {
        productsToDeindex = await getProductsByRecommendation('deindex');
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération des produits: ${error.message}`);
      logger.info('Utilisation de produits fictifs pour le développement.');
      
      if (autoIndex) {
        productsToIndex = getMockProducts(3, 'index');
      }
      
      if (autoDeindex) {
        productsToDeindex = getMockProducts(2, 'deindex');
      }
    }
    
    logger.info(`${productsToIndex.length} produits à ajouter au catalogue`);
    logger.info(`${productsToDeindex.length} produits à retirer du catalogue`);
    
    let indexedCount = 0;
    let deindexedCount = 0;
    
    // Ajouter les nouveaux produits
    for (const product of productsToIndex) {
      try {
        const result = await addProductToCatalog(product);
        
        if (result.success && product._id) {
          await updateCatalogStatus(product._id, 'indexed', result.catalogId);
        }
        
        indexedCount++;
      } catch (error) {
        logger.error(`Erreur lors de l'ajout du produit au catalogue: ${error.message}`);
      }
    }
    
    // Retirer les produits obsolètes
    for (const product of productsToDeindex) {
      try {
        const result = await removeProductFromCatalog(product);
        
        if (result.success && product._id) {
          await updateCatalogStatus(product._id, 'deindexed');
        }
        
        deindexedCount++;
      } catch (error) {
        logger.error(`Erreur lors du retrait du produit du catalogue: ${error.message}`);
      }
    }
    
    logger.info(`Mise à jour du catalogue terminée. ${indexedCount} produits ajoutés, ${deindexedCount} produits retirés.`);
    return { indexed: indexedCount, deindexed: deindexedCount };
  } catch (error) {
    logger.error(`Erreur dans le gestionnaire de catalogue: ${error.message}`);
    throw error;
  }
}

/**
 * Génère des produits fictifs pour le développement
 */
function getMockProducts(count, recommendation) {
  const mockProducts = [];
  const productTypes = ['Montre connectée', 'Lampe LED', 'Écouteurs sans fil', 'Organisateur de bureau', 
                       'Gadget de cuisine', 'Accessoire pour smartphone', 'Porte-clés intelligent', 'Chargeur rapide'];
  
  for (let i = 0; i < count; i++) {
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    mockProducts.push({
      _id: `mock-${recommendation}-${i + 1}`,
      title: `${productType} - Produit ${i + 1}`,
      description: `Découvrez ce ${productType.toLowerCase()} parfait pour le dropshipping. Fort potentiel de vente avec des marges intéressantes.`,
      url: `https://example.com/product-${i + 1}`,
      source: 'mock_data',
      analysis: {
        recommendation: recommendation,
        score: recommendation === 'index' ? 85 : 30
      }
    });
  }
  
  return mockProducts;
}

/**
 * Ajoute un produit au catalogue de dropshipping
 */
async function addProductToCatalog(product) {
  try {
    logger.info(`Ajout du produit "${product.title || 'sans titre'}" au catalogue`);
    
    // Ici, intégrer avec votre système de gestion de catalogue
    // Exemples d'actions :
    // - API de votre plateforme e-commerce
    // - Base de données interne
    // - Génération de fiches produits
    
    // Simuler un délai réseau pour l'intégration avec une API externe
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Pour l'exemple, on simule une réussite
    return {
      success: true,
      catalogId: `CAT-${Math.floor(Math.random() * 10000)}`
    };
  } catch (error) {
    logger.error(`Erreur lors de l'ajout du produit au catalogue: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Retire un produit du catalogue de dropshipping
 */
async function removeProductFromCatalog(product) {
  try {
    logger.info(`Retrait du produit "${product.title || 'sans titre'}" du catalogue`);
    
    // Ici, intégrer avec votre système de gestion de catalogue
    // Similaire à addProductToCatalog mais pour le retrait
    
    // Simuler un délai réseau pour l'intégration avec une API externe
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Pour l'exemple, on simule une réussite
    return { success: true };
  } catch (error) {
    logger.error(`Erreur lors du retrait du produit du catalogue: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = { setupCatalogManager, addProductToCatalog, removeProductFromCatalog };