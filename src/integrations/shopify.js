/**
 * Module d'intégration avec Shopify
 * Permet d'ajouter et de supprimer des produits dans une boutique Shopify
 */
const axios = require('axios');
const logger = require('../utils/logger');

class ShopifyIntegration {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.password = config.password;
    this.storeName = config.storeName;
    this.apiVersion = '2023-10'; // Version de l'API Shopify
    this.baseUrl = `https://${this.apiKey}:${this.password}@${this.storeName}.myshopify.com/admin/api/${this.apiVersion}`;
  }

  async addProduct(product) {
    try {
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
      title: product.title,
      body_html: product.description,
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
