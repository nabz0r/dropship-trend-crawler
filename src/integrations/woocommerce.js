/**
 * Module d'intégration avec WooCommerce
 * Permet d'ajouter et de supprimer des produits dans une boutique WooCommerce
 */
const logger = require('../utils/logger');

class WooCommerceIntegration {
  constructor(config) {
    try {
      // Charger la dépendance WooCommerce de manière conditionnelle
      // pour éviter les erreurs si la dépendance manque
      const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
      
      this.api = new WooCommerceRestApi({
        url: config.siteUrl,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        version: 'wc/v3'
      });
      
      this.isInitialized = true;
      logger.info('Intégration WooCommerce initialisée avec succès');
    } catch (error) {
      this.isInitialized = false;
      logger.error(`Échec d'initialisation de l'intégration WooCommerce: ${error.message}`);
      logger.error('Veuillez installer la dépendance avec: npm install @woocommerce/woocommerce-rest-api');
    }
  }

  async addProduct(product) {
    try {
      // Vérifier si l'intégration a été initialisée
      if (!this.isInitialized) {
        throw new Error('Intégration WooCommerce non initialisée');
      }
      
      const wooProduct = this._formatProductForWooCommerce(product);
      const response = await this.api.post('products', wooProduct);
      
      logger.info(`Produit ajouté à WooCommerce: ${response.data.name}`);
      return {
        success: true,
        catalogId: response.data.id.toString(),
        productData: response.data
      };
    } catch (error) {
      logger.error(`Erreur lors de l'ajout du produit à WooCommerce: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async removeProduct(catalogId) {
    try {
      // Vérifier si l'intégration a été initialisée
      if (!this.isInitialized) {
        throw new Error('Intégration WooCommerce non initialisée');
      }
      
      await this.api.delete(`products/${catalogId}`, { force: true });
      
      logger.info(`Produit supprimé de WooCommerce: ${catalogId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Erreur lors de la suppression du produit de WooCommerce: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  _formatProductForWooCommerce(product) {
    return {
      name: product.title || 'Produit sans titre',
      description: product.description || '',
      regular_price: (product.metadata?.priceEstimation?.estimatedRetailPrice || '29.99').toString(),
      images: product.metadata?.imageUrl ? [{ src: product.metadata.imageUrl }] : [],
      categories: product.metadata?.category ? [{ name: product.metadata.category }] : [],
      stock_quantity: 100,
      manage_stock: true
    };
  }
}

module.exports = WooCommerceIntegration;
