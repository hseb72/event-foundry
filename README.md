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
| `frontend/` | Angular (placeholder, EPIC 11) |
| `ocr-worker/` | Worker OCR |
| `classifier-worker/` | Worker de classification experte |
| `shared/contracts/` | Contrats d'échange partagés (ADR.03) |
| `docker/` | Environnement de dev (PostgreSQL, Redis, MinIO) |
| `k8s/` | Déploiement Kubernetes |
| `scripts/` | Outillage |
| `docs/` | Documentation (référence contractuelle) |

## Démarrage rapide

```bash
# Prérequis : Node >= 20, Docker
cp .env.example .env
npm install                 # npm workspaces
npm run infra:up            # PostgreSQL + Redis + MinIO
npm run contracts:build     # build de @event-foundry/contracts
npm run start:dev --workspace @event-foundry/backend
```

## Stack (une techno par responsabilité — ADR.04)

Angular · NestJS · Prisma · PostgreSQL · BullMQ · Redis · MinIO · Tesseract · OpenCV ·
Docker / Kubernetes.

## Documentation

- `docs/00-vision-*` — vision produit
- `docs/01-ARCHI.*` — architecture (contractuel)
- `docs/02-FSPEC.*` — spécifications fonctionnelles (V1)
- `docs/03-TSPEC.*` — spécifications techniques
- `docs/99-ADR.*` — décisions d'architecture
- `docs/98-Backlog-*` — découpage en EPICs

## État

Documentation VISION/ARCHI/FSPEC/TSPEC validée (V1). Monorepo initialisé (EPIC 1) :
outillage, `shared/contracts`, environnement Docker et squelettes des composants.
Développement à venir selon l'ordre du Backlog.
