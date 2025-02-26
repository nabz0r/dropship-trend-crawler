/**
 * Couche d'abstraction pour l'accès aux données produits
 * Implémente le pattern Repository pour isoler la logique métier de l'accès aux données
 */
const Product = require('../models/productSchema');
const logger = require('../utils/logger');

class ProductRepository {
  /**
   * Enregistre un nouveau produit ou met à jour un produit existant
   */
  async saveProduct(productData) {
    try {
      // Vérifier si le produit existe déjà (par URL)
      const existingProduct = await this.findByUrl(productData.url);
      
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
      logger.error(`Erreur dans le repository - saveProduct: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouve un produit par son URL
   */
  async findByUrl(url) {
    return Product.findOne({ url });
  }

  /**
   * Récupère les produits qui n'ont pas encore été analysés
   */
  async findUnanalyzed() {
    try {
      return await Product.find({ analyzed: false });
    } catch (error) {
      logger.error(`Erreur dans le repository - findUnanalyzed: ${error.message}`);
      return [];
    }
  }

  /**
   * Trouve un produit par son ID
   */
  async findById(id) {
    try {
      return await Product.findById(id);
    } catch (error) {
      logger.error(`Erreur dans le repository - findById: ${error.message}`);
      return null;
    }
  }

  /**
   * Met à jour l'analyse d'un produit
   */
  async updateAnalysis(productId, analysis) {
    try {
      const product = await this.findById(productId);
      
      if (!product) {
        throw new Error(`Produit avec ID ${productId} non trouvé`);
      }
      
      await product.updateAnalysis(analysis);
      logger.info(`Analyse mise à jour pour le produit: ${product.title}`);
      
      return product;
    } catch (error) {
      logger.error(`Erreur dans le repository - updateAnalysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les produits par recommandation
   */
  async findByRecommendation(recommendation) {
    try {
      return await Product.find({ 'analysis.recommendation': recommendation });
    } catch (error) {
      logger.error(`Erreur dans le repository - findByRecommendation: ${error.message}`);
      return [];
    }
  }

  /**
   * Met à jour le statut catalogue d'un produit
   */
  async updateCatalogStatus(productId, status, catalogId = null) {
    try {
      const product = await this.findById(productId);
      
      if (!product) {
        throw new Error(`Produit avec ID ${productId} non trouvé`);
      }
      
      await product.setCatalogStatus(status, catalogId);
      logger.info(`Statut catalogue mis à jour pour le produit: ${product.title}`);
      
      return product;
    } catch (error) {
      logger.error(`Erreur dans le repository - updateCatalogStatus: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les produits avec pagination et filtres
   */
  async findWithPagination(filters = {}, page = 1, limit = 10) {
    try {
      const query = {};
      
      if (filters.status) query.catalogStatus = filters.status;
      if (filters.recommendation) query['analysis.recommendation'] = filters.recommendation;
      
      const products = await Product.find(query)
        .sort({ discoveredAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      const total = await Product.countDocuments(query);
      
      return {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Erreur dans le repository - findWithPagination: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprime un produit par son ID
   */
  async deleteById(id) {
    try {
      const result = await Product.findByIdAndDelete(id);
      if (!result) {
        throw new Error(`Produit avec ID ${id} non trouvé`);
      }
      return true;
    } catch (error) {
      logger.error(`Erreur dans le repository - deleteById: ${error.message}`);
      throw error;
    }
  }
}

// Exporter une instance unique du repository (pattern Singleton)
module.exports = new ProductRepository();