/**
 * Module d'accès aux produits
 * Sert de façade vers le productRepository, conserve la même interface pour assurer la compatibilité
 */
const productRepository = require('../data/productRepository');

/**
 * Enregistre les données d'un produit découvert
 */
async function saveProductData(productData) {
  return productRepository.saveProduct(productData);
}

/**
 * Récupère les produits qui n'ont pas encore été analysés
 */
async function getUnanalyzedProducts() {
  return productRepository.findUnanalyzed();
}

/**
 * Met à jour l'analyse d'un produit
 */
async function updateProductAnalysis(productId, analysis) {
  return productRepository.updateAnalysis(productId, analysis);
}

/**
 * Récupère les produits par recommandation
 */
async function getProductsByRecommendation(recommendation) {
  return productRepository.findByRecommendation(recommendation);
}

/**
 * Met à jour le statut catalogue d'un produit
 */
async function updateCatalogStatus(productId, status, catalogId = null) {
  return productRepository.updateCatalogStatus(productId, status, catalogId);
}

module.exports = {
  saveProductData,
  getUnanalyzedProducts,
  updateProductAnalysis,
  getProductsByRecommendation,
  updateCatalogStatus
};