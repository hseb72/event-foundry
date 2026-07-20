# V2 — État de livraison

**Document** : RMAP.01

**Fichier** : 05-RMAP.01-DeliveryStatus-v2.0.md

**Version** : 2.0

**Statut** : Suivi de livraison

---

# Objectif

Consigner l'état de livraison des EPICs de la V2 et servir de point d'entrée pour la
finalisation (EPIC 13). Ce document est descriptif : la **documentation `docs/` reste la
référence contractuelle**, et le périmètre est gouverné par FSPEC/TSPEC.

Le principe déterministe demeure : **aucune décision métier n'est prise par une IA** (OCR et
classification exclus du champ décisionnel ; recommandation par règles — ADR.09).

---

# Statut des EPICs

| EPIC | Domaine | Statut | Points de livraison |
|------|---------|--------|---------------------|
| 00 | Foundation | ✅ | Monorepo npm workspaces, outillage, `shared/contracts`/`libraries`, Docker, base K8s, CI. |
| 01 | Identity | ✅ | RBAC atomique (ADR.08), Organizations, rôles/expériences/abonnements (ADR.11), `identity/me`, changement d'expérience/organisation. |
| 02 | Reference Data | ✅ | Domain → Activity → EventType/EventFormat, catégories, tags, géographie (pays/région/commune), alias. |
| 03 | Catalog | ✅ | Event enrichi (catégorie, tags, commune), création manuelle, médias (MinIO), recherche filtrée. |
| 04 | Publishing | ✅ | Cycle DRAFT → SUBMITTED → PUBLISHED → ARCHIVED, règles déterministes de publication, journal des transitions, **correction d'un événement éditable**. |
| 05 | Planning | ✅ | Planning personnel, détection de conflits d'horaire. |
| 06 | Recommendation | ✅ | Moteur déterministe et explicable (chaîne de règles), mode « Surprends-moi », retours (accepter/ignorer/refuser). |
| 07 | Discovery | ✅ | Navigation à facettes, tri, « Surprends-moi ». |
| 08 | Notifications | ✅ | Domaine d'orchestration multi-canal (interne + email/push stubbés), notifications des participants aux transitions d'événement. |
| 09 | Search | ✅ | Index plein texte PostgreSQL (tsvector pondéré + GIN), facettes contextuelles, reconstruction d'index. |
| 10 | Explorer Portal | ✅ | Accueil, Découvrir, Rechercher, Pour vous, Mon planning, Notifications, Fiche, Profil. |
| 11 | Organizer Portal | ✅ | Tableau de bord, Mes événements, Création/Édition, Import, Publication. |
| 12 | Operator Portal | ✅ | Supervision (vision globale + alertes), Utilisateurs & organisations, Référentiels, Imports. |
| 13 | Finalization | ⏳ | Qualité (tests) et documentation traités ici ; exploitation (images Docker, K8s, sauvegardes, monitoring) à outiller sur l'infrastructure cible. |

MVP (00, 01, 02, 03, 04, 05, 07, 09, 10, 11) : **atteint**. EPICs hors MVP (06, 08, 12) : **livrés**.

---

# Domaines backend (modules NestJS)

`auth`, `identity`, `users`, `reference-data`, `events` (Catalog + Publishing), `event-candidates`,
`imports`, `participation`, `calendar`, `planning`, `discovery`, `search`, `recommendation`,
`notifications`, `stats`, `health`, `metrics`.

Chaque domaine consommateur reste découplé : le Catalog est propriétaire des événements ;
Search, Recommendation et Notifications le lisent sans le modifier. Prisma est confiné aux
Repositories (ADR.02) ; les échanges inter-composants passent par `shared/contracts` (ADR.03).

---

# Couverture de tests (au dernier passage)

| Suite | Résultat |
|-------|----------|
| Tests unitaires (backend) | 52 ✅ |
| Tests E2E (API réelle, PostgreSQL + Redis, MinIO stubbé) | 52 ✅ |
| Tests d'intégration (Repositories sur base réelle) | 2 ✅ |
| Lint (ESLint) | ✅ |
| Build (tous les workspaces) | ✅ |

Chaque domaine livré est couvert par des tests (règles déterministes, RBAC, transitions,
recherche, recommandation, notifications, supervision).

---

# Observabilité & exploitation

- **Health checks** : `GET /health` (liveness) et `GET /health/ready` (readiness) — sondes K8s.
- **Métriques** : module `metrics` (prom-client) + intercepteur.
- **Logs structurés**, `correlationId` propagé API → BullMQ → Workers.
- **Config externalisée** (env) ; secrets injectés par Kubernetes, jamais versionnés.

Éléments d'exploitation restant à câbler sur l'infrastructure cible (hors bac à sable) :
images Docker de production, manifests K8s complets, sauvegardes, tableau de bord monitoring,
fournisseurs réels email/push (canaux aujourd'hui stubbés).

---

# Revue sécurité (points vérifiés)

- Authentification JWT ; autorisation par **permissions atomiques** (guard global), vérifiée
  sur chaque route sensible ; ressources personnelles bornées à l'identité courante.
- `Domain` toujours déduit de l'`Activity`, jamais accepté du client ; `source` d'un Event
  calculée et figée.
- Validation stricte des entrées (class-validator, `whitelist` + `forbidNonWhitelisted`).
- Requêtes SQL brutes (Search) **paramétrées** via `Prisma.sql` (pas de concaténation).
- Aucun secret versionné ; `.env` et dumps (`*.rdb`) ignorés.

---

# Documents liés

05-RMAP.00-DevelopmentRoadmap-v2.0

99-ADR.08-RoleBasedAccessControl · 99-ADR.09-DeterministicRecommendationEngine ·
99-ADR.10-MultiExperiencePlatform · 99-ADR.11-IdentityRolesExperiencesSubscriptions

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Premier suivi de livraison V2 : EPICs 00–12 livrés, EPIC 13 (finalisation) en cours. |
