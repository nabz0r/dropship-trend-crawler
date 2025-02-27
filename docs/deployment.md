# Guide de déploiement pour DropShip Trend Crawler

Ce document détaille les étapes nécessaires pour déployer l'application DropShip Trend Crawler en environnement de production à l'aide de Docker et Docker Compose.

## Prérequis

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git
- Un serveur Linux (Ubuntu 20.04+ recommandé)
- Clé API Brave Search valide

## Installation sur un serveur

### 1. Préparation du serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common git

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Appliquer les changements de groupe (ou déconnectez-vous et reconnectez-vous)
newgrp docker
```

### 2. Cloner le dépôt

```bash
# Cloner le dépôt
git clone https://github.com/nabz0r/dropship-trend-crawler.git
cd dropship-trend-crawler

# Copier les fichiers de configuration
cp .env.example .env.production
```

### 3. Configurer l'application

Éditez le fichier `.env.production` pour configurer l'application selon vos besoins :

```bash
# Ouvrir le fichier avec votre éditeur préféré
nano .env.production
```

Modifiez les paramètres suivants :
- `BRAVE_API_KEY` : votre clé API Brave Search
- `MONGO_EXPRESS_USER` et `MONGO_EXPRESS_PASSWORD` : identifiants pour l'interface MongoDB Express
- Autres paramètres selon vos besoins

### 4. Lancer le déploiement

```bash
# Rendre le script de déploiement exécutable
chmod +x deploy.sh

# Exécuter le script de déploiement
./deploy.sh
```

### 5. Vérifier le déploiement

Une fois le déploiement terminé, vérifiez que les services fonctionnent correctement :

```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Vérifier les logs de l'application
docker-compose logs --tail=100 app

# Tester l'endpoint de santé
curl http://localhost:3000/api/health
```

## Accès aux services

- **Application principale** : http://localhost:3000
- **Interface MongoDB Express** : http://localhost:8081

## Configuration d'un proxy inverse (Nginx)

Pour exposer l'application en production avec un nom de domaine et HTTPS, configurez Nginx comme proxy inverse :

```bash
# Installer Nginx
sudo apt install -y nginx

# Installer Certbot pour les certificats SSL
sudo apt install -y certbot python3-certbot-nginx

# Créer une configuration Nginx
sudo nano /etc/nginx/sites-available/dropship-crawler.conf
```

Contenu du fichier de configuration :

```nginx
server {
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez la configuration et obtenez un certificat SSL :

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/dropship-crawler.conf /etc/nginx/sites-enabled/

# Vérifier la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com
```

## Mise à jour de l'application

Pour mettre à jour l'application avec les dernières modifications :

```bash
# Se placer dans le répertoire du projet
cd dropship-trend-crawler

# Récupérer les dernières modifications
git pull

# Relancer le déploiement
./deploy.sh
```

## Sauvegarde de la base de données

Pour sauvegarder la base de données MongoDB :

```bash
# Créer un répertoire de sauvegarde
mkdir -p ~/backups

# Effectuer une sauvegarde
docker-compose exec -T mongodb mongodump --archive --gzip > ~/backups/mongodb-backup-$(date +%Y%m%d%H%M%S).gz
```

## Restauration de la base de données

Pour restaurer une sauvegarde :

```bash
# Restaurer une sauvegarde spécifique
docker-compose exec -T mongodb mongorestore --archive --gzip < ~/backups/mongodb-backup-XXXXXXXXXX.gz
```

## Surveillance et maintenance

### Surveillance des logs

```bash
# Afficher les logs en temps réel
docker-compose logs -f app

# Limiter aux 100 dernières lignes
docker-compose logs --tail=100 app
```

### Vérification de l'état

```bash
# Vérifier l'état détaillé de l'application
curl http://localhost:3000/api/health/detailed | json_pp
```

### Redémarrage des services

```bash
# Redémarrer tous les services
docker-compose restart

# Redémarrer uniquement l'application
docker-compose restart app
```

## Troubleshooting

### Problèmes de connexion à MongoDB

Si l'application ne peut pas se connecter à MongoDB :

```bash
# Vérifier que le service MongoDB est en cours d'exécution
docker-compose ps mongodb

# Vérifier les logs de MongoDB
docker-compose logs mongodb

# S'assurer que les volumes sont correctement configurés
docker volume ls | grep mongodb
```

### Problèmes de performance

Si l'application est lente ou utilise trop de ressources :

```bash
# Surveiller l'utilisation des ressources
docker stats

# Augmenter les ressources allouées dans docker-compose.yml
# Éditer le fichier et ajuster les limites de mémoire et CPU
```

## Sécurisation supplémentaire

### Configuration d'un pare-feu

Il est recommandé de configurer un pare-feu pour limiter l'accès aux ports nécessaires uniquement :

```bash
# Installation de UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Autoriser SSH pour éviter de perdre l'accès au serveur
sudo ufw allow ssh

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable
```

### Protection des services internes

Assurez-vous que les services comme MongoDB et mongo-express ne sont pas accessibles directement depuis l'extérieur :

1. Modifiez le fichier `docker-compose.yml` pour ne pas publier les ports internes sur l'interface externe :

```yaml
mongodb:
  # Au lieu de
  # ports:
  #   - "27017:27017"
  # Utilisez
  expose:
    - "27017"
```

2. Utilisez un réseau reverse proxy dédié pour Nginx :

```yaml
networks:
  dropship-network:
    internal: true  # Réseau interne non accessible de l'extérieur
  web:
    external: true  # Réseau partagé avec Nginx
```

## Automatisation et CI/CD

Pour automatiser le déploiement via GitHub Actions :

1. Créez un fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd dropship-trend-crawler
            git pull
            ./deploy.sh
```

2. Configurez les secrets dans votre dépôt GitHub :
   - `HOST` : Adresse IP ou nom d'hôte de votre serveur
   - `USERNAME` : Nom d'utilisateur pour la connexion SSH
   - `SSH_KEY` : Clé SSH privée pour l'authentification

## Ressources additionnelles

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation MongoDB](https://docs.mongodb.com/)
- [Documentation Nginx](https://nginx.org/en/docs/)
- [Guide de sécurité Docker](https://docs.docker.com/engine/security/security/)
