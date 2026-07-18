# CLAUDE.md — Guide de développement EventFoundry

Ce fichier fait autorité pour tout développement dans ce dépôt. Il est dérivé de la
documentation `docs/` (VISION, ARCHI, FSPEC, TSPEC, ADR). **En cas de doute, la
documentation prime, et une évolution de périmètre passe d'abord par la doc.**

---

## 1. Produit en une phrase

Transformer une annonce d'événement (image ou texte) en un `Event` structuré,
consultable dans un calendrier personnel. Cible V1 : communautés TCG (Magic, Pokémon,
Lorcana, One Piece, Star Wars Unlimited, Flesh and Blood, Riftbound), architecture
générique pour d'autres domaines sans changement du modèle métier.

---

## 2. Règles d'or (non négociables)

1. **Aucune décision métier basée sur un LLM / IA générative.** La classification est
   100 % déterministe : règles + référentiels. Aucune liste métier codée en dur.
2. **PostgreSQL est l'unique source de vérité.** Redis = cache + files uniquement.
   MinIO = tous les fichiers. Aucun fichier en base, aucune donnée métier dans Redis.
3. **Le `Domain` est toujours déduit de l'`Activity`.** Jamais saisi, jamais envoyé par
   le client, jamais utilisé comme filtre. Toute tentative d'envoi est ignorée/rejetée.
4. **Le Backend orchestre, il n'exécute jamais l'OCR ni la classification.**
5. **Tout échange inter-composant passe par `shared/contracts`.** Aucun composant ne
   dépend des objets internes d'un autre (ADR.03, ADR.07).
6. **Prisma est confiné aux Repositories.** Aucun Controller / Service / Worker
   n'importe Prisma Client (ADR.02, ADR.07).
7. **Dépendre des abstractions, jamais des implémentations** (ADR.07). Backend→Repository
   (pas Prisma), OCR Worker→ImageProcessor/OCREngine (pas OpenCV/Tesseract),
   Classifier→ClassificationRule (pas les règles concrètes).
8. **Une responsabilité = une technologie** (ADR.04). Toute exception = nouvelle ADR.
9. **Conservation & traçabilité :** document original, image prétraitée, texte OCR,
   OCRResult, ClassificationResult sont tous conservés. Le pipeline est rejouable.
10. **Rien hors périmètre V1.** Voir §11.

---

## 3. Stack (ADR.04 — une techno par responsabilité)

| Responsabilité      | Technologie          |
|---------------------|----------------------|
| Frontend            | Angular              |
| API / Backend       | NestJS (TypeScript)  |
| ORM                 | Prisma               |
| Base de données     | PostgreSQL           |
| Files / async       | BullMQ               |
| Cache               | Redis                |
| Stockage objet      | MinIO                |
| OCR                 | Tesseract            |
| Traitement d'image  | OpenCV               |
| Validation DTO      | class-validator / class-transformer |
| Auth                | JWT                  |
| Doc API             | OpenAPI / Swagger    |
| Déploiement         | Docker / Kubernetes  |

Runtime workers : Node.js + NestJS Standalone.

---

## 4. Architecture des composants

```
Utilisateur → Frontend (Angular)
                  │  REST /api/v1 (JSON)
             Backend (NestJS)  ── orchestre uniquement
                  ├── PostgreSQL (via Repositories/Prisma)
                  ├── MinIO
                  └── Redis / BullMQ
                          ├── OCR Worker          (Tesseract + OpenCV)
                          └── Classifier Worker   (moteur de règles)
```

