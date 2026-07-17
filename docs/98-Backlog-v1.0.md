# EventFoundry - Product Backlog

**Document** : Backlog
**Fichier** : 98-Backlog-v1.0.md
**Version** : 1.0
**Statut** : Ready for Development

---

# Objectif

Découper le développement d'EventFoundry en incréments cohérents.

Les tâches sont organisées par Epic.

L'ordre proposé respecte les dépendances techniques.

---

# EPIC 1 — Initialisation du projet

## Infrastructure

- [x] Créer le monorepo
- [ ] Configurer Angular _(placeholder — initialisé à l'EPIC 11)_
- [x] Configurer NestJS
- [x] Configurer Prisma
- [x] Configurer PostgreSQL
- [x] Configurer Redis
- [x] Configurer BullMQ
- [x] Configurer MinIO
- [x] Configurer Docker Compose
- [x] Configurer Kubernetes _(base Kustomize ; manifests applicatifs à l'EPIC 15)_
- [x] Configurer CI/CD

---

## Shared

- [x] Créer `shared/contracts`
- [x] Créer `shared/libraries`
- [x] Créer les contrats de base
- [x] Configurer ESLint
- [x] Configurer Prettier

---

# EPIC 2 — Authentification

- [x] Utilisateur
- [x] JWT
- [x] Login
- [x] Refresh Token
- [x] Roles
- [x] Guards
- [x] Permissions _(RBAC par rôles ; permissions granulaires renvoyées en V2)_

> Socle de persistance introduit avec cet EPIC (anticipe l'EPIC 4) : `PrismaService`
> (accès unique), `BaseRepository`, modèles `User`/`Role`/`UserRole`, seed rôles + admin.

---

# EPIC 3 — Référentiels

## Domain

- [x] CRUD

## Activity

- [x] CRUD
- [x] Alias

## EventType

- [x] CRUD

## EventFormat

- [x] CRUD

## Venue

- [x] CRUD

## Organizer

- [x] CRUD

> Suppression logique via `is_active` (ARCHI.03/FSPEC.07). Lecture ouverte aux utilisateurs
> authentifiés (valeurs actives ; `?includeInactive=true` pour l'admin) ; écritures ADMIN.

---

# EPIC 4 — Persistance

- [ ] Prisma Schema
- [ ] Migrations
- [ ] Seed
- [ ] BaseRepository
- [ ] Repositories
- [ ] Transactions

---

# EPIC 5 — Acquisition

- [ ] Upload API
- [ ] Drag & Drop
- [ ] Validation formats
- [ ] MinIO
- [ ] Attachment
- [ ] ImportJob

---

# EPIC 6 — OCR

- [ ] OCR Worker
- [ ] Document Loader
- [ ] Image Processor
- [ ] OpenCV
- [ ] Tesseract
- [ ] OCRResult
- [ ] Retry
- [ ] Monitoring

---

# EPIC 7 — Expert System

- [ ] Rule Engine
- [ ] ClassificationContext
- [ ] DateRule
- [ ] TimeRule
- [ ] ActivityRule
- [ ] OrganizerRule
- [ ] VenueRule
- [ ] EventTypeRule
- [ ] EventFormatRule
- [ ] UrlRule
- [ ] PriceRule
- [ ] CapacityRule
- [ ] Confidence Engine
- [ ] Diagnostics
- [ ] ClassificationResult

---

# EPIC 8 — Validation

- [ ] EventCandidate
- [ ] Validation UI
- [ ] Corrections
- [ ] Création Event
- [ ] Historique

---

# EPIC 9 — Catalogue

- [ ] Recherche
- [ ] Filtres
- [ ] Détails
- [ ] Pagination

---

# EPIC 10 — Participations

- [ ] Interested
- [ ] Reservation
- [ ] Payment
- [ ] Calendar

---

# EPIC 11 — Frontend

- [ ] Layout
- [ ] Navigation
- [ ] Dashboard
- [ ] Acquisition
- [ ] Validation
- [ ] Catalogue
- [ ] Event
- [ ] Administration

---

# EPIC 12 — Administration

- [ ] Référentiels
- [ ] Utilisateurs
- [ ] Jobs
- [ ] Monitoring

---

# EPIC 13 — Observabilité

- [ ] Health Checks
- [ ] Logs
- [ ] Metrics
- [ ] CorrelationId
- [ ] Dashboard

---

# EPIC 14 — Tests

- [ ] Unitaires
- [ ] Intégration
- [ ] End-to-End
- [ ] Performance

---

# EPIC 15 — Déploiement

- [ ] Images Docker
- [ ] Helm Charts
- [ ] Kubernetes
- [ ] Sauvegardes
- [ ] Documentation

---

# MVP

Le MVP est atteint lorsque :

- Authentification
- Référentiels
- Acquisition
- OCR
- Classification
- Validation
- Catalogue
- Participations
- Calendrier

sont opérationnels.

---

# Hors périmètre V1

- Mobile
- IA générative
- Multi-tenant
- API publique
- Notifications
- Synchronisation calendriers externes
- Recommandations

---

# Historique

| Version | Description |
|----------|-------------|
| 1.0 | Première version prête pour le développement. |