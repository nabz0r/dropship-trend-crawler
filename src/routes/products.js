const express = require('express');
const router = express.Router();
const productRepository = require('../data/productRepository');
const { saveProductData, updateProductAnalysis, updateCatalogStatus } = require('../models/product');
const logger = require('../utils/logger');
const { cacheMiddleware } = require('../utils/cache');
const {
  validateProductId,
  validatePagination,
  validateProductData,
  validateAnalysisData,
  validateCatalogStatus
} = require('../middlewares/validation');

// Configuration des durées de cache
const CACHE_DURATION = {
  PRODUCTS_LIST: 2 * 60 * 1000,  // 2 minutes pour la liste des produits
  PRODUCT_DETAIL: 5 * 60 * 1000  // 5 minutes pour les détails d'un produit
};

// GET /api/products - Liste tous les produits
router.get('/', validatePagination, cacheMiddleware(CACHE_DURATION.PRODUCTS_LIST), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, recommendation } = req.query;
    
    // Utilisation du repository pour la pagination et les filtres
    const result = await productRepository.findWithPagination(
      { status, recommendation },
      page,
      limit
    );
    
    res.json(result);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des produits: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// GET /api/products/:id - Détails d'un produit
router.get('/:id', validateProductId, cacheMiddleware(CACHE_DURATION.PRODUCT_DETAIL), async (req, res) => {
  try {
    const product = await productRepository.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json(product);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du produit: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// POST /api/products - Ajoute manuellement un produit
router.post('/', validateProductData, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      source: 'manual',
      discoveredAt: new Date()
    };
    
    const newProduct = await saveProductData(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    logger.error(`Erreur lors de la création du produit: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// PUT /api/products/:id - Met à jour un produit
router.put('/:id', validateProductId, validateProductData, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    // Mise à jour des champs
    Object.keys(req.body).forEach(key => {
      // Ne pas écraser certains champs critiques
      if (!['_id', 'discoveredAt', 'source'].includes(key)) {
        product[key] = req.body[key];
      }
    });
    
    await product.save();
    res.json(product);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du produit: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
  }
});

// PUT /api/products/:id/analysis - Met à jour l'analyse d'un produit
router.put('/:id/analysis', validateProductId, validateAnalysisData, async (req, res) => {
  try {
    const { id } = req.params;
    const { analysis } = req.body;
    
    const updatedProduct = await updateProductAnalysis(id, analysis);
    res.json(updatedProduct);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'analyse: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'analyse' });
  }
});

// PUT /api/products/:id/catalog-status - Met à jour le statut catalogue
router.put('/:id/catalog-status', validateProductId, validateCatalogStatus, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catalogId } = req.body;
    
    const updatedProduct = await updateCatalogStatus(id, status, catalogId);
    res.json(updatedProduct);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du statut catalogue: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut catalogue' });
  }
});

// DELETE /api/products/:id - Supprime un produit
router.delete('/:id', validateProductId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await productRepository.deleteById(id);
    if (deleted) {
      res.json({ message: 'Produit supprimé avec succès' });
    } else {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
  } catch (error) {
    logger.error(`Erreur lors de la suppression du produit: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

module.exports = router;