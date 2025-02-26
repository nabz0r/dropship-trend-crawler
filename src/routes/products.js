const express = require('express');
const router = express.Router();
const Product = require('../models/productSchema');
const { saveProductData, updateProductAnalysis, updateCatalogStatus } = require('../models/product');
const logger = require('../utils/logger');

// GET /api/products - Liste tous les produits
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, recommendation } = req.query;
    
    // Construction de la requête
    const query = {};
    if (status) query.catalogStatus = status;
    if (recommendation) query['analysis.recommendation'] = recommendation;
    
    // Exécution de la requête avec pagination
    const products = await Product.find(query)
      .sort({ discoveredAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    // Comptage du total pour la pagination
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des produits: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// GET /api/products/:id - Détails d'un produit
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
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
router.put('/:id/analysis', async (req, res) => {
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
router.put('/:id/catalog-status', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    await Product.findByIdAndDelete(id);
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de la suppression du produit: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

module.exports = router;