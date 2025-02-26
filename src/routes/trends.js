const express = require('express');
const router = express.Router();

// Routes pour l'analyse des tendances

// GET /api/trends - Récupère les tendances actuelles
router.get('/', (req, res) => {
  res.json({ message: "Implémentation à venir - Tendances actuelles" });
});

// GET /api/trends/history - Historique des tendances
router.get('/history', (req, res) => {
  res.json({ message: "Implémentation à venir - Historique des tendances" });
});

// GET /api/trends/categories - Tendances par catégorie
router.get('/categories', (req, res) => {
  res.json({ message: "Implémentation à venir - Tendances par catégorie" });
});

module.exports = router;