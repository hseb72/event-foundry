# Architecture Overview

**Document** : ARCHI.OVERVIEW

**Fichier** : 01-ARCHI.00-ArchitectureOverview-v2.0.md

**Version** : 2.0

**Statut** : Référence

---

# Objectif

Présenter une vue d'ensemble de l'architecture fonctionnelle d'EventFoundry V2.

Ce document constitue le point d'entrée de la documentation technique.

---

# Vision

EventFoundry est un assistant culturel personnel.

Le catalogue constitue une ressource documentaire commune.

Le planning constitue le principal produit proposé à l'utilisateur.

---

# Architecture fonctionnelle

Le fonctionnement général de la plateforme est organisé autour de cinq domaines.

```text
               Publication
                    │
                    ▼
                Catalogue
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Discovery   Recommendation  Planning
                    │            │
                    └─────┬──────┘
                          ▼
                    Notifications
```

Chaque domaine possède une responsabilité clairement définie.

---

# Les expériences

La plateforme propose trois expériences utilisateur.

```text
                Identity
                    │
              +-----+------+
              |            |
             Roles    Permissions
                    │
              Experience
                    │
     +--------------+--------------+
     |              |              |
 Explorer      Organizer      Operator
```

Une même identité peut accéder à plusieurs expériences.

Le changement d'expérience ne modifie ni l'authentification ni les permissions.

---

# Les domaines fonctionnels

## Publication

Création et gestion des événements.

---

## Catalogue

Patrimoine culturel partagé de la plateforme.

---

## Discovery

Recherche et exploration des événements.

---

## Recommendation Engine

Sélection personnalisée d'événements.

---

## Planning

Organisation personnelle des activités culturelles.

---

## Notifications

Communication des informations pertinentes à l'utilisateur.

---

# Flux principal

Le cycle de vie d'un événement suit les étapes suivantes.

```text
Publication

↓

Qualification

↓

Catalogue

↓

Recommendation

↓

Planning

↓

Participation
```

Discovery permet à tout moment d'accéder directement au catalogue.

---

# Principes d'architecture

La V2 repose sur les principes suivants :

- une identité unique par utilisateur ;
- une séparation claire entre identité, rôles, permissions et expériences ;
- un moteur de recommandation déterministe ;
- un catalogue partagé par l'ensemble des services ;
- un planning personnel comme cœur de l'expérience utilisateur ;
- des responsabilités clairement séparées entre les domaines.

---

# Documents de référence

## Strategy

- Product Vision
- Personas
- User Experiences

## Functional Specifications

- Planning
- Recommendation Engine
- Discovery
- Publishing
- Notifications
- Profiles & Permissions
- Catalog

## Architecture Decision Records

- ADR.08 RBAC
- ADR.09 Deterministic Recommendation Engine
- ADR.10 Multi Experience Platform
- ADR.11 Identity / Roles / Experiences / Subscriptions

---

# Lecture recommandée

Pour découvrir la plateforme :

1. Product Vision
2. Architecture Overview
3. User Experiences
4. Planning
5. Recommendation Engine

Pour comprendre l'architecture :

1. Architecture Overview
2. ADR.08
3. ADR.09
4. ADR.10
5. ADR.11

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première vue d'ensemble de l'architecture fonctionnelle EventFoundry V2. |