- Les workers ne communiquent **jamais** directement entre eux ni ne se chaînent : chacun
  renvoie son résultat au Backend, qui **orchestre** l'étape suivante et **historise chaque
  transition** d'état de l'ImportJob (règle d'or 4 ; stats sur les passages entre états).
- Les workers sont **stateless**, idempotents, répliquables horizontalement.
- Les workers ne sont **jamais** exposés publiquement.
- Quatre files : `OCR_QUEUE` (Backend→OCR), `OCR_RESULT_QUEUE` (OCR→Backend),
  `CLASSIFICATION_QUEUE` (Backend→Classifier), `IMPORT_RESULT_QUEUE` (Classifier→Backend).

### Pipeline d'import (asynchrone de bout en bout)

```
Acquisition → Attachment (MinIO) → ImportJob (PENDING)
   → ImportRequest sur OCR_QUEUE           → OCR_RUNNING
   → OCR Worker → OCRResult sur OCR_RESULT_QUEUE
   → Backend conserve l'OCRResult          → OCR_DONE
   → OCRResult sur CLASSIFICATION_QUEUE     → CLASSIFICATION_RUNNING
   → Classifier Worker → ClassificationResult sur IMPORT_RESULT_QUEUE
   → Backend crée EventCandidate (PENDING) → READY_FOR_VALIDATION
   → Validation utilisateur → Event (source=IMPORT)
```

Le frontend n'attend **jamais** la fin du traitement (retour HTTP immédiat).
Un import **texte** ne déclenche jamais l'OCR : classification directe
(PENDING → CLASSIFICATION_RUNNING → READY_FOR_VALIDATION).
Chaque transition est journalisée dans `import_job_events` (audit + statistiques par étape).

---

## 5. Monorepo

```
event-foundry/
  backend/            NestJS (API + orchestration)
  frontend/           Angular
  ocr-worker/         Worker OCR
  classifier-worker/  Worker de classification experte
  shared/
    contracts/        Contrats d'échange inter-composants (source de vérité des échanges)
  docker/             docker-compose (dev), Dockerfiles
  k8s/                Manifests / Helm
  scripts/            Outillage
  docs/               Documentation (référence contractuelle du projet)
```

Gestionnaire : **npm workspaces**. Chaque composant a son propre cycle de build.

---

## 6. Backend — structure d'un module (TSPEC.01)

Une capacité métier = un module NestJS indépendant. Modules V1 : `auth`, `imports`,
`event-candidates`, `events`, `calendar`, `participation`, `reference-data`, `search`,
`users`.

```
<module>/
  <module>.module.ts
  controllers/    reçoit REST, valide DTO, appelle Services — AUCUNE logique métier
  services/       règles métier, orchestration, publie Jobs BullMQ — AUCUN SQL, AUCUN HTTP
  repositories/   encapsulent Prisma — SEUL point d'accès PostgreSQL
  entities/       modèle persistant, confiné à la couche Repository
  dto/            Request (Create/Update...) + Response — les Entities ne sont jamais exposées
  mappers/        Entity ↔ DTO (aucune conversion ailleurs)
  validators/     validateurs métier du module
  interfaces/     contrats internes entre modules (dépendance aux abstractions)
```

- Tous les Repositories étendent `BaseRepository` (`findById/findAll/create/update/delete`),
  qui ne contient aucune logique métier.
- Les échanges entre modules passent par des **interfaces de services**, jamais par des
  implémentations concrètes.
- Erreurs métier = exceptions **explicites** (`ActivityNotFoundException`,
  `InvalidEventTypeException`, …). Pas d'exception générique.
- Transactions Prisma réservées aux écritures multi-cohérentes : création d'Event,
  validation d'EventCandidate, création d'ImportJob, création de UserParticipation.
  **Jamais** de traitement asynchrone dans une transaction.

---

## 7. Persistance (TSPEC.02)

- **Clés primaires : UUID**, générés côté application. Pas d'auto-incrément.
- **Dates : UTC**, type `timestamp with time zone`. Conversion fuseau uniquement en API/Front.
- Toutes les tables métier : `created_at`, `updated_at` (+ `created_by`/`updated_by` si pertinent).
- **Suppression logique** :
  - donnée métier (Event) → `deleted_at` (soft delete) ;
  - référentiels (Domain, Activity, EventType, EventFormat, Organizer, Venue) → `is_active`
    (aligné sur ARCHI.03 / FSPEC.07 ; cf. TSPEC.02 v1.1).
- Relations explicites, `RESTRICT` par défaut sur les données métier.
- Nommage :
  - tables SQL : pluriel `snake_case` (`events`, `import_jobs`, `user_participation`) ;
  - colonnes SQL : `snake_case` (`created_at`, `starts_at`) ;
  - modèles Prisma : `PascalCase` (`Event`, `ImportJob`) ;
  - champs Prisma : `camelCase` (`createdAt`) avec `@map` vers le SQL.
- `schema.prisma` = référence unique du schéma. Toute évolution = migration Prisma Migrate.
  Une migration appliquée n'est jamais modifiée.
- `seed.ts` initialise uniquement référentiels + rôles + admin de dev. Aucune donnée fonctionnelle.
- Index à prévoir : Events(`starts_at`, `venue_id`, `organizer_id`, `activity_id`, `source`),
  EventCandidates(`status`, `created_at`), ImportJobs(`status`, `created_at`),
  ImportJobEvents(`import_job_id`, `status`, `occurred_at`),
  Attachments(`checksum`), UserParticipation(`user_id`, `event_id`) + `UNIQUE(user_id, event_id)`.

---

## 8. Modèle métier (ARCHI.02 / ARCHI.03)

Hiérarchie référentielle : `Domain → Activity → EventType / EventFormat(optionnel)`.
- Une Activity appartient à un Domain ; un EventType/EventFormat appartient à une Activity.
- Un Event peut ne pas avoir de EventFormat.

Entités : `User`, `Attachment`, `ImportJob`, `ImportJobEvent`, `EventCandidate`, `Event`,
`Domain`, `Activity`, `EventType`, `EventFormat`, `Organizer`, `Venue`, `UserParticipation`.

- `ImportJobEvent` : journal d'audit des transitions d'état d'un ImportJob (une ligne par
  passage d'état), alimenté par le Backend qui orchestre chaque étape. Base des statistiques
  sur les passages entre états et les durées par étape.
- `Organizer` et `Venue` sont indépendants (lien optionnel, jamais forcé).
- `EventCandidate` : `payload` (JSONB, brouillon d'Event) + `confidence` (JSONB, **un score
  par champ**, aucun score global côté API — le front peut faire une synthèse visuelle).
- `Event.source` ∈ `{IMPORT, MANUAL}` : calculé, figé, non modifiable par le client.

### États (alignés sur ARCHI.02 — référence contractuelle)

- **ImportJob** : `PENDING → OCR_RUNNING → OCR_DONE → CLASSIFICATION_RUNNING →
  READY_FOR_VALIDATION → COMPLETED` ; erreur → `FAILED`.
- **EventCandidate** : `PENDING → CORRECTED → VALIDATED → REJECTED`.
  Transitions : `PENDING→{CORRECTED,VALIDATED,REJECTED}`, `CORRECTED→{VALIDATED,REJECTED}`.
  Un candidate `VALIDATED`/`REJECTED` n'est plus modifiable et reste conservé (audit).

### Participation (FSPEC.06)

Trois axes **indépendants**, aucune déduction automatique :
- `interested` : `true|false`
- `reservationStatus` : `NONE|RESERVED|WAITLIST|CANCELLED`
- `paymentStatus` : `NONE|PENDING|PAID|REFUNDED`

Une participation existe dès qu'au moins un axe est non neutre. Tout revenir à neutre
(`false/NONE/NONE`) supprime la participation → l'Event quitte le calendrier (mais reste
trouvable en recherche). Un seul enregistrement par `(user, event)`.

