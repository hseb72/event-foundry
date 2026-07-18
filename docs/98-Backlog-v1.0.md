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

- [x] Upload API
- [ ] Drag & Drop _(UI — EPIC 11 ; l'endpoint accepte déjà le fichier)_
- [x] Validation formats
- [x] MinIO
- [x] Attachment
- [x] ImportJob

> Backend : `POST /imports` (fichier) et `POST /imports/text`. Stockage MinIO, création
> Attachment + ImportJob en transaction, publication BullMQ (image → OCR_QUEUE ; texte →
> OCRResult de substitution sur CLASSIFICATION_QUEUE). Retour HTTP immédiat.

---

# EPIC 6 — OCR

- [x] OCR Worker
- [x] Document Loader
- [x] Image Processor _(abstraction + passthrough)_
- [ ] OpenCV _(prétraitement à implémenter derrière l'abstraction ImageProcessor)_
- [x] Tesseract
- [x] OCRResult
- [x] Retry _(BullMQ)_
- [x] Monitoring _(logs structurés : durée, confiance, correlationId)_

> Worker stateless, sans accès PostgreSQL (TSPEC.04) : consomme OCR_QUEUE, charge le
> document MinIO par clé déterministe, produit un OCRResult publié sur CLASSIFICATION_QUEUE.
> Pipeline interne par abstractions (ADR.07). Le prétraitement OpenCV reste à brancher.

---

# EPIC 7 — Expert System

- [x] Rule Engine
- [x] ClassificationContext
- [x] DateRule
- [x] TimeRule
- [x] ActivityRule
- [x] OrganizerRule
- [x] VenueRule
- [x] EventTypeRule
- [x] EventFormatRule
- [x] UrlRule
- [x] PriceRule
- [x] CapacityRule
- [x] Confidence Engine _(score par champ, calculé par chaque règle)_
- [x] Diagnostics
- [x] ClassificationResult

> Worker déterministe sans accès PostgreSQL (TSPEC.05, ADR.06) : chaîne de règles
> indépendantes et réordonnables sur un contexte (texte OCR + instantané des référentiels
> chargé via l'API Backend). Publie le ClassificationResult sur RESULT_QUEUE (consommé à
> l'EPIC 8). Domain jamais recherché : déduit de l'Activity côté Backend.

---

# EPIC 8 — Validation

- [x] EventCandidate
- [ ] Validation UI _(EPIC 11)_
- [x] Corrections
- [x] Création Event
- [x] Historique _(payload/confidence/correction conservés après validation ou rejet)_

> Backend : consommateur RESULT_QUEUE → EventCandidate (PENDING) + ImportJob
> READY_FOR_VALIDATION. Consultation/correction/validation/rejet ; la validation crée
> l'Event (source=IMPORT) et fige le candidate en transaction. Transitions contrôlées
> (VALIDATED/REJECTED immuables). Création manuelle d'Event (source=MANUAL) incluse.

---

# EPIC 9 — Catalogue

- [x] Recherche
- [x] Filtres
- [x] Détails
- [x] Pagination

> `GET /events` : filtres cumulables (Activity, EventType, EventFormat, Organizer, Venue,
> ville, texte libre) + presets temporels (today, this-week, this-month, next-7/30-days)
> ou période personnalisée. Événements à venir par défaut ; supprimés/candidates jamais
> retournés ; Domain jamais filtre. Le filtre « Mes événements » arrive à l'EPIC 10
> (dépend de UserParticipation).

---

# EPIC 10 — Participations

- [x] Interested
- [x] Reservation
- [x] Payment
- [x] Calendar

> `PUT /events/{id}/participation` : trois axes indépendants ; suppression automatique
> quand tout redevient neutre (l'Event quitte le calendrier mais reste en recherche).
> `GET /me/calendar` : Events ayant une participation (+ son état), fenêtre temporelle
> optionnelle, passés conservés. Filtre « Mes événements » (`?participation=mine|none`) et
> état de participation ajoutés aux résultats de recherche. Rendu couleur = UI (EPIC 11).

---

# EPIC 11 — Frontend

- [x] Layout _(shell + responsive, thème consommateur)_
- [x] Navigation _(routing + guard JWT + intercepteur)_
- [x] Dashboard _(tableau de bord Admin du pipeline, exploite import_job_events)_
- [x] Acquisition _(écran d'import fichier/texte)_
- [x] Validation _(UI de correction/validation des EventCandidate + création manuelle)_
- [x] Catalogue _(Découvrir : recherche, filtres, participation)_
- [x] Event _(fiche détaillée dédiée)_
- [x] Administration _(CRUD des référentiels, réservé ADMIN)_

> **EPIC 11 terminé.** Fondation Angular 21 standalone **buildable** : couche API typée,
> auth, layout, parcours consommateur complet (login, Découvrir, fiche Event, participation,
> Mon planning, Importer) et parcours de contenu (création manuelle d'Events, validation/
> correction/rejet des EventCandidate). Surfaces admin réservées ADMIN (garde de route +
> décodage du rôle JWT) : administration des 6 référentiels (CRUD générique) et tableau de
> bord du pipeline d'import (volumes, passages entre états via `import_job_events`, durées),
> servi par `GET /admin/import-stats`. Reste hors EPIC 11 : le refresh token (transverse).

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