const express = require('express');
const router = express.Router();

// Routes pour la gestion des produits

// GET /api/products - Liste tous les produits
router.get('/', (req, res) => {
  res.json({ message: "Implémentation à venir - Liste des produits" });
});

// GET /api/products/:id - Détails d'un produit
router.get('/:id', (req, res) => {
  res.json({ message: `Implémentation à venir - Détails du produit ${req.params.id}` });
});

// POST /api/products - Ajoute manuellement un produit
router.post('/', (req, res) => {
  res.json({ message: "Implémentation à venir - Création d'un produit" });
});

// PUT /api/products/:id - Met à jour un produit
router.put('/:id', (req, res) => {
  res.json({ message: `Implémentation à venir - Mise à jour du produit ${req.params.id}` });
});

// DELETE /api/products/:id - Supprime un produit
router.delete('/:id', (req, res) => {
  res.json({ message: `Implémentation à venir - Suppression du produit ${req.params.id}` });
});

module.exports = router;