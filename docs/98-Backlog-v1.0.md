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

- [ ] Créer le monorepo
- [ ] Configurer Angular
- [ ] Configurer NestJS
- [ ] Configurer Prisma
- [ ] Configurer PostgreSQL
- [ ] Configurer Redis
- [ ] Configurer BullMQ
- [ ] Configurer MinIO
- [ ] Configurer Docker Compose
- [ ] Configurer Kubernetes
- [ ] Configurer CI/CD

---

## Shared

- [ ] Créer `shared/contracts`
- [ ] Créer `shared/libraries`
- [ ] Créer les contrats de base
- [ ] Configurer ESLint
- [ ] Configurer Prettier

---

# EPIC 2 — Authentification

- [ ] Utilisateur
- [ ] JWT
- [ ] Login
- [ ] Refresh Token
- [ ] Roles
- [ ] Guards
- [ ] Permissions

---

# EPIC 3 — Référentiels

## Domain

- [ ] CRUD

## Activity

- [ ] CRUD
- [ ] Alias

## EventType

- [ ] CRUD

## EventFormat

- [ ] CRUD

## Venue

- [ ] CRUD

## Organizer

- [ ] CRUD

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