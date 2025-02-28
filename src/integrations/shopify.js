/**
 * Module d'intégration avec Shopify
 * Permet d'ajouter et de supprimer des produits dans une boutique Shopify
 */
const axios = require('axios');
const logger = require('../utils/logger');

class ShopifyIntegration {
  constructor(config) {
    // Vérifier que les paramètres nécessaires sont présents
    if (!config.apiKey || !config.password || !config.storeName) {
      this.isInitialized = false;
      logger.error('Configuration Shopify incomplète: apiKey, password et storeName sont requis');
      return;
    }
    
    this.apiKey = config.apiKey;
    this.password = config.password;
    this.storeName = config.storeName;
    this.apiVersion = '2023-10'; // Version de l'API Shopify
    this.baseUrl = `https://${this.apiKey}:${this.password}@${this.storeName}.myshopify.com/admin/api/${this.apiVersion}`;
    this.isInitialized = true;
    
    logger.info('Intégration Shopify initialisée avec succès');
  }

  async addProduct(product) {
    try {
      // Vérifier si l'intégration a été initialisée
      if (!this.isInitialized) {
        throw new Error('Intégration Shopify non initialisée');
      }
      
      const shopifyProduct = this._formatProductForShopify(product);
      
      const response = await axios.post(
        `${this.baseUrl}/products.json`,
        { product: shopifyProduct }
      );
      
      logger.info(`Produit ajouté à Shopify: ${response.data.product.title}`);
      return {
        success: true,
        catalogId: response.data.product.id.toString(),
        productData: response.data.product
      };
    } catch (error) {
      logger.error(`Erreur lors de l'ajout du produit à Shopify: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async removeProduct(catalogId) {
    try {
      // Vérifier si l'intégration a été initialisée
      if (!this.isInitialized) {
        throw new Error('Intégration Shopify non initialisée');
      }
      
      await axios.delete(`${this.baseUrl}/products/${catalogId}.json`);
      
      logger.info(`Produit supprimé de Shopify: ${catalogId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Erreur lors de la suppression du produit de Shopify: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  _formatProductForShopify(product) {
    // Transformer notre modèle de produit en format Shopify
    return {
      title: product.title || 'Produit sans titre',
      body_html: product.description || '',
      vendor: product.metadata?.brand || 'DropShip Trend',
      product_type: product.metadata?.category || 'General',
      images: product.metadata?.imageUrl ? [{ src: product.metadata.imageUrl }] : [],
      variants: [
        {
          price: product.metadata?.priceEstimation?.estimatedRetailPrice || '29.99',
          inventory_quantity: 100,
          inventory_management: 'shopify'
        }
      ]
    };
  }
}

module.exports = ShopifyIntegration;
