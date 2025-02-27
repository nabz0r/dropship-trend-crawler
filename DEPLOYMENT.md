# Déploiement et Containerisation de DropShip Trend Crawler

Ce document présente les options de déploiement et de containerisation disponibles pour l'application DropShip Trend Crawler. Nous avons mis en place une infrastructure Docker complète pour simplifier le déploiement et la gestion de l'application.

## Éléments de déploiement disponibles

### Infrastructure de base

- **Dockerfile** : Configuration multi-stage pour une image optimisée et sécurisée
- **docker-compose.yml** : Orchestration des services (application, MongoDB, mongo-express)
- **.env.production** : Variables d'environnement préconfigurées pour la production
- **deploy.sh** : Script de déploiement automatisé

### Monitoring et santé

- **src/routes/healthRoutes.js** : API de vérification de santé pour le monitoring
- **src/app-health.js** : Module d'intégration des routes de santé

### Configuration de serveur web

- **config/nginx.conf** : Configuration Nginx optimisée avec SSL et cache

### Intégration continue

- **.github/workflows/ci-cd.yml** : Pipeline CI/CD automatique via GitHub Actions

## Guide de déploiement rapide

Pour déployer rapidement l'application, suivez ces étapes :

1. Clonez le dépôt sur votre serveur
   ```bash
   git clone https://github.com/nabz0r/dropship-trend-crawler.git
   cd dropship-trend-crawler
   ```

2. Configurez l'environnement de production
   ```bash
   cp .env.example .env.production
   # Éditez les paramètres selon vos besoins
   nano .env.production
   ```

3. Lancez le déploiement
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Architecture de containerisation

L'architecture de containerisation est conçue pour être robuste, scalable et sécurisée :

```
+------------------+     +--------------------+     +--------------------+
|                  |     |                    |     |                    |
|  DropShip App    |<--->|  MongoDB           |     |  Mongo Express     |
|  (Node.js)       |     |  (Database)        |<--->|  (Admin UI)        |
|                  |     |                    |     |                    |
+------------------+     +--------------------+     +--------------------+
        ^                          ^
        |                          |
        v                          v
+------------------+     +--------------------+
|                  |     |                    |
|  Volumes         |     |  Docker Network    |
|  (Persistent)    |     |  (Isolation)       |
|                  |     |                    |
+------------------+     +--------------------+
```

### Caractéristiques principales

1. **Sécurité**
   - Utilisation d'un utilisateur non-root dans le conteneur
   - Isolation via des réseaux Docker dédiés
   - Gestion des secrets via variables d'environnement

2. **Performance**
   - Image de production optimisée et allégée
   - Configuration de cache pour MongoDB
   - Paramètres de performance Node.js optimisés

3. **Fiabilité**
   - Healthchecks intégrés pour tous les services
   - Redémarrage automatique en cas de défaillance
   - Gestion des signaux propre pour arrêt gracieux

4. **Persistance**
   - Volumes Docker pour les données MongoDB
   - Volumes pour les logs de l'application
   - Volumes pour les fichiers de configuration

## Options de déploiement

### 1. Déploiement sur machine unique

C'est l'approche recommandée pour commencer, utilisant Docker Compose sur un seul serveur :

```bash
docker-compose up -d
```

### 2. Déploiement avec CI/CD

Un pipeline CI/CD est configuré via GitHub Actions pour automatiser le déploiement :

1. Les tests sont exécutés automatiquement sur chaque push/PR
2. L'image Docker est construite et publiée sur DockerHub
3. Le déploiement est déclenché sur le serveur de production

Pour configurer ce processus, ajoutez les secrets suivants à votre dépôt GitHub :
- `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN`
- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` et `DEPLOY_PORT`

### 3. Déploiement avec Nginx comme reverse proxy

Pour une configuration de production complète, utilisez Nginx comme reverse proxy :

1. Installez Nginx sur votre serveur
   ```bash
   sudo apt install nginx
   ```

2. Copiez la configuration Nginx fournie
   ```bash
   sudo cp config/nginx.conf /etc/nginx/sites-available/dropship-crawler.conf
   # Modifiez le nom de domaine et les chemins SSL
   sudo nano /etc/nginx/sites-available/dropship-crawler.conf
   ```

3. Activez la configuration
   ```bash
   sudo ln -s /etc/nginx/sites-available/dropship-crawler.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. Configurez SSL avec Certbot
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.com
   ```

## Maintenance et opérations

### Surveillance

Utilisez les endpoints de santé pour surveiller l'application :

```bash
# Vérification de base
curl http://localhost:3000/api/health

# Vérification détaillée
curl http://localhost:3000/api/health/detailed
```

Intégration possible avec Prometheus et Grafana pour une surveillance avancée.

### Sauvegardes

Des commandes de sauvegarde sont incluses dans le script de déploiement :

```bash
# Sauvegarde de la base de données
docker-compose exec -T mongodb mongodump --archive --gzip > ./backups/mongodb-backup-$(date +%Y%m%d%H%M%S).gz

# Restauration
docker-compose exec -T mongodb mongorestore --archive --gzip < ./backups/mongodb-backup-TIMESTAMP.gz
```

### Mise à l'échelle

Pour une mise à l'échelle horizontale :

1. Séparez MongoDB sur un serveur dédié ou utilisez MongoDB Atlas
2. Modifiez `.env.production` pour pointer vers la nouvelle base de données
3. Déployez plusieurs instances de l'application derrière un équilibreur de charge

## Recommandations de sécurité

1. Limitez l'accès à MongoDB et mongo-express aux seuls réseaux nécessaires
2. Changez régulièrement les mots de passe des comptes administratifs
3. Maintenez à jour tous les conteneurs avec les dernières correctifs de sécurité
4. Utilisez un pare-feu pour limiter l'accès aux ports nécessaires uniquement
5. Activez la journalisation et surveillez régulièrement les logs

## Troubleshooting

### Problèmes courants

1. **L'application ne démarre pas**
   - Vérifiez les logs : `docker-compose logs app`
   - Vérifiez la connexion à MongoDB : `docker-compose logs mongodb`

2. **Erreurs de connexion à MongoDB**
   - Vérifiez l'URL de connexion dans `.env.production`
   - Vérifiez que le service MongoDB est en cours d'exécution

3. **Performances lentes**
   - Augmentez les limites de mémoire dans `docker-compose.yml`
   - Optimisez les paramètres de cache dans `config/performance.js`

Consultez la documentation complète dans le dossier `docs/deployment.md` pour plus de détails sur le déploiement et la maintenance.
