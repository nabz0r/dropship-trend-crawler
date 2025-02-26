const express = require('express');
const router = express.Router();

// Routes pour la configuration du système

// GET /api/settings - Récupère les paramètres actuels
router.get('/', (req, res) => {
  res.json({ message: "Implémentation à venir - Paramètres actuels" });
});

// PUT /api/settings - Met à jour les paramètres
router.put('/', (req, res) => {
  res.json({ message: "Implémentation à venir - Mise à jour des paramètres" });
});

// GET /api/settings/crawler - Paramètres du crawler
router.get('/crawler', (req, res) => {
  res.json({ message: "Implémentation à venir - Paramètres du crawler" });
});

// PUT /api/settings/crawler - Met à jour les paramètres du crawler
router.put('/crawler', (req, res) => {
  res.json({ message: "Implémentation à venir - Mise à jour des paramètres du crawler" });
});

module.exports = router;