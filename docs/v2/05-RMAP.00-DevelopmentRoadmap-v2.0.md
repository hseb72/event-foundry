# Development Roadmap

**Document** : RMAP.00

**Fichier** : 05-RMAP.00-DevelopmentRoadmap-v2.0.md

**Version** : 2.0

**Statut** : Ready for Development

---

# Objectif

Décomposer le développement d'EventFoundry V2 en incréments cohérents.

Chaque EPIC représente une capacité fonctionnelle complète pouvant être développée, testée et validée indépendamment.

L'ordre proposé respecte :

- les dépendances techniques ;
- les dépendances métier ;
- la montée progressive en valeur fonctionnelle.

Chaque EPIC référence les documents de conception concernés (FSPEC, TSPEC et UISPEC).

---

# Ordonnancement

```
EPIC 00  Foundation
    │
EPIC 01  Identity
    │
EPIC 02  Reference Data
    │
EPIC 03  Catalog
    │
EPIC 04  Publishing
    │
EPIC 05  Planning
    │
EPIC 06  Recommendation
    │
EPIC 07  Discovery
    │
EPIC 08  Notifications
    │
EPIC 09  Search
    │
EPIC 10  Explorer Portal
    │
EPIC 11  Organizer Portal
    │
EPIC 12  Operator Portal
    │
EPIC 13  Finalization
```

---

# EPIC 00 — Foundation

## Objectif

Mettre en place le socle technique de la plateforme.

## Réalisation

### Infrastructure

- Monorepo
- Docker
- Docker Compose
- CI/CD
- PostgreSQL
- Redis
- Object Storage
- Message Broker
- Configuration
- Secrets

### Shared

- Contrats
- Bibliothèques communes
- DTO
- Validation
- Logging
- Gestion des erreurs
- Configuration
- Tests communs

### Architecture

- Structure des projets
- Conventions
- Qualité de code
- Documentation technique

---

# EPIC 01 — Identity

## Objectif

Mettre en œuvre l'identité des utilisateurs et la sécurité.

## Réalisation

- Authentification
- Sessions
- JWT
- Refresh Token
- Utilisateurs
- Profils
- Rôles
- Permissions
- Changement d'expérience
- Préférences utilisateur

### Références

- FSPEC Identity
- TSPEC Identity
- UISPEC Explorer
- UISPEC Organizer
- UISPEC Operator

---

# EPIC 02 — Reference Data

## Objectif

Mettre en œuvre les référentiels de la plateforme.

## Réalisation

- Domaines
- Activités
- Catégories
- Types d'événements
- Formats
- Organisateurs
- Lieux
- Villes
- Régions
- Pays
- Tags

Pour chaque référentiel :

- CRUD
- Recherche
- Archivage
- Validation

### Références

- FSPEC Reference Data
- TSPEC Reference Data
- UISPEC Operator

---

# EPIC 03 — Catalog

## Objectif

Construire le catalogue des événements.

## Réalisation

- Création
- Modification
- Consultation
- Archivage
- Médias
- Recherche métier
- Gestion des dates
- Localisation

### Références

- FSPEC Catalog
- TSPEC Catalog
- UISPEC Organizer
- UISPEC Explorer

---

# EPIC 04 — Publishing

## Objectif

Mettre en œuvre le cycle de vie des événements.

## Réalisation

- Brouillon
- Validation
- Publication
- Dépublication
- Archivage
- Historique
- Traçabilité

### Références

- FSPEC Publishing
- TSPEC Publishing
- UISPEC Organizer

---

# EPIC 05 — Planning

## Objectif

Permettre aux utilisateurs de gérer leur planning.

## Réalisation

- Ajouter un événement
- Retirer un événement
- Modifier un planning
- Détection des conflits
- Calendrier
- Historique

### Références

- FSPEC Planning
- TSPEC Planning
- UISPEC Explorer

---

# EPIC 06 — Recommendation

## Objectif

Construire le moteur de recommandations.

## Réalisation

- Calcul des recommandations
- Score de pertinence
- Préférences utilisateur
- Historique
- Explication des recommandations

### Références

