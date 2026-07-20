# Architecture générale

**Document** : ARCHI.02

**Fichier** : 01-ARCHI.02-Architecture-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire l'architecture générale de la plateforme EventFoundry.

Ce document présente les principaux composants de la plateforme, leurs responsabilités et leurs interactions.

Les choix détaillés sont documentés dans les ADR.

---

# Principes

L'architecture poursuit cinq objectifs.

- simplicité ;
- extensibilité ;
- traçabilité ;
- déterminisme ;
- observabilité.

---

# Vue générale

La plateforme est organisée autour de six couches.

```
                        Explorer

                        Organizer

                        Operator

──────────────────────────────────────────

                 REST API

──────────────────────────────────────────

            Functional Services

──────────────────────────────────────────

              Domain Model

──────────────────────────────────────────

           Connector Framework

──────────────────────────────────────────

 Infrastructure
 PostgreSQL
 Redis
 MinIO
 BullMQ
 Kubernetes
```

---

# Les expériences

Les trois expériences restent totalement indépendantes.

Explorer

Organizer

Operator

Chaque expérience possède :

- ses écrans ;
- ses permissions ;
- ses parcours.

---

# Le domaine

Le domaine reste indépendant :

- de la base de données ;
- des APIs ;
- des connecteurs ;
- des interfaces.

Il représente le cœur métier.

---

# Les connecteurs

Toute source externe est intégrée au travers d'un connecteur.

Exemples :

- Discord
- Tourism System
- CSV
- JSON
- Image
- PDF

Tous les connecteurs implémentent la même interface.

Ils ne contiennent aucune logique métier.

---

# Pipeline d'import

Chaque import suit exactement le même cycle.

```
Découverte

↓

Lecture

↓

Extraction

↓

Raw Event

↓

Validation

↓

Normalisation

↓

Imported Event

↓

Persistance
```

Chaque étape possède une responsabilité unique.

---

# Normalisation

La normalisation transforme les données spécifiques à un fournisseur vers le modèle commun EventFoundry.

Elle réalise notamment :

- coordonnées ;
- adresses ;
- téléphones ;
- catégories ;
- dates ;
- médias.

---

# Notifications

Les notifications sont découplées du domaine métier.

Les événements métier publient des événements internes.

Le moteur de notifications décide :

- qui notifier ;
- quand notifier ;
- comment notifier.

---

# IA

L'IA est considérée comme un fournisseur externe.

Elle peut être utilisée uniquement pour :

- OCR ;
- extraction ;
- résumé ;
- génération.

Elle ne participe jamais aux décisions métier.

---

# Observabilité

Chaque traitement produit :

- logs ;
- métriques ;
- traces ;
- statistiques.

L'objectif est de pouvoir expliquer tout comportement de la plateforme.

---

# Sécurité

Les secrets :

- ne sont jamais stockés en clair ;
- sont chiffrés ;
- restent séparés des données métier.

---

# Extensibilité

Toute nouvelle fonctionnalité doit pouvoir être ajoutée :

sans modifier

- le domaine ;
- les autres connecteurs ;
- les APIs existantes.

---

# Principes de conception

Les développements futurs devront respecter :

- séparation des responsabilités ;
- responsabilité unique ;
- déterminisme métier ;
- architecture orientée événements ;
- configuration plutôt que duplication.

---

# Documents liés

ARCHI.01

ARCHI.03

ADR.*

TSPEC.*

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première architecture générale de la plateforme V3. |