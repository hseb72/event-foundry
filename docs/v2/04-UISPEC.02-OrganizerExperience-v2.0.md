# Organizer Experience

**Document** : UISPEC.02

**Fichier** : 04-UISPEC.02-OrganizerExperience-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Décrire l'ensemble de l'expérience utilisateur Organizer.

Ce document spécifie les écrans, leur organisation, leurs interactions et leurs règles de navigation.

L'expérience Organizer permet aux organisateurs de créer, publier, suivre et administrer leurs événements.

---

# Vue d'ensemble

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

Des accès secondaires permettent également d'ouvrir :

- Statistiques
- Profil
- Paramètres

---

# Navigation principale

| ID | Écran |
|----|--------|
| ORG-001 | Dashboard |
| ORG-002 | Mes événements |
| ORG-003 | Création / Édition |
| ORG-004 | Validation |
| ORG-005 | Publication |
| ORG-006 | Statistiques |
| ORG-007 | Profil |
| ORG-008 | Paramètres |

---

# ORG-001 — Dashboard

## Objectif

Donner une vision synthétique de l'activité de l'organisateur.

---

## Utilisateurs

Organizer

---

## Préconditions

Utilisateur authentifié.

Possède le rôle Organizer.

---

## Contenu

- publications récentes
- brouillons
- événements publiés
- actions en attente
- statistiques rapides

---

## Actions

- créer un événement
- reprendre un brouillon
- consulter un événement
- ouvrir les statistiques

---

## Navigation

Vers :

- Mes événements
- Création
- Statistiques

---

# ORG-002 — Mes événements

## Objectif

Lister les événements appartenant à l'organisateur.

---

## Contenu

Chaque ligne présente :

- titre
- statut
- date
- lieu
- dernière modification

---

## Filtres

- statut
- période
- catégorie
- recherche texte

---

## Actions

- consulter
- modifier
- publier
- archiver
- dupliquer

---

## États

- aucun événement
- brouillons
- publiés
- archivés

---

## Navigation

Vers :

- Création / Édition
- Publication

---

# ORG-003 — Création / Édition

## Objectif

Créer ou modifier un événement.

---

## Contenu

Le formulaire est organisé en sections :

- informations générales
- description
- programmation
- localisation
- organisateur
- médias
- informations pratiques

---

## Actions

- enregistrer un brouillon
- prévisualiser
- soumettre à validation
- supprimer le brouillon

---

## États

- nouveau
- brouillon
- modification
- erreur de validation

---

## Navigation

Vers :

- Validation
- Mes événements

---

# ORG-004 — Validation

## Objectif

Présenter le résultat des contrôles avant publication.

---

## Contenu

- contrôles réussis
- erreurs
- avertissements
- informations manquantes

---

## Actions

- corriger
- republier
- revenir à l'édition

---

## États

- conforme
- avertissements
- publication impossible

---

## Navigation

Vers :

- Création / Édition
- Publication

---

# ORG-005 — Publication

## Objectif

Finaliser la publication de l'événement.

---

## Contenu

- résumé
- date de publication
- visibilité
- historique

---

## Actions

- publier
- archiver
- dépublier (si autorisé)

---

## États

- publié
- archivé

---

# ORG-006 — Statistiques

## Objectif

Présenter les indicateurs disponibles sur les publications.

---

## Contenu

- nombre d'événements publiés
- publications par période
- consultations
- indicateurs disponibles

---

## Actions

- filtrer
- exporter (si autorisé)

---

# ORG-007 — Profil

## Objectif

Consulter et modifier les informations du compte organisateur.

---

## Contenu

- identité
- organisation
- coordonnées
- abonnements
- préférences

---

## Actions

- modifier
- changer d'expérience

---

# ORG-008 — Paramètres

## Objectif

Configurer l'espace Organizer.

---

## Contenu

- préférences
- notifications
- langue
- confidentialité

---

## Actions

- enregistrer
- restaurer

---

# Navigation globale

```text
Dashboard
     │
     ▼
Mes événements
     │
     ▼
Création / Édition
     │
     ▼
Validation
     │
     ▼
Publication
```

Les écrans Profil et Paramètres restent accessibles en permanence.

---

# Composants utilisés

L'expérience Organizer réutilise notamment :

- Event Form
- Event Summary
- Validation Panel
- Publication Status
- Dashboard Cards
- Statistics Cards
- File Upload
- Date Picker
- Map Selector
- Rich Text Editor

Les composants sont décrits dans UISPEC.04.

---

# Principes d'interaction

L'expérience Organizer respecte les principes suivants :

- sauvegarde des brouillons sans perte de données ;
- validation progressive ;
- publication explicite ;
- retour immédiat sur les erreurs ;
- traçabilité des modifications.

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

Toutes les fonctionnalités nécessitent le rôle Organizer.

Certaines opérations (publication, archivage, statistiques avancées) peuvent dépendre des permissions et de l'abonnement actif.

---

# Documents liés

00-Glossaire-v2.0

00-STRAT.02-UserExperiences-v2.0

02-FSPEC.13-Publishing-v2.0

03-TSPEC.05-Publishing-v2.0

03-TSPEC.06-Identity-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification de l'expérience Organizer. |