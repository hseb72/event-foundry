# Operator Experience

**Document** : UISPEC.03

**Fichier** : 04-UISPEC.03-OperatorExperience-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Décrire l'ensemble de l'expérience utilisateur Operator.

Ce document spécifie les écrans, leur organisation, leurs interactions et leurs règles de navigation.

L'expérience Operator permet d'administrer, superviser et maintenir la plateforme EventFoundry.

---

# Vue d'ensemble

```text
Dashboard

↓

Utilisateurs

↓

Organisateurs

↓

Référentiels

↓

Configuration

↓

Monitoring
```

Des accès secondaires permettent également d'ouvrir :

- Journaux
- Profil
- Paramètres

---

# Navigation principale

| ID | Écran |
|----|--------|
| OPE-001 | Dashboard |
| OPE-002 | Utilisateurs |
| OPE-003 | Organisateurs |
| OPE-004 | Référentiels |
| OPE-005 | Configuration |
| OPE-006 | Monitoring |
| OPE-007 | Journaux |
| OPE-008 | Profil |
| OPE-009 | Paramètres |

---

# OPE-001 — Dashboard

## Objectif

Présenter une vision globale de l'état de la plateforme.

---

## Utilisateurs

Operator

---

## Préconditions

Utilisateur authentifié.

Possède le rôle Operator.

---

## Contenu

- état général
- indicateurs clés
- alertes
- activités récentes
- raccourcis d'administration

---

## Actions

- ouvrir une alerte
- consulter un domaine
- accéder au monitoring
- accéder aux journaux

---

## Navigation

Vers :

- Utilisateurs
- Organisateurs
- Référentiels
- Monitoring

---

# OPE-002 — Utilisateurs

## Objectif

Administrer les comptes utilisateurs.

---

## Contenu

Chaque utilisateur présente notamment :

- identité
- rôles
- expérience active
- abonnement
- statut

---

## Actions

- consulter
- modifier
- suspendre
- réactiver
- attribuer un rôle

---

## États

- actif
- suspendu
- supprimé

---

## Navigation

Vers :

- Profil utilisateur

---

# OPE-003 — Organisateurs

## Objectif

Administrer les comptes organisateurs.

---

## Contenu

- organisation
- événements publiés
- statut
- abonnements

---

## Actions

- consulter
- modifier
- suspendre
- réactiver

---

# OPE-004 — Référentiels

## Objectif

Administrer les données de référence.

---

## Contenu

- catégories
- activités
- lieux
- communes
- régions
- tags

---

## Actions

- créer
- modifier
- archiver
- restaurer

---

## États

- actif
- archivé

---

# OPE-005 — Configuration

## Objectif

Configurer les paramètres globaux de la plateforme.

---

## Contenu

- paramètres fonctionnels
- paramètres techniques
- fonctionnalités activées
- politiques globales

---

## Actions

- modifier
- enregistrer
- restaurer

---

# OPE-006 — Monitoring

## Objectif

Superviser l'état opérationnel des services.

---

## Contenu

- disponibilité
- performances
- files de traitement
- traitements en erreur
- consommation des ressources

---

## Actions

- consulter
- filtrer
- analyser

---

# OPE-007 — Journaux

## Objectif

Consulter les événements techniques et fonctionnels.

---

## Contenu

- journal applicatif
- journal sécurité
- journal métier
- historique des opérations

---

## Actions

- rechercher
- filtrer
- exporter

---

# OPE-008 — Profil

## Objectif

Consulter et modifier les informations du compte Operator.

---

## Contenu

- identité
- rôles
- préférences
- expérience active

---

## Actions

- modifier
- changer d'expérience

---

# OPE-009 — Paramètres

## Objectif

Configurer les préférences personnelles.

---

## Contenu

- notifications
- langue
- accessibilité
- préférences d'affichage

---

## Actions

- enregistrer
- restaurer

---

# Navigation globale

```text
Dashboard
     │
     ├──────────────┐
     ▼              ▼
Utilisateurs   Organisateurs
     │              │
     └──────┬───────┘
            ▼
     Référentiels
            │
            ▼
     Configuration
            │
            ▼
      Monitoring
            │
            ▼
         Journaux
```

Le Profil et les Paramètres restent accessibles en permanence.

---

# Composants utilisés

L'expérience Operator réutilise notamment :

- Dashboard Cards
- User Table
- Organization Table
- Reference Editor
- Configuration Form
- Metrics Panel
- Log Viewer
- Status Badge
- Search Bar
- Filters
- Pagination

Les composants sont décrits dans UISPEC.04.

---

# Principes d'interaction

L'expérience Operator respecte les principes suivants :

- visibilité permanente de l'état du système ;
- confirmation des opérations sensibles ;
- traçabilité complète des actions ;
- accès rapide aux informations critiques ;
- interfaces optimisées pour les tâches d'administration.

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

Toutes les fonctionnalités nécessitent le rôle Operator.

Les opérations critiques (gestion des rôles, configuration globale, référentiels) sont soumises à des permissions spécifiques.

L'interface masque ou désactive les actions non autorisées.

---

# Documents liés

00-Glossaire-v2.0

00-STRAT.02-UserExperiences-v2.0

02-FSPEC.10-ProfilesAndPermissions-v2.0

02-FSPEC.07-ReferenceData-v2.0

03-TSPEC.06-Identity-v2.0

03-TSPEC.08-ReferenceData-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification de l'expérience Operator. |