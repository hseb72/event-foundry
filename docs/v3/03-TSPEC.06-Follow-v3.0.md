# Suivis (Follow) — Spécification technique

**Document** : TSPEC.06

**Fichier** : 03-TSPEC.06-Follow-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique du domaine **Follow** (ADR.19) : modèle polymorphe (objet suivable de
type variable), relation Many-to-Many, cycle de vie, métadonnées, et exposition aux composants
consommateurs (recommandations, notifications, recherche) sans coupler les objets suivis.

---

# Position & module

Domaine `follow` (module NestJS), Prisma confiné aux Repositories (ADR.02). Publie des événements sur
l'Event Bus (`FollowCreated`, `FollowRemoved`) et **consomme** des événements de publication pour
alimenter les notifications via le framework (jamais directement — ADR.17).

```
follow/
  repositories/    Follow (Prisma)
  services/        FollowService (cycle de vie, unicité)
  controllers/     API /follows
  dto/ · mappers/ · interfaces/
```

---

# Modèle de données

Référence **polymorphe** (type + id) pour éviter le couplage avec chaque objet suivable (ADR.19).

```prisma
model Follow {
  id          String  @id @default(uuid())
  userId      String  @map("user_id")
  targetType  FollowTargetType   // ORGANIZATION | ORGANIZER | VENUE | ACTIVITY | CATEGORY | EVENT_SERIES
  targetId    String  @map("target_id")
  status      FollowStatus @default(ACTIVE) // ACTIVE | SUSPENDED | DELETED
  origin      String?            // manuel, suggestion…
  priority    Int?               // métadonnée optionnelle
  notify      Boolean @default(true) @map("notify") // notifications activées pour ce suivi
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  @@unique([userId, targetType, targetId])  // un suivi par (user, objet) — RG-FOL-02
  @@index([targetType, targetId])            // « qui suit cet objet » (notifications)
  @@index([userId, status])                  // « mes suivis »
  @@map("follows")
}
```

- **Polymorphisme** assumé : `(targetType, targetId)` ; l'intégrité référentielle vers chaque type
  d'objet est **applicative** (le repository valide l'existence de la cible via le service du domaine
  concerné). Ajouter un `FollowTargetType` = valeur d'enum, sans migration structurelle (ADR.19).
- **Historique du cycle de vie** : table `follow_events` (transition, `occurred_at`) — audit et stats.
- Suppression **logique** (`deletedAt`) : l'intérêt exprimé reste analysable, anonymisé.

---

# Cycle de vie & unicité

```ts
interface FollowService {
  follow(userId: string, target: FollowTarget): Promise<Follow>;   // créé/réactivé (idempotent)
  suspend(userId: string, target: FollowTarget): Promise<void>;
  resume(userId: string, target: FollowTarget): Promise<void>;
  unfollow(userId: string, target: FollowTarget): Promise<void>;   // soft delete
  listFollowers(target: FollowTarget): Promise<string[]>;          // pour notifications
  listByUser(userId: string, filter?): Promise<Follow[]>;          // tableau de bord
}
```

- `follow` est **idempotent** : re-suivre un objet suspendu/supprimé **réactive** le Follow existant
  (respecte l'unicité `(user, targetType, targetId)`).
- Transitions écrites dans `follow_events` (transactionnel).

---

# Intégration aux notifications

- À la **publication d'un événement** rattaché à un objet suivable (ex. `EventPublished` d'un
  organisateur), le framework de notifications (TSPEC.04) interroge `listFollowers(target)` **filtré
  sur `status = ACTIVE` et `notify = true`**, puis applique la Policy déterministe et les préférences
  individuelles.
- Les objets suivis **n'appellent jamais** le Follow : c'est le framework de notifications qui
  consomme, via l'Event Bus (découplage RG-FOL-03).

---

# Intégration aux recommandations & recherche

- Le moteur de recommandation (déterministe) lit les suivis actifs comme **signal de pertinence**
  (pondération), jamais comme filtre imposé (RG-FOL-05).
- La recherche peut **mettre en avant** les contenus liés aux suivis (tri secondaire), sans exclure les
  autres résultats.

---

# API (esquisse, `/api/v1`)

| Méthode | Route | Accès |
|---------|-------|-------|
| `POST` | `/follows` | suivre `{ targetType, targetId }` (idempotent) |
| `DELETE` | `/follows/:targetType/:targetId` | ne plus suivre (soft delete) |
| `PATCH` | `/follows/:targetType/:targetId` | suspendre/réactiver, régler `notify`/priorité |
| `GET` | `/me/follows` | mes suivis (filtres par type/statut) |

DTO uniquement ; pas d'exposition des abonnés d'un objet à un utilisateur tiers (confidentialité).

---

# Observabilité & statistiques

- Métriques : nombre de suivis par type, taux de suspension, objets les plus suivis (anonymisé).
- `correlationId` propagé sur les événements `FollowCreated`/`FollowRemoved` (ADR.23).

---

# Contraintes

- Follow = entité indépendante (jamais une préférence) ; découplage des objets suivis (référence
  polymorphe + intégrité applicative) ; unicité `(user, objet)` ; consommation via Event Bus pour les
  notifications ; Prisma confiné aux Repositories. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.19-FollowDomainModel · 99-ADR.17/20 · 02-FSPEC.06-Follow-v3.0 · 04-UISPEC.06-Follow-v3.0 ·
03-TSPEC.04-Notification-v3.0 · 01-ARCHI.03-Catalog-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du domaine Follow (modèle polymorphe, cycle de vie, intégration notifications/reco). |
