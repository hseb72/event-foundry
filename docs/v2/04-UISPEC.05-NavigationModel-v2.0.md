# Navigation Model

**Document** : UISPEC.05

**Fichier** : 04-UISPEC.05-NavigationModel-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le modèle de navigation de la plateforme EventFoundry.

Ce document décrit les principes de navigation, les parcours entre les écrans et les règles communes applicables aux différentes expériences utilisateur.

Il garantit une navigation cohérente, prévisible et homogène.

---

# Principes

La navigation respecte les principes suivants :

- simplicité ;
- cohérence ;
- continuité ;
- visibilité ;
- réversibilité.

L'utilisateur doit toujours savoir :

- où il se trouve ;
- comment revenir ;
- quelles actions sont disponibles.

---

# Expériences

La plateforme est organisée autour de trois expériences.

```text
Explorer

Organizer

Operator
```

Chaque expérience possède :

- une navigation principale ;
- une navigation secondaire ;
- des raccourcis contextuels.

Les expériences partagent les mêmes conventions de navigation.

---

# Structure globale

```text
Connexion
      │
      ▼
Sélection de l'expérience
      │
      ├──────────────┐
      ▼              ▼
 Explorer      Organizer
      │              │
      └──────┬───────┘
             ▼
         Operator
```

Le changement d'expérience est possible uniquement si l'utilisateur possède le rôle correspondant.

---

# Navigation principale

La navigation principale donne accès aux fonctionnalités majeures de chaque expérience.

Elle reste visible en permanence.

Elle comprend notamment :

- accès à l'accueil ;
- navigation métier ;
- notifications ;
- profil ;
- changement d'expérience.

---

# Navigation secondaire

La navigation secondaire permet d'accéder aux fonctionnalités complémentaires.

Exemples :

- paramètres ;
- aide ;
- historique ;
- statistiques.

Elle ne doit jamais masquer la navigation principale.

---

# Navigation contextuelle

Une navigation contextuelle peut être proposée selon l'écran.

Exemples :

- onglets ;
- assistants ("wizard") ;
- étapes de publication ;
- vues calendrier.

Elle reste limitée au contexte courant.

---

# Fil d'Ariane

Lorsque la profondeur de navigation le justifie, un fil d'Ariane est affiché.

Exemple :

```text
Accueil
   >
Mes événements
   >
Festival Jazz 2026
```

Le fil d'Ariane permet de revenir vers un niveau supérieur.

---

# Navigation Explorer

```text
Accueil
   │
   ▼
Recherche
   │
   ▼
Résultats
   │
   ▼
Fiche événement
   │
   ▼
Planning
```

Accès permanents :

- Notifications ;
- Profil ;
- Paramètres.

---

# Navigation Organizer

```text
Dashboard
    │
    ▼
Mes événements
    │
    ▼
Créer / Modifier
    │
    ▼
Validation
    │
    ▼
Publication
```

Accès permanents :

- Statistiques ;
- Profil ;
- Paramètres.

---

# Navigation Operator

```text
Dashboard
    │
    ▼
Utilisateurs
    │
    ▼
Organisateurs
    │
    ▼
Référentiels
    │
    ▼
Configuration
    │
    ▼
Monitoring
```

Accès permanents :

- Journaux ;
- Profil ;
- Paramètres.

---

# Retour arrière

Le retour arrière respecte les principes suivants.

- conservation du contexte ;
- conservation des filtres ;
- conservation de la pagination ;
- conservation de la sélection.

Le retour ne provoque jamais une perte de données.

---

# Navigation après action

Après une action importante, la navigation est explicite.

Exemples :

Création réussie :

→ retour à la liste

Publication réussie :

→ affichage de la publication

Suppression :

→ retour à la liste précédente

---

# Navigation entre expériences

Le changement d'expérience est réalisé depuis le sélecteur d'expérience.

Le changement :

- conserve l'identité ;
- conserve la session ;
- recharge la navigation adaptée ;
- recharge les permissions visibles.

Le changement d'expérience ne modifie jamais les rôles.

---

# Navigation mobile

Sur smartphone :

- navigation simplifiée ;
- menus repliables ;
- actions principales prioritaires.

Les fonctionnalités restent identiques.

---

# Navigation clavier

Toutes les fonctionnalités de navigation sont accessibles au clavier.

Les éléments interactifs disposent :

- d'un ordre logique ;
- d'un focus visible ;
- de raccourcis lorsque pertinent.

---

# États de navigation

Les éléments de navigation peuvent être :

- actif ;
- inactif ;
- désactivé ;
- masqué.

Une action non autorisée apparaît désactivée ou n'est pas affichée selon les règles de sécurité.

---

# Confirmation de navigation

Une confirmation est demandée lorsqu'une navigation risque d'entraîner une perte de données.

Exemples :

- formulaire modifié ;
- brouillon non enregistré ;
- suppression en cours.

---

# Liens profonds

Chaque écran possède un identifiant de navigation unique.

Les liens profonds (deep links) permettent d'accéder directement à un écran lorsque les permissions le permettent.

Les paramètres de navigation (filtres, tri, pagination) peuvent être intégrés à l'URL afin de faciliter le partage et la reprise d'une recherche.

---

# Historique

La navigation s'appuie sur l'historique du navigateur.

Les actions suivantes sont supportées :

- précédent ;
- suivant ;
- actualisation.

Le comportement reste cohérent avec l'état de l'application.

---

# Gestion des erreurs

Si une destination n'est pas accessible :

- un message explicite est affiché ;
- une action de retour est proposée ;
- aucune page vide n'est présentée.

---

# Contraintes

Le modèle de navigation respecte les principes suivants :

- une navigation principale par expérience ;
- une navigation cohérente entre les expériences ;
- conservation du contexte utilisateur ;
- compatibilité avec les liens profonds ;
- accessibilité complète au clavier ;
- compatibilité desktop, tablette et mobile.

Toute évolution doit préserver la cohérence globale du parcours utilisateur.

---

# Documents liés

00-Glossaire-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.01-ExplorerExperience-v2.0

04-UISPEC.02-OrganizerExperience-v2.0

04-UISPEC.03-OperatorExperience-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

04-UISPEC.07-ScreenCatalogue-v2.0

04-UISPEC.08-UserFlows-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification du modèle de navigation de la plateforme EventFoundry. |