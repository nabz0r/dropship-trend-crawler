# Guide d'installation de MongoDB pour DropShip Trend Crawler

Ce guide détaille les étapes nécessaires pour installer et configurer MongoDB, requis pour le fonctionnement optimal de l'application DropShip Trend Crawler.

## Installation de MongoDB

### Sur Windows

1. Téléchargez l'installateur MSI de MongoDB Community Server depuis le site officiel : https://www.mongodb.com/try/download/community

2. Exécutez l'installateur et suivez les instructions. Choisissez l'option "Complete" pour l'installation.

3. Assurez-vous que l'option "Install MongoDB as a Service" est cochée.

4. Terminez l'installation.

5. MongoDB devrait démarrer automatiquement comme un service Windows.

### Sur macOS

1. Si vous avez Homebrew installé, exécutez la commande suivante :
   ```
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. Démarrez le service MongoDB :
   ```
   brew services start mongodb-community
   ```

### Sur Linux (Ubuntu)

1. Importez la clé publique utilisée par le système de gestion de paquets :
   ```
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   ```

2. Créez un fichier liste pour MongoDB :
   ```
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   ```

3. Rechargez la base de données des paquets locale :
   ```
   sudo apt-get update
   ```

4. Installez MongoDB :
   ```
   sudo apt-get install -y mongodb-org
   ```

5. Démarrez le service MongoDB :
   ```
   sudo systemctl start mongod
   ```

## Vérification de l'installation

Pour vérifier que MongoDB fonctionne correctement :

1. Ouvrez un terminal ou une invite de commande.

2. Connectez-vous à MongoDB :
   ```
   mongosh
   ```

3. Vous devriez voir une invite MongoDB. Tapez la commande suivante pour vérifier la connexion :
   ```
   show dbs
   ```

4. Si vous voyez une liste de bases de données (comme admin, config, local), cela signifie que MongoDB fonctionne correctement.

5. Quittez le shell MongoDB en tapant :
   ```
   exit
   ```

## Configuration de l'application

1. Ouvrez le fichier `.env` dans le répertoire racine du projet DropShip Trend Crawler.

2. Ajoutez ou modifiez la ligne suivante :
   ```
   MONGODB_URI=mongodb://localhost:27017/dropship-crawler
   ```

3. Enregistrez le fichier.

4. Redémarrez l'application :
   ```
   npm run dev
   ```

5. Vérifiez dans la console que le message "Connexion à MongoDB établie avec succès" s'affiche au démarrage.

## Fonctionnement en mode démo (sans MongoDB)

Si vous préférez ne pas installer MongoDB, l'application peut fonctionner en mode démo :

1. Dans le fichier `.env`, supprimez ou commentez la ligne `MONGODB_URI`.

2. Redémarrez l'application.

3. Le système utilisera une base de données en mémoire. Notez que les données seront perdues à chaque redémarrage de l'application.

## Résolution des problèmes courants

### Erreur de connexion à MongoDB

Assurez-vous que le service MongoDB est en cours d'exécution. Vous pouvez vérifier l'état du service :
  - Windows : `services.msc` et cherchez "MongoDB"
  - macOS : `brew services list`
  - Linux : `sudo systemctl status mongod`

### Port en conflit

Si le port 27017 est déjà utilisé, vous pouvez spécifier un port différent dans votre URI de connexion :
```
MONGODB_URI=mongodb://localhost:27018/dropship-crawler
```

### Problèmes de permission

Assurez-vous que votre utilisateur a les droits nécessaires pour accéder au répertoire de données de MongoDB. Sur Linux et macOS, vous devrez peut-être utiliser `sudo` pour certaines commandes.

### Utilisation d'un service MongoDB hébergé

Vous pouvez également utiliser un service MongoDB hébergé comme MongoDB Atlas. Dans ce cas, remplacez l'URI de connexion par celle fournie par votre service :

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dropship-crawler
```