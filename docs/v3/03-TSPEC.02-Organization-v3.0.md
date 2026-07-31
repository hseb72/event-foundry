# Organization — Spécification technique

**Document** : TSPEC.02

**Fichier** : 03-TSPEC.02-Organization-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique du domaine **Organization** (ADR.18) : modèle de données, relation
Many-to-Many enrichie utilisateur ↔ organisation, contexte d'organisation active, isolation
multi-tenant, adresses, cycle de vie et gouvernance de la page de paramètres. Prolonge le RBAC V2
(ADR.08) et l'Identity V2 sans les renier.

---

# Position & module

Domaine `organization` (module NestJS), Prisma confiné aux Repositories (ADR.02). Les autres modules
(imports, events, notifications, secrets) dépendent d'une **interface de service**
`OrganizationContextService`, jamais des entités internes.

```
organization/
  controllers/      API organisations, membres, adresses, paramètres
  services/         règles (invariant Owner, cycle de vie), contexte actif
  repositories/     Organization, OrganizationMembership, OrganizationAddress (Prisma)
  entities/ · dto/ · mappers/ · validators/ · interfaces/
  guards/           OrganizationContextGuard, OrganizationRoleGuard
```

---

# Modèle de données

Clés primaires UUID générées côté application ; dates UTC `timestamptz` ; `created_at`/`updated_at`
(+ `created_by`/`updated_by`) ; suppression logique par `deleted_at` (donnée métier) — TSPEC.02 V2.

```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  status      OrganizationStatus @default(CREATED)  // CREATED|ACTIVE|SUSPENDED|ARCHIVED|DELETED
  visibility  OrgVisibility      @default(PRIVATE)   // politique de visibilité (ADR.18)
  settings    Json      // paramètres fonctionnels + techniques (non secrets)
  memberships OrganizationMembership[]
  addresses   OrganizationAddress[]
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt      @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  @@index([status])
  @@map("organizations")
}

model OrganizationMembership {          // relation M2M enrichie (ADR.18)
  id             String  @id @default(uuid())
  organizationId String  @map("organization_id")
  userId         String  @map("user_id")
  role           OrgRole // OWNER|ADMINISTRATOR|EDITOR|CONTRIBUTOR|VIEWER
  invitedBy      String? @map("invited_by")
  joinedAt       DateTime @default(now()) @map("joined_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt      @map("updated_at")
  @@unique([organizationId, userId])    // un rôle par (org, user)
  @@index([userId])
  @@index([organizationId, role])
  @@map("organization_memberships")
}

model OrganizationAddress {
  id             String  @id @default(uuid())
  organizationId String  @map("organization_id")
  label          String                       // « Boutique centre-ville »
  countryCode    String  @map("country_code") // ISO 3166-1 alpha-2
  postalCode     String  @map("postal_code")  // indexé (localisation V3 — FSPEC.03)
  municipalityId String? @map("municipality_id") // commune résolue (référentiel géo)
  streetLines    String  @map("street_lines")
  isPrimary      Boolean @default(false) @map("is_primary")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt      @map("updated_at")
  @@index([organizationId])
  @@index([postalCode])
  @@map("organization_addresses")
}
```

- **Région dérivée** : jamais stockée sur l'adresse ; déduite de la commune (`municipalityId`) à
  l'affichage (FSPEC.03 Localization).
