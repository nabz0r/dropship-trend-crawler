# Utilisation de l'API Brave Search

## Introduction

Ce projet utilise l'API Brave Search pour effectuer des recherches sur le web et découvrir des produits tendance pour le dropshipping. L'API Brave Search offre des capacités de recherche avancées et permet d'accéder à des résultats de qualité tout en respectant la vie privée des utilisateurs.

## Configuration

### Obtenir une clé API

1. Visitez [Brave Search API](https://brave.com/search/api/)
2. Inscrivez-vous ou connectez-vous à votre compte
3. Générez une clé API dans votre tableau de bord
4. Copiez la clé API générée

### Configuration du projet

1. Copiez le fichier `.env.example` vers `.env`
2. Ajoutez votre clé API Brave Search dans le fichier `.env` :

```
BRAVE_API_KEY=votre_cle_api_ici
```

## Utilisation dans le code

L'API Brave Search est principalement utilisée dans le module `crawler.js` pour découvrir des produits tendance. Voici comment l'implémentation fonctionne :

```javascript
async function searchProducts(query) {
  try {
    // Appel à l'API Brave Search
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: 20
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY
      }
    });
    
    // Traitement des résultats
    // ...
  } catch (error) {
    // Gestion des erreurs
    // ...
  }
}
```

## Paramètres de recherche

Voici les principaux paramètres que vous pouvez utiliser avec l'API Brave Search :

| Paramètre | Description | Exemple |
|------------|-------------|--------|
| `q` | Requête de recherche | "trending products 2025" |
| `count` | Nombre de résultats (max 20) | 20 |
| `offset` | Décalage pour la pagination | 0 |
| `search_lang` | Langue de recherche | "fr" |
| `country` | Pays de recherche | "FR" |
| `safesearch` | Filtre de contenu | "moderate" |

## Quotas et limites

L'API Brave Search applique des limites de requêtes selon le plan d'abonnement. Vérifiez votre plan pour connaître les quotas exacts. Pour éviter d'atteindre les limites :

1. Mettez en cache les résultats lorsque c'est pertinent
2. Implémentez une logique de backoff exponentiel en cas d'erreurs
3. Planifiez les crawlings à des intervalles raisonnables (par exemple, toutes les heures)

## Filtrage des résultats

Pour améliorer la qualité des résultats, notre système filtre les données retournées par l'API Brave Search. La fonction `filterRelevantProducts` du module `crawler.js` permet de ne retenir que les produits pertinents pour le dropshipping.

## Extensibilité

Vous pouvez améliorer la découverte de produits en :

1. Ajoutant des requêtes de recherche plus spécifiques
2. Implémentant des filtres plus avancés avec du NLP
3. Combinant les résultats de différentes sources (Brave Search, APIs de marketplaces, etc.)

## Ressources

- [Documentation de l'API Brave Search](https://brave.com/search/api/docs/)
- [Politiques d'utilisation](https://brave.com/search/api/terms/)
- [Centre d'aide Brave](https://support.brave.com/)