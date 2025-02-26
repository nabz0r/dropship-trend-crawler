const Product = require('./productSchema');
const logger = require('../utils/logger');

/**
 * Enregistre les données d'un produit découvert
 */
async function saveProductData(productData) {
  try {
    // Vérifier si le produit existe déjà (par URL)
    const existingProduct = await Product.findOne({ url: productData.url });
    
    if (existingProduct) {
      logger.info(`Produit déjà existant: ${productData.title}`);
      return existingProduct;
    }
    
    // Créer un nouveau produit
    const newProduct = new Product(productData);
    await newProduct.save();
    
    logger.info(`Nouveau produit enregistré: ${productData.title}`);
    return newProduct;
  } catch (error) {
    logger.error(`Erreur lors de l'enregistrement du produit: ${error.message}`);
    throw error;
  }
}

/**
 * Récupère les produits qui n'ont pas encore été analysés
 */
async function getUnanalyzedProducts() {
  try {
    return await Product.findUnanalyzed();
  } catch (error) {
    logger.error(`Erreur lors de la récupération des produits non analysés: ${error.message}`);
    return [];
  }
}

/**
 * Met à jour l'analyse d'un produit
 */
async function updateProductAnalysis(productId, analysis) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error(`Produit avec ID ${productId} non trouvé`);
    }
    
    await product.updateAnalysis(analysis);
    logger.info(`Analyse mise à jour pour le produit: ${product.title}`);
    
    return product;
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'analyse: ${error.message}`);
    throw error;
  }
}

/**
 * Récupère les produits par recommandation
 */
async function getProductsByRecommendation(recommendation) {
  try {
    return await Product.findByRecommendation(recommendation);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des produits par recommandation: ${error.message}`);
    return [];
  }
}

/**
 * Met à jour le statut catalogue d'un produit
 */
async function updateCatalogStatus(productId, status, catalogId = null) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error(`Produit avec ID ${productId} non trouvé`);
    }
    
    await product.setCatalogStatus(status, catalogId);
    logger.info(`Statut catalogue mis à jour pour le produit: ${product.title}`);
    
    return product;
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du statut catalogue: ${error.message}`);
    throw error;
  }
}

module.exports = {
  saveProductData,
  getUnanalyzedProducts,
  updateProductAnalysis,
  getProductsByRecommendation,
  updateCatalogStatus
};