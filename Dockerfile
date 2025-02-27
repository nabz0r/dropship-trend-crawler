# Utilisation d'une image multi-stage pour optimiser la taille finale

# Stage 1: Build de l'application
FROM node:18-alpine AS builder

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances en mode production uniquement
RUN npm ci --only=production

# Stage 2: Image finale optimisée
FROM node:18-alpine

# Définition des variables d'environnement pour la production
ENV NODE_ENV=production

# Installation de Tini pour une gestion correcte des signaux
RUN apk add --no-cache tini

# Création d'un utilisateur spécifique pour l'application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Définition du répertoire de travail
WORKDIR /app

# Copie uniquement des dépendances de production depuis le stage builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules

# Copie des fichiers du projet
COPY --chown=nodejs:nodejs . .

# Exposition du port sur lequel l'application va tourner
EXPOSE 3000

# Changement vers l'utilisateur non-root
USER nodejs

# Définition du point d'entrée avec Tini pour une gestion correcte des signaux
ENTRYPOINT ["/sbin/tini", "--"]

# Commande de démarrage
CMD ["node", "src/app.js"]

# Vérification de l'état de l'application
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1