- **Ressources org-scoped** (événements, connecteurs, médias, secrets, notifications, clés d'API)
  portent une colonne `organization_id` (FK `RESTRICT`) et sont filtrées par le contexte actif.
- **Historique du cycle de vie & des membres** : table `organization_events` (transition, acteur,
  motif, `occurred_at`) — même patron que `import_job_events` (audit + stats).

---

# Rôle d'organisation vs RBAC de plateforme

- Le **RBAC V2** (ADR.08) reste la source des permissions atomiques dans le JWT
  (`organization.manage`, `event.publish`…). Inchangé.
- Le **rôle d'organisation** (`OrgRole`) est une **dimension contextuelle** stockée dans
  `OrganizationMembership`, **non** portée par le JWT (il varie selon l'organisation ciblée).
- **Autorisation d'une opération org-scoped = ET logique** :
  1. le JWT porte la permission de plateforme requise ; **et**
  2. l'utilisateur détient, sur l'organisation active, un `OrgRole` suffisant (table de capacités).

Deux guards NestJS :

- `OrganizationContextGuard` — résout l'organisation active depuis le contexte de requête (en-tête
  `X-Organization-Id` / claim), vérifie l'existence d'une `OrganizationMembership` (isolation
  RG-ORG-05) ; sinon `403`.
- `OrganizationRoleGuard` — via `@RequireOrgRole(minRole)`, compare l'`OrgRole` du membre au minimum
  requis pour l'opération.

---

# Contexte d'organisation actif

- L'organisation active est transmise par en-tête `X-Organization-Id` (ou paramètre équivalent),
  résolue et validée par `OrganizationContextGuard`, puis exposée via `OrganizationContextService`
  (`getActiveOrganizationId()`), injecté dans les services org-scoped.
- Toute écriture org-scoped (création d'event, d'import, de secret…) **force**
  `organization_id = contexte actif` côté service — jamais depuis le corps client (comme `Event.source`
  V2 : calculé, non falsifiable).
- Toute lecture org-scoped **filtre** systématiquement sur le contexte actif (défense en profondeur
  contre les fuites inter-tenant).

---

# Invariants & cycle de vie

## Invariant Owner (RG-ORG-03)

Repository/service refuse la suppression ou la rétrogradation du **dernier Owner**
(`count(role=OWNER) ≥ 1`). Vérifié dans la **même transaction** que la modification d'appartenance.

## Transitions d'état (RG-ORG-08)

`CREATED → ACTIVE → SUSPENDED ⇄ ACTIVE`, `ACTIVE|SUSPENDED → ARCHIVED ⇄ ACTIVE`, `* → DELETED`
(soft delete). Chaque transition écrite dans `organization_events` (transactionnel). `SUSPENDED`/
`ARCHIVED`/`DELETED` bloquent les écritures org-scoped (guard).

## Transactions Prisma

Réservées aux écritures multi-cohérentes (TSPEC.02 V2) : création d'organisation + membership Owner
initial ; changement de rôle avec contrôle d'invariant ; transition d'état + ligne d'historique.
Jamais de traitement asynchrone dans une transaction.

---

# Gouvernance de la page de paramètres (RG-ORG-07 / chantier §8.3)

- **Écriture des paramètres** : permission `organization.manage` **+** `OrgRole ∈ {OWNER,
  ADMINISTRATOR}` sur l'organisation active.
- **Accès Operator (admin plateforme)** : **[à trancher]**
  - *option A — restriction dure* : l'Operator **ne peut pas** écrire les paramètres d'une
    organisation (aucun bypass de tenant) ;
  - *option B — support-only tracé* **(recommandée)** : l'Operator peut intervenir **à la demande**,
    chaque accès/écriture étant **journalisé** dans `organization_events` (acteur = Operator, motif =
    ticket support). Isolation par défaut, exception explicite et auditée.

---

# API (esquisse, `/api/v1`)

| Méthode | Route | Permission + rôle org |
|---------|-------|-----------------------|
| `POST` | `/organizations` | authentifié (devient Owner) |
| `GET` | `/organizations` | mes organisations (memberships) |
| `GET` | `/organizations/:id` | membre (Viewer+) |
| `PATCH` | `/organizations/:id` | `organization.manage` + Owner/Administrator |
| `POST` | `/organizations/:id/lifecycle` | Owner (transitions) |
| `GET/POST/PATCH/DELETE` | `/organizations/:id/members` | Owner/Administrator (invariant Owner) |
| `GET/POST/PATCH/DELETE` | `/organizations/:id/addresses` | Owner/Administrator |

Réponses via DTO (jamais d'entités exposées) ; secrets **jamais** renvoyés en clair (ADR.21).

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Tenant / organisation implicite (Identity V2) | `Organization` entité de premier niveau |
| Permission `organization.manage` (rôle Organizer) | conservée ; complétée par `OrgRole` contextuel |
| Ressources rattachées à l'utilisateur/tenant | `organization_id` explicite + guards d'isolation |
| RBAC atomique JWT (ADR.08) | conservé ; `OrgRole` s'ajoute hors JWT |

---

# Contraintes

- Isolation multi-tenant systématique (lecture **et** écriture) ; invariant Owner garanti en
  transaction ; contexte actif non falsifiable ; Prisma confiné aux Repositories ; dépendance aux
  interfaces (`OrganizationContextService`), jamais aux implémentations. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.18-OrganizationDomainModel · 99-ADR.12 · 99-ADR.21-SecretsManagement · (V2) ADR.08 RBAC ·
02-FSPEC.02-Organization-v3.0 · 04-UISPEC.02-Organization-v3.0 · 03-TSPEC.03-Localization-v3.0 ·
01-ARCHI.02/03-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du domaine Organization (modèle M2M enrichi, contexte actif, isolation multi-tenant, adresses, cycle de vie, gouvernance des paramètres). |
