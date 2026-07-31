# Explorer Experience

**Document** : UISPEC.01

**Fichier** : 04-UISPEC.01-ExplorerExperience-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Décrire l'ensemble de l'expérience utilisateur Explorer.

Ce document spécifie les écrans, leur organisation, leurs interactions et leurs règles de navigation.

L'expérience Explorer permet à un utilisateur de découvrir le patrimoine culturel, sélectionner des événements et organiser son planning.

---

# Vue d'ensemble

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

Des accès secondaires permettent également d'ouvrir :

- Notifications
- Profil
- Paramètres

---

# Navigation principale

L'expérience Explorer est composée des écrans suivants.

| ID | Écran |
|----|--------|
| EXP-001 | Accueil |
| EXP-002 | Recherche |
| EXP-003 | Résultats |
| EXP-004 | Fiche événement |
| EXP-005 | Planning |
| EXP-006 | Notifications |
| EXP-007 | Profil |
| EXP-008 | Paramètres |

---

# EXP-001 — Accueil

## Objectif

Accueillir l'utilisateur et proposer les principaux points d'entrée de l'expérience.

---

## Utilisateurs

Explorer

---

## Préconditions

Utilisateur authentifié.

---

## Contenu

- barre de recherche
- recommandations
- événements proches
- événements à venir
- accès Planning
- accès Notifications

---

## Actions

- rechercher
- ouvrir une recommandation
- ouvrir un événement
- ouvrir Planning
- consulter Notifications

---

## Navigation

Entrée :

- connexion
- changement d'expérience

Sorties :

- Recherche
- Fiche événement
- Planning

---

# EXP-002 — Recherche

## Objectif

Permettre une recherche libre dans le catalogue.

---

## Contenu

- champ de recherche
- filtres
- tri
- carte (optionnelle)
- liste des résultats

---

## Filtres

Exemples :

- date
- catégorie
- activité
- commune
- organisateur
- lieu

---

## Actions

- saisir une recherche
- filtrer
- modifier le tri
- consulter un résultat

---

## États

- vide
- chargement
- résultats
- aucun résultat

---

## Navigation

Vers :

- Résultats

---

# EXP-003 — Résultats

## Objectif

Présenter les événements correspondant à la recherche.

---

## Contenu

Chaque résultat affiche notamment :

- image
- titre
- date
- lieu
- catégorie
- résumé

---

## Actions

- ouvrir une fiche
- modifier les filtres
- changer le tri
- revenir à la recherche

---

## États

- liste
- carte
- pagination

---

## Navigation

Vers :

- Fiche événement

---

# EXP-004 — Fiche événement

## Objectif

Présenter le détail complet d'un événement.

---

## Contenu

- titre
- image
- description
- horaires
- localisation
- organisateur
- informations pratiques
- recommandations associées

---

## Actions

- ajouter au Planning
- partager
- ouvrir le lieu
- revenir aux résultats

---

## États

- disponible
- archivé
- indisponible

---

## Navigation

Vers :

- Planning
- Résultats

---

# EXP-005 — Planning

## Objectif

Permettre à l'utilisateur de gérer ses événements.

---

## Contenu

- calendrier
- liste chronologique
- conflits
- événements confirmés
- événements suggérés

---

## Actions

- confirmer
- annuler
- supprimer
- consulter un événement

---

## États

- vide
- planning rempli
- conflit détecté

---

## Navigation

Vers :

- Fiche événement

---

# EXP-006 — Notifications

## Objectif

Présenter les informations importantes.

---

## Contenu

- notifications non lues
- notifications lues
- actions rapides

---

## Actions

- ouvrir
- marquer comme lu
- supprimer

---

# EXP-007 — Profil

## Objectif

Permettre la consultation du profil utilisateur.

---

## Contenu

- identité
- abonnements
- préférences
- expérience active

---

## Actions

- modifier le profil
- changer d'expérience
- gérer les préférences

---

# EXP-008 — Paramètres

## Objectif

Configurer l'expérience utilisateur.

---

## Contenu

- préférences
- notifications
- confidentialité
- langue

---

## Actions

- enregistrer
- restaurer les valeurs par défaut

---

# Navigation globale

```text
Accueil
   │
   ├──────────────┐
   ▼              ▼
Recherche      Planning
   │              ▲
   ▼              │
Résultats─────────┘
   │
   ▼
Fiche événement
```

Les écrans Profil, Notifications et Paramètres restent accessibles en permanence.

---

# Composants utilisés

L'expérience Explorer réutilise les composants suivants :

- Search Bar
- Event Card
- Recommendation Card
- Planning Card
- Filters
- Calendar
- Notification Badge
- Navigation Bar
- Pagination
- Map

Les composants sont décrits dans UISPEC.04.

---

# Principes d'interaction

L'expérience Explorer respecte les principes suivants :

- navigation fluide ;
- recherche immédiate ;
- ajout au Planning en une action ;
- retour arrière conservant le contexte ;
- temps de réponse perçu minimal.

---

# États communs

Chaque écran prévoit :

- chargement ;
- succès ;
- vide ;
- erreur.

Les comportements sont définis dans UISPEC.06.

---

# Permissions

Toutes les fonctionnalités sont accessibles au rôle Explorer.

Les fonctionnalités dépendantes de l'abonnement sont clairement identifiées.

---

# Documents liés

00-Glossaire-v2.0

00-STRAT.02-UserExperiences-v2.0

02-FSPEC.08-RecommendationEngine-v2.0

02-FSPEC.09-Planning-v2.0

02-FSPEC.11-Notifications-v2.0

02-FSPEC.12-Discovery-v2.0

03-TSPEC.02-RecommendationEngine-v2.0

03-TSPEC.03-Planning-v2.0

03-TSPEC.04-Discovery-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification de l'expérience Explorer. |