const mongoose = require('mongoose');

/**
 * Schéma MongoDB pour les produits découverts
 */
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['brave_search', 'manual', 'api', 'mock_data']
  },
  query: {
    type: String
  },
  analyzed: {
    type: Boolean,
    default: false
  },
  analysis: {
    score: Number,
    recommendation: {
      type: String,
      enum: ['index', 'deindex', 'watch', 'skip', 'error']
    },
    reasons: [String],
    analyzedAt: Date
  },
  catalogStatus: {
    type: String,
    enum: ['new', 'indexed', 'deindexed', 'pending'],
    default: 'new'
  },
  catalogId: String,
  metadata: {
    price: Number,
    category: String,
    brand: String,
    imageUrl: String,
    supplier: String,
    estimatedMargin: Number
  },
  discoveredAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthodes statiques
productSchema.statics.findUnanalyzed = function() {
  return this.find({ analyzed: false });
};

productSchema.statics.findByRecommendation = function(recommendation) {
  return this.find({ 'analysis.recommendation': recommendation });
};

// Méthodes d'instance
productSchema.methods.updateAnalysis = function(analysis) {
  this.analysis = analysis;
  this.analyzed = true;
  return this.save();
};

productSchema.methods.setCatalogStatus = function(status, catalogId = null) {
  this.catalogStatus = status;
  if (catalogId) {
    this.catalogId = catalogId;
  }
  return this.save();
};

// Création du modèle
const Product = mongoose.model('Product', productSchema);

module.exports = Product;