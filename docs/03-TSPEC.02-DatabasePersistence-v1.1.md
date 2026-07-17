# Base de données & Persistance

**Document** : TSPEC.02  
**Fichier** : 03-TSPEC.02-DatabasePersistence-v1.1.md  
**Version** : 1.1  
**Statut** : Validé

---

# Objectif

Définir la stratégie de persistance des données d'EventFoundry.

Cette spécification décrit :

- PostgreSQL ;
- Prisma ORM ;
- les migrations ;
- les conventions de modélisation ;
- les transactions ;
- les index ;
- l'organisation de la couche de persistance.

Elle ne décrit pas le modèle métier (ARCHI.03).

---

# Technologies

| Élément | Choix |
|----------|--------|
| Base de données | PostgreSQL |
| ORM | Prisma |
| Langage | TypeScript |
| Migration | Prisma Migrate |
| Client | Prisma Client |

---

# Principes

La base PostgreSQL constitue l'unique source de vérité.

Toutes les opérations de lecture et d'écriture transitent exclusivement par Prisma.

Prisma est encapsulé dans les Repositories.

Aucun Service, Controller ou Worker ne dépend directement de Prisma Client.

Les migrations constituent l'historique officiel du schéma.

---

# Organisation du dépôt

```text
event-foundry/

backend/
    prisma/
        schema.prisma
        migrations/
        seed.ts

shared/
    contracts/

frontend/

ocr-worker/

classifier-worker/
```

Le répertoire `shared/contracts` est indépendant de la couche de persistance.

Il contient uniquement les contrats d'échange entre composants.

---

# Organisation Prisma

```text
backend/

prisma/

schema.prisma

migrations/

seed.ts
```

Le fichier `schema.prisma` constitue la référence unique du modèle de données.

---

# Prisma Schema

Le fichier `schema.prisma` décrit :

- les modèles ;
- les relations ;
- les contraintes ;
- les index ;
- les énumérations.

Toute évolution du modèle passe par une migration.

---

# Nommage

## Tables

Pluralisées.

Exemple :

```text
users

events

activities

venues
```

---

## Colonnes SQL

snake_case

Exemple :

```text
created_at

updated_at

started_at

finished_at
```

---

## Modèles Prisma

PascalCase.

Exemple :

```text
User

Event

ImportJob
```

---

## Champs Prisma

camelCase.

Exemple :

```text
createdAt

updatedAt

startedAt
```

Le mapping SQL est réalisé via `@map`.

---

# Clés primaires

Toutes les tables utilisent :

```text
UUID
```

Les UUID sont générés côté application.

Aucune clé auto-incrémentée n'est utilisée.

---

# Dates

Toutes les dates sont stockées en UTC.

Type PostgreSQL :

```text
timestamp with time zone
```

Les conversions de fuseau horaire sont réalisées uniquement dans l'API ou le Frontend.

---

# Audit

Toutes les tables métier possèdent :

```text
created_at

updated_at
```

Lorsque pertinent :

```text
created_by

updated_by
```

Les dates sont maintenues automatiquement.

---

# Suppression logique

Deux mécanismes existent.

## Soft Delete

Utilisé pour les données métier.

Champ :

```text
deleted_at
```

Concerné :

- Event

---

## Désactivation

Utilisée pour les référentiels.

Champ :

```text
is_active
```

Concerné :

- Domain
- Activity
- EventType
- EventFormat
- Organizer
- Venue

---

# Relations

Toutes les relations sont explicites.

Les suppressions en cascade sont limitées aux données techniques.

Les données métier utilisent principalement :

```text
RESTRICT
```

afin d'éviter les suppressions accidentelles.

---

# Repositories

Chaque module possède son Repository.

Exemple :

```text
EventRepository

ActivityRepository

VenueRepository

ImportRepository
```

Les Repositories encapsulent entièrement Prisma.

Ils représentent l'unique point d'accès aux données.

---

