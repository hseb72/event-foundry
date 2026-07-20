# Notifications — Spécification technique

**Document** : TSPEC.04

**Fichier** : 03-TSPEC.04-Notification-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique du Notification Framework (ADR.17) : consommation d'événements métier
via l'Event Bus, Notification Policy déterministe, Channel Router (réglages globaux + préférences),
Delivery Providers, planificateur de récaps, historisation et observabilité. Prolonge le socle V2
(modèle Notification, canal in-app, API personnelle) sans le renier.

---

# Position & module

Domaine `notification` (module NestJS), Prisma confiné aux Repositories (ADR.02). **Consommateur** de
l'Event Bus (ADR.12 §5) ; **jamais** appelé directement par les modules métier.

```
notification/
  policies/          NotificationPolicy par type d'événement (déterministe)
  routing/           ChannelRouter (réglages globaux + préférences)
  providers/         DeliveryProvider (in-app, email, push) — un par canal
  scheduler/         planificateur de récaps (BullMQ récurrent)
  repositories/      Notification, NotificationSetting, DeliveryLog (Prisma)
  services/ · controllers/ · dto/ · mappers/ · interfaces/
```

---

# Consommation d'événements

- Le framework **s'abonne** aux événements métier de l'Event Bus (`ImportCompleted`, `ImportFailed`,
  `EventPublished`, `ParticipationChanged`, `FollowedOrganizerPublished`…).
- Chaque type d'événement est associé à une **NotificationPolicy** (`supports(event)`,
  `resolve(event): NotificationIntent[]`) — chaîne extensible, une politique = une responsabilité (même
  esprit que la chaîne de règles du classifier, ADR.06).
- Le `correlationId` de l'événement d'origine est **propagé** jusqu'au log de livraison (traçabilité
  RG-NOTIF-06, ADR.23).

```ts
interface NotificationPolicy {
  supports(event: DomainEvent): boolean;
  resolve(event: DomainEvent): Promise<NotificationIntent[]>; // qui + priorité + type de message
}
```

---

# Channel Router & double niveau de réglage

Le routeur combine **deux niveaux** (RG-NOTIF-03) :

1. **Réglages globaux** (Operator) — quels **vecteurs** et **fréquences** sont actifs sur la plateforme.
2. **Préférences individuelles** (Explorer) — pour chaque **fréquence active**, le vecteur choisi (ou
   « aucun »). Stockées dans le **modèle User Preferences** (ADR.20 / FSPEC.05), consultées ici.

Règle de résolution : un envoi n'a lieu que si le vecteur **ET** la fréquence sont actifs globalement
**et** retenus par la préférence individuelle ; « aucun » individuel bloque. Priorité `critique` →
route en **immédiat** quel que soit le réglage de récap (RG-NOTIF-05).

---

# Modèle de données

```prisma
model Notification {                     // généralise le modèle V2
  id           String  @id @default(uuid())
  recipientId  String  @map("recipient_id")
  family       NotifFamily              // TECHNICAL | USER
  type         String                   // ex. IMPORT_COMPLETED, FOLLOWED_EVENT_PUBLISHED
  priority     NotifPriority            // INFORMATION | IMPORTANT | CRITICAL
  payload      Json                     // données de rendu du message
  sourceEvent  String  @map("source_event") // traçabilité → événement métier
  correlationId String @map("correlation_id")
  readAt       DateTime? @map("read_at")
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([recipientId, createdAt])
  @@index([recipientId, readAt])
  @@map("notifications")
}

model NotificationSetting {             // réglages GLOBAUX (Operator)
  id         String  @id @default(uuid())
  channel    NotifChannel             // IN_APP | EMAIL | PUSH
  frequency  NotifFrequency           // IMMEDIATE | DAILY | WEEKLY
  enabled    Boolean @default(true)
  updatedAt  DateTime @updatedAt @map("updated_at")
  @@unique([channel, frequency])
  @@map("notification_settings")
}

model DeliveryLog {                     // observabilité (ADR.23)
  id             String @id @default(uuid())
  notificationId String @map("notification_id")
  channel        NotifChannel
  status         DeliveryStatus         // QUEUED | SENT | FAILED
  attemptedAt    DateTime @default(now()) @map("attempted_at")
  error          String?
  @@index([notificationId])
  @@map("delivery_logs")
}
```

