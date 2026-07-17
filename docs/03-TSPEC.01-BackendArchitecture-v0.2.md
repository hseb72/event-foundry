# Architecture Backend

**Document** : TSPEC.01  
**Fichier** : 03-TSPEC.01-BackendArchitecture-v0.2.md  
**Version** : 0.2  
**Statut** : Draft

---

# Objectif

Définir l'architecture technique du backend EventFoundry.

Cette spécification décrit :

- l'organisation du dépôt ;
- l'organisation des modules NestJS ;
- les responsabilités de chaque composant ;
- les conventions de développement.

Elle ne décrit pas les algorithmes OCR ou de classification.

---

# Principes

Le backend respecte les principes suivants :

- architecture modulaire ;
- responsabilité unique ;
- séparation métier / infrastructure ;
- services stateless ;
- PostgreSQL comme source de vérité ;
- communication REST synchrone ;
- traitements lourds asynchrones via BullMQ ;
- contrats fortement typés entre les composants.

---

# Architecture générale

```text
                Angular

                    │

             REST API (/api/v1)

                    │

              Backend NestJS

          ┌─────────┼──────────┐

          │         │          │

     PostgreSQL   Redis      MinIO

                    │

               BullMQ Jobs

          ┌─────────┴──────────┐

          │                    │

      OCR Worker        Classifier Worker
```

---

# Monorepo

```text
event-foundry/

backend/

frontend/

ocr-worker/

classifier-worker/

shared/
    contracts/

docs/

docker/

k8s/

scripts/
```

Chaque composant est versionné dans le même dépôt Git.

La bibliothèque `shared/contracts` contient tous les contrats d'échange entre composants.

---

# Backend

```text
backend/

src/

main.ts

app.module.ts
```

---

# Modules

Chaque capacité métier possède son propre module.

```text
auth/

imports/

event-candidates/

events/

calendar/

participation/

reference-data/

search/

users/
```

Chaque module est indépendant.

Les échanges entre modules passent exclusivement par des interfaces de services.

---

# Structure d'un module

```text
events/

events.module.ts

controllers/

services/

repositories/

entities/

dto/

mappers/

validators/

interfaces/
```

Tous les modules respectent cette organisation.

---

# Controllers

Responsabilités :

- recevoir les requêtes REST ;
- valider les DTO ;
- appeler les Services.

Les Controllers ne contiennent jamais de logique métier.

---

# Services

Les Services implémentent les règles métier.

Ils :

- orchestrent les traitements ;
- utilisent les Repositories ;
- publient les Jobs BullMQ.

Ils ne réalisent jamais :

- d'accès SQL ;
- de traitement HTTP.

---

# Repositories

Les Repositories encapsulent totalement Prisma.

Ils constituent l'unique point d'accès à PostgreSQL.

Les Services n'utilisent jamais directement Prisma Client.

Une `BaseRepository` fournit les opérations communes :

- findById
- findAll
- create
- update
- delete

Chaque Repository métier étend cette base et ajoute uniquement les requêtes spécifiques.

---

# DTO

Deux familles de DTO existent :

Request

```text
CreateEventDto

UpdateEventDto
```

Response

```text
EventResponseDto

ImportResponseDto
```

Les Entities ne sont jamais exposées.

---

# Entities

Les Entities représentent le modèle persistant.

Elles restent confinées à la couche Repository.

---

# Mappers

Les Mappers réalisent toutes les conversions :

- Entity → DTO
- DTO → Entity

Aucune conversion n'est réalisée ailleurs.

---

# Validators

Chaque module possède ses propres validateurs.

Exemples :

```text
ActivityValidator

ParticipationValidator

ImportValidator
```

---

# Interfaces

Les interfaces définissent les contrats internes entre modules.

Les modules ne dépendent jamais d'implémentations concrètes.

---

# Contrats inter-composants

Tous les échanges entre composants indépendants utilisent des contrats partagés.

Ces contrats sont définis dans :

```text
shared/contracts/
```

Exemples :

```text
OCRResult

ClassificationResult

ImportRequest

ImportCompleted

EventValidated
```

Aucun composant ne dépend des objets internes d'un autre composant.

---

# Pipeline Import

Le Backend orchestre uniquement le pipeline.

```text
Acquisition

↓

Attachment

↓

ImportJob

↓

BullMQ

↓

OCR Worker

↓

Classifier Worker

↓

EventCandidate
```

---

# BullMQ

Le Backend publie uniquement des Jobs.

Deux files existent :

```text
OCR_QUEUE

CLASSIFICATION_QUEUE
```

Le Backend ne réalise jamais :

- OCR ;
- Classification.

---

# Transactions

Une transaction PostgreSQL est ouverte uniquement pour :

- création d'un Event ;
- validation d'un EventCandidate ;
- création d'un ImportJob.

Les traitements BullMQ sont toujours hors transaction.

---

# Gestion des erreurs

Les erreurs métier utilisent des exceptions explicites.

Exemples :

```text
ActivityNotFoundException

EventAlreadyExistsException

InvalidEventTypeException
```

Les exceptions génériques sont interdites.

---

# Logging

Chaque requête possède un CorrelationId.

Ce CorrelationId est propagé jusqu'aux Workers.

---

# Tests

Chaque module possède :

- tests unitaires ;
- tests d'intégration.

Les tests End-to-End sont regroupés dans un projet dédié.

---

# Dépendances interdites

Le Backend ne dépend jamais :

- d'Angular ;
- de Tesseract ;
- d'OpenCV ;
- d'un LLM ;
- d'une API Cloud OCR.

Ces dépendances appartiennent exclusivement aux Workers.

---

# Critères d'acceptation

CA-001

Chaque capacité métier possède son propre module.

---

CA-002

Les Controllers ne contiennent aucune logique métier.

---

CA-003

Les Services ne réalisent aucun accès SQL.

---

CA-004

Les Repositories encapsulent totalement Prisma.

---

CA-005

Les Workers sont totalement indépendants du Backend.

---

CA-006

Le Backend reste entièrement stateless.

---

CA-007

Tous les échanges entre composants utilisent exclusivement les contrats définis dans `shared/contracts`.

---

# Décisions techniques

## Framework

NestJS

---

## Langage

TypeScript

---

## ORM

Prisma

---

## Validation

class-validator

class-transformer

---

## Authentification

JWT

---

## Documentation API

OpenAPI / Swagger

---

# Documents liés

ARCHI.01

ARCHI.03

ARCHI.04

TSPEC.02

TSPEC.03

ADR — Shared Contracts

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 0.2 | Ajout de `shared/contracts`, BaseRepository, encapsulation complète de Prisma et contrats typés entre composants. |