#!/bin/bash
# Script de déploiement pour DropShip Trend Crawler

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour journaliser les messages
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1"
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" >> deploy.log
}

log "${YELLOW}Démarrage du déploiement de DropShip Trend Crawler${NC}"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    log "${RED}Docker n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    log "${RED}Docker Compose n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si le fichier .env.production existe, sinon le créer à partir de l'exemple
if [ ! -f .env.production ]; then
    log "${YELLOW}Fichier .env.production non trouvé. Création à partir de .env.example...${NC}"
    cp .env.example .env.production
    log "${YELLOW}Veuillez éditer le fichier .env.production avec vos paramètres réels avant de continuer.${NC}"
    exit 1
fi

# Sauvegarde des données MongoDB si le conteneur existe et fonctionne
if docker-compose ps | grep -q "mongodb.*running"; then
    BACKUP_DIR="./backups"
    BACKUP_FILE="mongodb-backup-$(date +%Y%m%d%H%M%S).gz"
    
    log "${GREEN}Sauvegarde de la base de données MongoDB...${NC}"
    mkdir -p $BACKUP_DIR
    docker-compose exec -T mongodb mongodump --archive --gzip > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "${GREEN}Sauvegarde réussie: $BACKUP_FILE${NC}"
    else
        log "${YELLOW}Avertissement: La sauvegarde a échoué, mais le déploiement continuera.${NC}"
    fi
fi

# Charger les variables d'environnement
log "${GREEN}Chargement des variables d'environnement...${NC}"
export $(grep -v '^#' .env.production | xargs)

# Arrêter les conteneurs existants si nécessaire
log "${YELLOW}Arrêt des conteneurs existants...${NC}"
docker-compose down
if [ $? -ne 0 ]; then
    log "${YELLOW}Avertissement: Problème lors de l'arrêt des conteneurs.${NC}"
    # On continue quand même car cela peut être dû à l'absence de conteneurs
fi

# Construire les images
log "${GREEN}Construction des images Docker...${NC}"
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    log "${RED}Erreur lors de la construction des images Docker.${NC}"
    exit 2
fi

# Démarrer les services
log "${GREEN}Démarrage des services...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    log "${RED}Erreur lors du démarrage des services Docker.${NC}"
    exit 3
fi

# Vérifier l'état des conteneurs
log "${GREEN}Vérification de l'état des conteneurs...${NC}"
docker-compose ps

# Attendre que les services soient prêts
log "${GREEN}Attente du démarrage complet des services...${NC}"
sleep 10

# Vérifier la santé de l'application
log "${GREEN}Vérification de la santé de l'application...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || echo "failed")
if [[ $HEALTH_CHECK == *"status"*"ok"* ]]; then
    log "${GREEN}L'application est en bon état de fonctionnement.${NC}"
else
    log "${YELLOW}Avertissement: La vérification de santé de l'application a échoué ou n'a pas répondu comme prévu.${NC}"
    log "${YELLOW}Vérifiez les journaux pour plus de détails.${NC}"
fi

# Afficher les logs initiaux
log "${GREEN}Logs de démarrage de l'application:${NC}"
docker-compose logs --tail=50 app

log "${GREEN}Déploiement terminé avec succès!${NC}"
log "${YELLOW}L'application est accessible à l'adresse: http://localhost:3000${NC}"
log "${YELLOW}L'interface MongoDB Express est accessible à l'adresse: http://localhost:8081${NC}"

exit 0
