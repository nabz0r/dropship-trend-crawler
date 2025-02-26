# DropShip Trend Crawler

Un système automatisé de crawling web pour l'identification de produits tendance pour le dropshipping.

## Objectif

Ce projet vise à développer une application web qui :

1. Effectue un crawling automatique du web à intervalles réguliers (toutes les heures)
2. Identifie les produits tendance sur diverses plateformes
3. Analyse leur potentiel pour le dropshipping
4. Génère des recommandations d'ajout ou de retrait de produits
5. Automatise l'indexation/désindexation des produits dans votre catalogue

## Architecture

Le système est organisé en plusieurs modules :

- **Crawler** : Utilise l'API Brave Search pour découvrir des produits et analyser les tendances
- **Analyseur** : Évalue la pertinence et la rentabilité des produits identifiés
- **Gestionnaire de catalogue** : Gère l'ajout et le retrait de produits
- **Interface web** : Dashboard pour visualiser les tendances et configurer le système
- **API** : Pour l'intégration avec d'autres systèmes

## Technologies

- **Backend** : Node.js avec Express
- **Frontend** : React avec Material UI
- **Base de données** : MongoDB
- **Crawling** : API Brave Search
- **Déploiement** : Docker et GitHub Actions

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/nabz0r/dropship-trend-crawler.git
cd dropship-trend-crawler

# Installer les dépendances
npm install

# Configuration
cp .env.example .env
# Éditer le fichier .env avec vos clés API

# Lancer en mode développement
npm run dev
```

## Utilisation

Consultez la documentation dans le dossier `docs/` pour des instructions détaillées.