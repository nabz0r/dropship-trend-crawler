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
- **Frontend** : HTML, CSS, JavaScript
- **Base de données** : MongoDB
- **Crawling** : API Brave Search
- **Déploiement** : Docker et GitHub Actions (prévu pour les versions futures)

## Prérequis

- Node.js 14+ et npm installés
- MongoDB installé et en cours d'exécution (optionnel - le système peut fonctionner en mode démo sans base de données)
- Clé API Brave Search (optionnelle - le système utilise des données de test si aucune clé n'est configurée)

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/nabz0r/dropship-trend-crawler.git
cd dropship-trend-crawler

# Installer les dépendances
npm install

# Configuration
cp .env.example .env
# Éditer le fichier .env avec vos clés API et autres paramètres
```

## Exécution

### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

### Mode production

```bash
npm start
```

L'application sera disponible à l'adresse `http://localhost:3000` (ou le port spécifié dans votre fichier .env).

## Fonctionnalités clés

### Mode démo

Le système peut fonctionner sans MongoDB et sans clé API Brave Search en utilisant des données fictives. C'est idéal pour tester rapidement les fonctionnalités sans configuration complète.

### Endpoints API

L'API REST expose les endpoints suivants :

- `GET /api/products` - Liste des produits découverts
- `GET /api/products/:id` - Détails d'un produit spécifique
- `POST /api/products` - Ajouter un produit manuellement
- `PUT /api/products/:id` - Mettre à jour un produit
- `DELETE /api/products/:id` - Supprimer un produit

- `GET /api/trends` - Tendances actuelles des produits
- `GET /api/trends/history` - Historique des tendances
- `GET /api/trends/categories` - Tendances par catégorie
- `GET /api/trends/search-terms` - Termes de recherche les plus efficaces

- `GET /api/settings` - Paramètres actuels du système
- `PUT /api/settings` - Mettre à jour les paramètres
- `GET /api/settings/reset` - Réinitialiser les paramètres par défaut

- `POST /api/crawl` - Déclencher manuellement un crawling

### Paramètres de configuration

Les paramètres du système sont stockés dans un fichier JSON dans le dossier `config/crawler-settings.json`. Vous pouvez les modifier via l'API ou directement dans le fichier.

## Intégration à votre système de dropshipping

Pour intégrer ce système à votre plateforme de dropshipping, vous pouvez :

1. Modifier les méthodes `addProductToCatalog` et `removeProductFromCatalog` dans `src/services/catalogManager.js` pour les connecter à votre API e-commerce.

2. Développer des middlewares spécifiques pour traduire les données entre notre format et celui de votre plateforme.

3. Utiliser l'API REST pour développer votre propre interface utilisateur.

## Développement futur

Voir la liste des tâches dans le fichier [TASKS.md](TASKS.md) pour les fonctionnalités prévues pour les prochaines versions.

## Documentation

Consultez le dossier `docs/` pour des informations détaillées sur :

- L'utilisation de l'[API Brave Search](docs/brave_api.md)
- L'architecture du système
- Les bonnes pratiques pour le dropshipping

## Licence

MIT

## Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur ce dépôt GitHub.