Palette calendrier V1 : Intéressé=Bleu, Réservé=Orange, Liste d'attente=Violet, Payé=Vert,
Annulé=Rouge.

---

## 9. Contrats partagés (shared/contracts)

Le Backend ne publie qu'un `ImportRequest` minimal ; les workers rechargent le reste.

```ts
interface ImportRequest        { importJobId; attachmentId; correlationId; }
interface OCRResult            { importJobId; rawText; confidence; processingTimeMs;
                                 pageCount; language; engine; engineVersion; correlationId; }
interface ClassificationResult { importJobId; extractedFields; confidenceByField;
                                 diagnostics; ocr /* OCRResult source, provenance */;
                                 correlationId; }
```

Moteur expert : chaîne de règles indépendantes implémentant
`ClassificationRule { execute(context: ClassificationContext): Promise<void> }` (ADR.06).
Chaque règle a une responsabilité unique, ne connaît pas les autres, est activable /
réordonnable sans modifier le moteur, calcule son propre score. Le Domain n'est jamais
recherché directement — toujours déduit de l'Activity.

---

## 10. Transverses (TSPEC.07)

- **API versionnée** : `/api/v1/...`. Évolution incompatible = nouvelle version.
- **CorrelationId** sur chaque requête, propagé API → BullMQ → Workers → logs.
- **Codes d'erreur** : validation → 400 ; métier → 409/422 ; technique → 500.
- **Health checks** sur chaque composant (sondes K8s).
- **Config externalisée** (env / fichiers). **Secrets injectés par Kubernetes**, jamais versionnés.
- Logs structurés (timestamp UTC, niveau, composant, correlationId), métriques, observabilité.
- Sécurité Backend : JWT, autorisation par rôles, validation des entrées, CORS, rate limiting.

