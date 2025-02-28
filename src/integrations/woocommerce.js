/**
 * Module d'intégration avec WooCommerce
 * Permet d'ajouter et de supprimer des produits dans une boutique WooCommerce
 */
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const logger = require('../utils/logger');

class WooCommerceIntegration {
  constructor(config) {
    this.api = new WooCommerceRestApi({
      url: config.siteUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: 'wc/v3'
    });
  }

  async addProduct(product) {
    try {
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
      name: product.title,
      description: product.description,
      regular_price: (product.metadata?.priceEstimation?.estimatedRetailPrice || '29.99').toString(),
      images: product.metadata?.imageUrl ? [{ src: product.metadata.imageUrl }] : [],
      categories: product.metadata?.category ? [{ name: product.metadata.category }] : [],
      stock_quantity: 100,
      manage_stock: true
    };
  }
}

module.exports = WooCommerceIntegration;