# BaseRepository

Tous les Repositories héritent d'une classe abstraite commune.

Responsabilités :

- findById()
- findAll()
- create()
- update()
- delete()

Les Repositories spécialisés ajoutent uniquement leurs requêtes métier.

Cette classe ne contient aucune logique métier.

---

# Transactions

Les transactions Prisma sont utilisées uniquement lorsque plusieurs écritures doivent rester cohérentes.

Exemples :

- validation d'un EventCandidate ;
- création d'un Event ;
- création d'une UserParticipation ;
- fusion de données.

Les traitements OCR et Classification sont toujours hors transaction.

---

# Contraintes SQL

Les contraintes structurelles sont implémentées dans PostgreSQL.

Exemples :

- clés étrangères ;
- unicité des alias ;
- unicité (user_id, event_id) ;
- champs obligatoires.

Les validations métier restent implémentées dans les Services.

---

# Index

Les index sont définis dans Prisma.

## Events

- starts_at
- venue_id
- organizer_id
- activity_id
- source

---

## EventCandidates

- status
- created_at

---

## ImportJobs

- status
- created_at

---

## Attachments

- checksum

---

## UserParticipation

- user_id
- event_id

Contrainte :

```text
UNIQUE(user_id, event_id)
```

---

# Seed

Le fichier :

```text
seed.ts
```

initialise uniquement :

- Domain ;
- Activity ;
- EventType ;
- EventFormat ;
- rôles système ;
- administrateur de développement.

Aucune donnée fonctionnelle n'est créée.

---

# Performances

Les principes suivants s'appliquent :

- sélectionner uniquement les colonnes nécessaires ;
- utiliser la pagination ;
- limiter les relations chargées ;
- éviter les requêtes N+1.

---

# Versionnement

Le fichier :

```text
schema.prisma
```

constitue la référence officielle du schéma.

Toutes les migrations sont versionnées dans Git.

Une migration appliquée n'est jamais modifiée.

---

# Sauvegardes

Les sauvegardes PostgreSQL sont réalisées indépendamment de l'application.

Le Backend ne contient aucune logique de sauvegarde.

---

# Tests

Chaque Repository possède :

- tests unitaires (Prisma mocké) ;
- tests d'intégration (PostgreSQL réel).

Les migrations sont exécutées automatiquement dans la CI.

---

# Dépendances interdites

Les Controllers, Services et Workers ne doivent jamais dépendre directement de Prisma Client.

Prisma est réservé exclusivement aux Repositories.

---

# Critères d'acceptation

CA-001

Toutes les opérations de persistance transitent par Prisma.

---

CA-002

Aucun Service n'utilise directement Prisma Client.

---

CA-003

Tous les Repositories héritent de BaseRepository.

---

CA-004

Toutes les évolutions du schéma passent par Prisma Migrate.

---

CA-005

Les suppressions métier utilisent Soft Delete ou `is_active`.

---

CA-006

Toutes les relations sont protégées par des contraintes SQL.

---

CA-007

Les migrations sont entièrement reproductibles sur une base vierge.

---

# Décisions techniques

## Base de données

PostgreSQL

---

## ORM

Prisma

---

## Migrations

Prisma Migrate

---

## Client

Prisma Client

---

## Clés

UUID

---

## Fuseau horaire

UTC

---

# Documents liés

ARCHI.03

ARCHI.04

TSPEC.01

TSPEC.03

ADR — Prisma

ADR — Shared Contracts

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction avec adoption de Prisma. |
| 0.2 | Encapsulation complète de Prisma dans les Repositories, ajout de BaseRepository, intégration de l'organisation `shared/contracts` et clarification des responsabilités de la couche de persistance. |
| 1.0 | Spécification validée pour la V1. |
| 1.1 | Organizer/Venue rattachés à `is_active` (référentiels) au lieu de `deleted_at`, pour cohérence avec ARCHI.03 et FSPEC.07. |
