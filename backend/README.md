# @event-foundry/backend

API REST et orchestration EventFoundry (NestJS). **Orchestre** le pipeline sans jamais
exécuter l'OCR ni la classification (ARCHI.01, TSPEC.06).

## Structure cible par module (TSPEC.01)

```
src/
  main.ts
  app.module.ts
  <module>/
    <module>.module.ts
    controllers/   # REST, valide DTO -> Services (aucune logique métier)
    services/      # règles métier, orchestration, publie Jobs BullMQ (aucun SQL)
    repositories/  # encapsulent Prisma (seul accès PostgreSQL, étendent BaseRepository)
    entities/
    dto/           # Request + Response (les Entities ne sont jamais exposées)
    mappers/       # Entity <-> DTO
    validators/
    interfaces/
```

Modules V1 : `auth`, `users`, `reference-data`, `imports`, `event-candidates`,
`events`, `search`, `participation`, `calendar`.

## Démarrage

```bash
npm install                 # depuis la racine du monorepo
npm run infra:up            # PostgreSQL, Redis, MinIO
cp .env.example .env        # à la racine
npm run prisma:migrate --workspace @event-foundry/backend
npm run start:dev --workspace @event-foundry/backend
```

API préfixée `/api/v1`, documentation Swagger sur `/docs`.

## Authentification (EPIC 2)

RBAC par JWT. Guards globaux : `JwtAuthGuard` (authentifie, sauf routes `@Public()`) puis
`RolesGuard` (`@Roles(...)`).

| Méthode | Route | Accès | Rôle |
|---------|-------|-------|------|
| POST | `/api/v1/auth/register` | public | crée un compte (rôle USER) → jetons |
| POST | `/api/v1/auth/login` | public | e-mail + mot de passe → jetons |
| POST | `/api/v1/auth/refresh` | public | jeton de rafraîchissement → nouveaux jetons |
| GET | `/api/v1/users/me` | authentifié | profil courant |

Mots de passe hachés (bcrypt). Jetons d'accès et de rafraîchissement signés avec des
secrets distincts. Rôles système et admin de dev créés par `npm run prisma:seed`.

## Référentiels (EPIC 3)

CRUD des référentiels métier (`reference-data`). Lecture ouverte aux utilisateurs
authentifiés (valeurs actives par défaut, `?includeInactive=true` pour l'admin) ;
écritures réservées au rôle **ADMIN**. La suppression (`DELETE`) est une désactivation
logique (`is_active = false`).

| Ressource | Routes |
|-----------|--------|
| Domains | `GET/POST /domains`, `PUT/DELETE /domains/{id}` |
| Activities | `GET/POST /activities` (`?domainId=`), `PUT/DELETE /activities/{id}` |
| EventTypes | `GET/POST /event-types` (`?activityId=`), `PUT/DELETE /event-types/{id}` |
| EventFormats | `GET/POST /event-formats` (`?activityId=`), `PUT/DELETE /event-formats/{id}` |
| Organizers | `GET/POST /organizers`, `PUT/DELETE /organizers/{id}` |
| Venues | `GET/POST /venues`, `PUT/DELETE /venues/{id}` |
| Alias | `GET/POST /activities/{activityId}/aliases`, `PUT/DELETE /aliases/{id}` |

Hiérarchie contrôlée par le Backend : une Activity appartient à un Domain, un
EventType/EventFormat à une Activity, un alias à une Activity (valeur unique).

## Acquisition / imports (EPIC 5)

Le Backend **orchestre** le pipeline sans exécuter l'OCR ni la classification (TSPEC.06).
Retour HTTP immédiat ; le traitement est asynchrone.

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/v1/imports` | Upload fichier (`multipart/form-data`, champ `file`) — PNG/JPEG/PDF |
| POST | `/api/v1/imports/text` | Import d'un texte brut (`{ "text": "..." }`) |
| GET | `/api/v1/imports` | Liste paginée (`?skip=&take=`) |
| GET | `/api/v1/imports/{id}` | Détail (document, statut, texte OCR) |

Flux : document stocké dans MinIO → `Attachment` + `ImportJob` créés en transaction →
publication BullMQ. **Image** → `OCR_QUEUE`. **Texte** → pas d'OCR : un `OCRResult` de
substitution est publié directement sur `CLASSIFICATION_QUEUE` (FSPEC.01 RM-007).

Prérequis d'exécution : `npm run infra:up` (PostgreSQL, Redis, MinIO).

## Validation & Events (EPIC 8)

Le Backend consomme `RESULT_QUEUE` (`ClassificationResult`) : il crée l'`EventCandidate`
(PENDING) et passe l'`ImportJob` en `READY_FOR_VALIDATION`.

| Méthode | Route | Rôle |
|---------|-------|------|
| GET | `/api/v1/event-candidates` | Liste (`?status=&importJobId=&skip=&take=`) |
| GET | `/api/v1/imports/{id}/event-candidates` | Candidates d'un import |
| GET | `/api/v1/event-candidates/{id}` | Détail (payload, confidence, texte OCR) |
| PUT | `/api/v1/event-candidates/{id}` | Correction → statut CORRECTED |
| POST | `/api/v1/event-candidates/{id}/validate` | Crée l'Event (source=IMPORT) → VALIDATED |
| POST | `/api/v1/event-candidates/{id}/reject` | Rejet → REJECTED |
| POST | `/api/v1/events` | Création manuelle (source=MANUAL) |
| GET | `/api/v1/events/{id}` | Détail d'un Event |

Transitions contrôlées (un candidate VALIDATED/REJECTED est immuable). La validation crée
l'Event et fige le candidate **dans une transaction**. Le Domain est déduit de l'Activity.

> Nouvelle migration requise après cet EPIC : `npm run prisma:migrate --workspace
> @event-foundry/backend` (p. ex. `--name add_events_and_candidates`).

## Catalogue / recherche (EPIC 9)

`GET /api/v1/events` — recherche paginée, filtres cumulables (FSPEC.04) :

| Paramètre | Effet |
|-----------|-------|
| `activityId`, `eventTypeId`, `eventFormatId`, `organizerId`, `venueId` | filtres référentiels |
| `city` | ville du Venue (insensible à la casse) |
| `q` | plein texte (titre + description) |
| `period` | `today` · `this-week` · `this-month` · `next-7-days` · `next-30-days` |
| `from` / `to` | période personnalisée (ISO 8601) |
| `skip` / `take` | pagination (take ≤ 100) |

Réponse : `{ items, total, skip, take }`. Par défaut, événements à venir. Les Events
supprimés logiquement et les EventCandidate ne sont jamais retournés ; le Domain n'est
jamais un critère. `GET /api/v1/events/{id}` pour le détail.

> Prisma Client doit être généré avant le build : `npm run prisma:generate`. La première
> migration s'obtient avec `npm run prisma:migrate` (nommer p. ex. `init_auth`).
