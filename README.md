# Projet-BabyFoot-Manager
 
Une application web pour gérer les parties de babyfoot. Le projet comprend un frontend développé avec HTML, CSS et JavaScript, ainsi qu'un backend développé  par Node.js avec une base de données PostgreSQL.

## Fonctionnalités

- **Gestion des parties :** 
   - Ajouter une partie : Créez une nouvelle partie de babyfoot.
   - Terminer une partie : Marquez une partie comme terminée.
   - Supprimer une partie : Supprimez une partie existante.

- **Chat en temps réel :** 
   - Communication instantanée entre les utilisateurs pour discuter pendant les parties.


---

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés :

- [Node.js](https://nodejs.org/) (testé sur la version Node.js v20.16.0)
- [PostgreSQL](https://www.postgresql.org/) (testé sur la version PostgreSQL 17.2)

---

## Installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/AhmedCha/BabyFoot-Manager.git
   cd BabyFoot-Manager
   ```

2. **Installer les dépendances du Node.js :**
   ```bash
   cd backend/node server
   npm install
   ```

3. **Configurer la base de données PostgreSQL :**
   - Démarrez votre serveur PostgreSQL.
   - Créez une nouvelle base de données pour le projet sous le nom ```babyfoot_db```
   - Importez le fichier SQL fourni pour initialiser le schéma de la base de données :
     ```bash
     psql -U <votre-nom-utilisateur> -d babyfoot_db -f backend/Database/babyfoot_manager.sql
     ```
   - Une fois la base de données créée, vous pouvez vérifier qu'elle est correctement configurée en exécutant une requête SQL simple, par exemple :
   ```sql
   SELECT * FROM games;
   ```


4. **Configurer l'environnement :**
   - Mettez à jour l'ULR de ```ws_url``` dans le fichier ```script.js``` situé dans la répertoire ```frontend\script.js```. Par default il est ```ws://localhost:3000```
   - Mettez à jour le fichier ```serveur.js``` situé dans la répertoire ```backend\server\server.js``` avec vos identifiants PostgreSQL et les paramètres du serveur :
     ```
      const pool = new Pool({
      user: '<votre_postgre_username>',
      host: '<votre_url>',                         // Mettez 'localhaut' pour un serveur local
      database: 'babyfoot_db',
      password: '<votre_postgre_mot_de_passe>',
      port: /*votre_port_postgres*/,                // 5432 par default
      });
     ```

---

## Lancer l'application

### Démarrer le serveur backend
1. Accédez au répertoire `backend` :
   ```bash
   cd backend/server
   ```

2. Lancez le serveur :
   ```bash
   node server.js
   ```

   Le serveur backend démarre par défaut à l'adresse `http://localhost:3000`.

### Lancer le frontend
1. Ouvrez le dossier `frontend` dans votre gestionnaire de fichiers.
2. Ouvrez le fichier `index.html` dans votre navigateur web.
