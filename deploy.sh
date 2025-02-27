#!/bin/bash
# Script de déploiement pour DropShip Trend Crawler

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Démarrage du déploiement de DropShip Trend Crawler${NC}"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si le fichier .env.production existe, sinon le créer à partir de l'exemple
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Fichier .env.production non trouvé. Création à partir de .env.example...${NC}"
    cp .env.example .env.production
    echo -e "${YELLOW}Veuillez éditer le fichier .env.production avec vos paramètres réels avant de continuer.${NC}"
    exit 1
fi

# Charger les variables d'environnement
echo -e "${GREEN}Chargement des variables d'environnement...${NC}"
export $(grep -v '^#' .env.production | xargs)

# Arrêter les conteneurs existants si nécessaire
echo -e "${YELLOW}Arrêt des conteneurs existants...${NC}"
docker-compose down

# Construire les images
echo -e "${GREEN}Construction des images Docker...${NC}"
docker-compose build --no-cache

# Démarrer les services
echo -e "${GREEN}Démarrage des services...${NC}"
docker-compose up -d

# Vérifier l'état des conteneurs
echo -e "${GREEN}Vérification de l'état des conteneurs...${NC}"
docker-compose ps

# Afficher les logs initiaux
echo -e "${GREEN}Logs de démarrage de l'application:${NC}"
docker-compose logs --tail=50 app

echo -e "${GREEN}Déploiement terminé avec succès!${NC}"
echo -e "${YELLOW}L'application est accessible à l'adresse: http://localhost:3000${NC}"
echo -e "${YELLOW}L'interface MongoDB Express est accessible à l'adresse: http://localhost:8081${NC}"