- FSPEC Recommendation
- TSPEC Recommendation
- UISPEC Explorer

---

# EPIC 07 — Discovery

## Objectif

Permettre la découverte des événements.

## Réalisation

- Accueil
- Navigation
- Suggestions
- Filtres
- Cartographie
- Résultats

### Références

- FSPEC Discovery
- TSPEC Discovery
- UISPEC Explorer

---

# EPIC 08 — Notifications

## Objectif

Informer les utilisateurs des événements importants.

## Réalisation

- Notifications In-App
- Emails
- Push
- Préférences
- Historique

### Références

- FSPEC Notifications
- TSPEC Notifications
- UISPEC Explorer

---

# EPIC 09 — Search

## Objectif

Construire le moteur de recherche.

## Réalisation

- Indexation
- Recherche plein texte
- Filtres
- Facettes
- Tri
- Pagination
- Reconstruction des index

### Références

- FSPEC Search
- TSPEC Search
- UISPEC Explorer

---

# EPIC 10 — Explorer Portal

## Objectif

Construire l'expérience Explorer.

## Réalisation

### Écrans

- Accueil
- Recherche
- Résultats
- Fiche événement
- Planning
- Notifications
- Profil
- Paramètres

### Composants

- Navigation
- Event Card
- Planning Card
- Recommendation Card
- Search Bar
- Calendar

### Références

- UISPEC.01
- UISPEC.04
- UISPEC.05
- UISPEC.06
- UISPEC.07
- UISPEC.08

---

# EPIC 11 — Organizer Portal

## Objectif

Construire l'expérience Organizer.

## Réalisation

### Écrans

- Dashboard
- Mes événements
- Création
- Validation
- Publication
- Statistiques
- Profil
- Paramètres

### Composants

- Event Wizard
- Validation Panel
- Publication Status
- Dashboard Cards
- Statistics

### Références

- UISPEC.02
- UISPEC.04
- UISPEC.05
- UISPEC.06
- UISPEC.07
- UISPEC.08

---

# EPIC 12 — Operator Portal

## Objectif

Construire l'expérience Operator.

## Réalisation

### Écrans

- Dashboard
- Utilisateurs
- Organisateurs
- Référentiels
- Configuration
- Monitoring
- Journaux
- Profil
- Paramètres

### Composants

- Tables
- Dashboards
- Log Viewer
- Metrics
- Reference Editor

### Références

- UISPEC.03
- UISPEC.04
- UISPEC.05
- UISPEC.06
- UISPEC.07
- UISPEC.08

---

# EPIC 13 — Finalization

## Objectif

Préparer la plateforme pour la mise en production.

## Réalisation

### Qualité

- Tests unitaires
- Tests d'intégration
- Tests End-to-End
- Tests de performance

### Exploitation

- Images Docker
- Déploiement Kubernetes
- Sauvegardes
- Monitoring
- Observabilité
- Documentation
- Optimisations
- Revue sécurité

---

# MVP

Le MVP est atteint lorsque les EPIC suivantes sont terminées :

- EPIC 00 — Foundation
- EPIC 01 — Identity
- EPIC 02 — Reference Data
- EPIC 03 — Catalog
- EPIC 04 — Publishing
- EPIC 05 — Planning
- EPIC 07 — Discovery
- EPIC 09 — Search
- EPIC 10 — Explorer Portal
- EPIC 11 — Organizer Portal

Les fonctionnalités de recommandation, de notification et les outils avancés d'administration peuvent être livrés dans une version ultérieure.

---

# Hors périmètre

Les éléments suivants ne sont pas inclus dans cette feuille de route :

- Application mobile
- API publique
- Multi-tenant
- Intelligence artificielle générative
- Synchronisation avec des calendriers externes
- Paiement en ligne
- Fédération d'identité
- Mode hors ligne

---

# Documents liés

- 00-STRAT.*
- 01-FSPEC.*
- 02-ADR.*
- 03-TSPEC.*
- 04-UISPEC.*

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première feuille de route de développement alignée sur les spécifications STRAT, FSPEC, ADR, TSPEC et UISPEC. |