---

## 11. Périmètre V1 & hors périmètre

**Dans la V1** : import image/texte, OCR, classification experte, validation/correction,
création d'Events, recherche + filtres, vue Découverte, Mon calendrier, participation,
administration des référentiels.

**Hors périmètre V1 (ne pas implémenter)** : sync Discord/Google/Outlook, export ICS,
scraping, notifications, mobile, IA générative, OCR cloud, réseau social, commentaires,
partage, recommandations, statistiques avancées, géoloc avancée, multi-tenant, API publique,
rôles de participation, personnalisation des couleurs. → tout cela vit dans le Backlog.

**Collection STRAT (`docs/10-STRAT.*`, Statut : Vision)** : vision produit, business model,
go-to-market, roadmap. **Directionnelle uniquement** — le périmètre de développement reste
gouverné par FSPEC/TSPEC. La roadmap situe la V1 en « Phase 1 — Prouver » (le pipeline).
Attention à deux notions post-V1 à ne pas confondre avec la V1 :
- la **persona « Organisateur »** (utilisateur qui publie) ≠ l'entité référentielle
  `Organizer` de la V1 (simple fiche de données, sans compte) ; un futur rôle `ORGANIZER`
  complètera `ADMIN`/`USER` ;
- les **« suivis »** (organisateurs/lieux/activités) et recommandations sont hors V1.

---

## 12. Tests

- Chaque module : tests unitaires + tests d'intégration.
- Repositories : unitaires (Prisma mocké) + intégration (PostgreSQL réel).
- E2E regroupés dans un projet dédié. Migrations exécutées en CI.

---

## 13. Conventions de travail

- **Langue** : documentation et libellés produit en français ; code et identifiants
  techniques en anglais (conforme aux specs).
- **Branche de développement** : `claude/event-foundry-documentation-jd17uo` (sauf
  indication contraire explicite).
- **Commits** : messages clairs et descriptifs, périmètre cohérent.
- Toujours vérifier la doc `docs/` avant d'introduire une notion métier. Une divergence
  code/doc doit être signalée, pas tranchée en silence.

---

## 14. Ordre de développement (Backlog)

EPIC 1 Init monorepo/infra → 2 Auth → 3 Référentiels → 4 Persistance → 5 Acquisition →
6 OCR → 7 Expert System → 8 Validation → 9 Catalogue → 10 Participations/Calendrier →
11 Frontend → 12 Admin → 13 Observabilité → 14 Tests → 15 Déploiement.

MVP atteint quand Auth + Référentiels + Acquisition + OCR + Classification + Validation +
Catalogue + Participations + Calendrier sont opérationnels.
