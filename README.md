# EventFoundry

Transformer des annonces d'événements (image ou texte) en événements structurés,
consultables dans un calendrier personnel. Cible V1 : communautés TCG (Magic, Pokémon,
Lorcana, One Piece, Star Wars Unlimited, Flesh and Blood, Riftbound), avec une architecture
générique ouverte à d'autres domaines (musique, sport, culture) sans changement du modèle
métier.

> La **documentation `docs/` fait autorité**. Les règles de développement sont résumées
> dans [`CLAUDE.md`](./CLAUDE.md).

## Les trois fonctions

1. **Import** — image ou texte.
2. **Structuration** — OCR (Tesseract) → moteur expert déterministe (règles + référentiels,
   **aucune IA**) → `EventCandidate` validés par l'utilisateur.
3. **Consultation** — Découverte des événements + Mon calendrier.

## Architecture

```
Frontend (Angular) → Backend (NestJS, orchestre)
                          ├── PostgreSQL (source de vérité)
                          ├── MinIO (fichiers)
                          └── Redis / BullMQ
                                  ├── OCR Worker         (Tesseract + OpenCV)
                                  └── Classifier Worker  (moteur de règles)
```

Pipeline asynchrone : `ImportRequest → OCRResult → ClassificationResult → EventCandidate
→ validation → Event`. Échanges inter-composants via `shared/contracts` uniquement.

## Structure du monorepo

| Dossier | Rôle |
|---------|------|
| `backend/` | API REST + orchestration (NestJS) |
| `frontend/` | Angular — portails Explorer / Organizer / Operator |
| `ocr-worker/` | Worker OCR |
| `classifier-worker/` | Worker de classification experte |
| `shared/contracts/` | Contrats d'échange partagés (ADR.03) |
| `shared/libraries/` | Utilitaires transverses partagés (sans logique métier) |
| `docker/` | Environnement de dev (PostgreSQL, Redis, MinIO) |
| `k8s/` | Déploiement Kubernetes |
| `scripts/` | Outillage |
| `docs/` | Documentation (référence contractuelle) |

## Démarrage rapide

```bash
# Prérequis : Node >= 22, Docker
cp .env.example .env
npm install                 # npm workspaces
npm run infra:up            # PostgreSQL + Redis + MinIO
npm run shared:build        # build de @event-foundry/contracts et /libraries

# Backend + les deux workers en une commande (process séparés, lancés ensemble) :
npm run dev                 # backend + ocr-worker + classifier-worker
npm run dev:all             # idem + frontend Angular
```

### Tests

```bash
npm test                    # tests unitaires (tous les workspaces, Prisma mocké)

# Tests d'intégration + E2E : nécessitent PostgreSQL + Redis (npm run infra:up)
npm run infra:up
npm run prisma:migrate:deploy --workspace @event-foundry/backend
npm run test:int --workspace @event-foundry/backend   # repositories sur base réelle
npm run test:e2e --workspace @event-foundry/backend   # API réelle (supertest), MinIO stubbé
```

> Les tests DB (`backend/test/*.int-spec.ts`, `*.e2e-spec.ts`) tournent en série
> (`--runInBand`) sur la base de dev. La CI les exécute automatiquement.

> `dev`/`dev:all` co-lancent des **process indépendants** via `concurrently` : les workers
> restent stateless et répliquables (ADR.04, règle d'or 4), ils ne sont pas embarqués dans
> le process backend. Chaque composant peut aussi être lancé seul avec `npm run start:dev
> --workspace <composant>`.

## Stack (une techno par responsabilité — ADR.04)

Angular · NestJS · Prisma · PostgreSQL · BullMQ · Redis · MinIO · Tesseract · OpenCV ·
Docker / Kubernetes.

## Intégration continue (CI)

Le workflow `.github/workflows/ci.yml` (lint · build · test) s'exécute sur un **runner
self-hosted enregistré au niveau du dépôt** (`runs-on: [self-hosted]`).

Prérequis sur la machine du runner : Node.js accessible via `actions/setup-node`, un
toolchain C/C++ (compilation native de `bcrypt`), Git. Le client Prisma est généré pendant
le job (`prisma generate`, sans base de données requise).

Enregistrement : Settings → Actions → Runners → *New self-hosted runner*. Un runner de
dépôt ne sert que ce dépôt ; pour mutualiser une seule machine sur plusieurs dépôts sans
la dupliquer, préférer un runner d'**organisation**.

## Documentation

- `docs/00-vision-*` — vision produit
- `docs/01-ARCHI.*` — architecture (contractuel)
- `docs/02-FSPEC.*` — spécifications fonctionnelles (V1)
- `docs/03-TSPEC.*` — spécifications techniques
- `docs/99-ADR.*` — décisions d'architecture
- `docs/98-Backlog-*` — découpage en EPICs

## État

**Développement V2 en cours.** Les EPICs **00 à 12 sont livrés** (MVP atteint, plus les
EPICs hors MVP Recommendation, Notifications et Operator Portal) ; l'EPIC 13 (finalisation)
couvre la qualité et la documentation. Domaines livrés : Identity/RBAC, Reference Data,
Catalog, Publishing, Planning, Discovery, Search (plein texte PostgreSQL), Recommendation
(moteur déterministe), Notifications (multi-canal), et les trois portails Explorer /
Organizer / Operator (Angular).

Le suivi détaillé (statut par EPIC, domaines, couverture de tests, points d'exploitation
restants) est tenu dans [`docs/v2/05-RMAP.01-DeliveryStatus-v2.0.md`](./docs/v2/05-RMAP.01-DeliveryStatus-v2.0.md).
