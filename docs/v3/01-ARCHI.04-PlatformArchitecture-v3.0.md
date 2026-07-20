# Architecture de la plateforme

**Document** : ARCHI.04

**Fichier** : 01-ARCHI.04-PlatformArchitecture-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire l'architecture physique de la plateforme EventFoundry.

Ce document présente les composants techniques majeurs, leurs responsabilités et leurs interactions.

Les choix d'implémentation détaillés sont décrits dans les TSPEC.

---

# Principes

L'architecture repose sur quatre objectifs.

- modularité ;
- extensibilité ;
- résilience ;
- observabilité.

---

# Vue générale

```
                        Internet
                             │
                    Reverse Proxy / Ingress
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
   Frontend Angular                         REST API
                                                │
                                      Application Services
                                                │
                     ┌───────────────┬───────────────┬───────────────┐
                     │               │               │               │
                Identity         Catalogue      Planning        Import
                     │               │               │               │
                     └───────────────┴───────────────┴───────────────┘
                                                │
                                          Event Bus
                                                │
                 ┌──────────────┬──────────────┬──────────────┐
                 │              │              │              │
           Notifications    Connectors    Monitoring     Scheduler
                                                │
                                  PostgreSQL / Redis / MinIO
```

---

# Frontend

Le frontend est développé en Angular.

Il présente trois expériences :

- Explorer
- Organizer
- Operator

Les composants communs sont mutualisés.

Les fonctionnalités restent isolées par domaine.

---

# Backend

Le backend est développé avec NestJS.

Chaque domaine est implémenté comme un module indépendant.

Les modules communiquent par :

- services ;
- événements métier ;
- interfaces.

---

# Base de données

PostgreSQL constitue la base de données principale.

Elle stocke :

- données métier ;
- historique ;
- configuration.

Les migrations sont versionnées.

---

# Redis

Redis est utilisé pour :

- cache ;
- files BullMQ ;
- traitements asynchrones.

Aucune donnée métier permanente n'est stockée dans Redis.

---

# MinIO

MinIO stocke :

- médias ;
- imports ;
- documents ;
- archives.

Les objets sont référencés par le domaine métier.

---

# BullMQ

BullMQ orchestre les traitements asynchrones.

Exemples :

- imports ;
- OCR ;
- notifications ;
- traitements différés.

---

# Connecteurs

Chaque connecteur est un module indépendant.

Il peut être :

- planifié ;
- déclenché manuellement ;
- appelé par API.

Les connecteurs ne communiquent jamais directement entre eux.

---

# Event Bus

Les événements métier permettent le découplage des domaines.

Exemples :

- ImportCompleted
- EventPublished
- ParticipationChanged
- NotificationRequested

---

# Observabilité

Chaque composant publie :

- logs ;
- métriques ;
- traces.

Les traitements critiques produisent également :

- statistiques ;
- rapports d'exécution ;
- historique.

---

# Configuration

La configuration est centralisée.

Elle distingue :

- paramètres système ;
- paramètres organisation ;
- paramètres utilisateur.

---

# Sécurité

Les secrets applicatifs sont externalisés.

Ils ne sont jamais versionnés.

Ils sont injectés au déploiement.

---

# Déploiement

La plateforme est conçue pour Kubernetes.

Chaque composant peut être répliqué indépendamment.

Les traitements asynchrones peuvent être répartis sur plusieurs workers.

---

# Évolutivité

L'ajout d'un nouveau connecteur ne nécessite :

- aucune modification du domaine ;
- aucune modification du frontend ;
- aucune modification des autres connecteurs.

---

# Documents liés

ARCHI.01

ARCHI.02

ARCHI.03

TSPEC.*

ADR.*

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première description de l'architecture physique de la plateforme. |