- Les **préférences individuelles** (fréquence → vecteur) vivent dans **User Preferences** (FSPEC.05),
  pas ici (une seule source de vérité des préférences — ADR.20).
- Le canal **in-app** est toujours matérialisé par une ligne `Notification` (historique consultable) ;
  les réglages ne pilotent que les **envois sortants** (email/push) — décision FSPEC.04.

---

# Delivery Providers

```ts
interface DeliveryProvider {
  readonly channel: NotifChannel;
  isAvailable(): Promise<boolean>;     // dépend de la config Operator (SMTP/push)
  deliver(n: Notification, recipient: Recipient): Promise<DeliveryResult>;
}
```

- Un provider par canal (in-app, email, push). **Ajout d'un canal = nouveau provider**, aucune
  modification des politiques ni du domaine (ADR.17 extensibilité).
- **Email/push** dépendent de la **configuration Operator** (SMTP/provider) et de **secrets** résolus
  par le Secrets Management (ADR.21) — jamais en clair. Un provider indisponible est **loggué**, jamais
  bloquant pour les autres canaux.

---

# Planificateur de récaps

- **Décision FSPEC.04** : planificateur **intégré** via **job récurrent BullMQ** (quotidien / hebdo).
- À chaque tick, le scheduler **agrège** les notifications en attente par `(recipient, fréquence)`,
  applique le **regroupement** (ADR.17), et délègue l'envoi au provider retenu par la préférence.
- **Immédiat** : traité au fil de l'eau à la réception de l'événement (hors scheduler).
- Idempotence : une notification incluse dans un récap est marquée « diffusée » pour cette piste (pas de
  double envoi).

---

# API (esquisse, `/api/v1`)

| Méthode | Route | Accès |
|---------|-------|-------|
| `GET` | `/notifications` | mes notifications (in-app, historique) |
| `POST` | `/notifications/:id/read` | marquer lu |
| `GET/PUT` | `/me/preferences/notifications` | préférences individuelles (via Preferences) |
| `GET/PUT` | `/admin/notification-settings` | réglages globaux (Operator, `notification.manage`) |

DTO uniquement ; aucun secret exposé.

---

# Observabilité (ADR.23)

Métriques par étape : génération, routage, envoi, délai, succès/échec par canal ; `DeliveryLog` pour
l'audit ; `correlationId` propagé de l'événement métier au log de livraison.

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Modèle Notification + canal in-app + API perso + badge | conservés et **généralisés** |
| Email/push **stubbés** | `DeliveryProvider` réels, pilotés par la config Operator (secrets ADR.21) |
| Une seule source (changement d'état d'un event du planning) | multi-sources via Event Bus + Policies |
| Aucune préférence | préférences individuelles (User Preferences) + réglages globaux |

---

# Contraintes

- Domaine découplé (Event Bus) ; décision déterministe ; extensibilité par providers/policies ; Prisma
  confiné aux Repositories ; préférences dans User Preferences (source unique) ; secrets via ADR.21.
  Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.17-NotificationFramework · 99-ADR.20-UserPreferences · 99-ADR.21-SecretsManagement ·
99-ADR.23-Observability · 02-FSPEC.04-Notification-v3.0 · 04-UISPEC.04-Notification-v3.0 ·
03-TSPEC.05-Preferences-v3.0 · (V2) socle Notification

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du framework de notifications (Event Bus, policies, routeur double niveau, providers, planificateur de récaps). |
