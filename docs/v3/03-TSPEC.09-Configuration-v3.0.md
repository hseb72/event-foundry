# Configuration Operator — Spécification technique

**Document** : TSPEC.09

**Fichier** : 03-TSPEC.09-Configuration-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique des pages de configuration plateforme (technique / mail / IA) gérées
par l'Operator : stockage des paramètres non secrets, articulation avec le Secrets Management (ADR.21)
pour les identifiants, test de configuration, et historisation. Concrétise l'écran `OPE-005` prévu en V2.

---

# Position & module

Domaine `platform-config` (module NestJS Operator), Prisma confiné aux Repositories (ADR.02).
S'appuie sur `SecretsProvider` (TSPEC.08) pour toute valeur sensible et publie des événements de
changement de config sur l'Event Bus (invalidation de caches consommateurs).

```
platform-config/
  repositories/    PlatformSetting, ConfigChangeLog (Prisma)
  services/        lecture/écriture config, tests (mail, IA)
  controllers/     API Operator (/admin/config/*)
  dto/ · mappers/ · interfaces/
```

---

# Modèle de données (non secrets)

Les valeurs **secrètes** ne sont **pas** ici : seules des **références** (ADR.21) + des paramètres non
sensibles.

```prisma
model PlatformSetting {
  id        String  @id @default(uuid())
  section   ConfigSection  // TECHNICAL | MAIL | AI
  key       String
  value     Json           // valeur NON sensible (limites, hôte SMTP, modèle IA, flags…)
  secretRef String? @map("secret_ref") // référence de secret quand applicable (SMTP creds, clé IA)
  status    ConfigStatus   // DRAFT | CONFIGURED | TESTED | FAILED
  updatedBy String? @map("updated_by")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@unique([section, key])
  @@map("platform_settings")
}

model ConfigChangeLog {                     // historisation (RG-CFG-05)
  id         String  @id @default(uuid())
  section    ConfigSection
  key        String
  actor      String                          // Operator
  summary    String                          // description du changement (jamais de valeur secrète)
  changedAt  DateTime @default(now()) @map("changed_at")
  @@index([section, changedAt])
  @@map("config_change_logs")
}
```

- **Mail** : `MAIL.host/port/security/from` en clair ; les **identifiants** via `secretRef`
  (résolus à l'envoi — TSPEC.08).
- **IA plateforme** : `AI.provider/model/useCases/globalEnabled` en clair ; **clé** via `secretRef`.
  Le `globalEnabled=false` **coupe** l'IA partout (repli déterministe — RG-AI-06). Réutilise/miroir de
  `AiConfig` scope `PLATFORM` (TSPEC.07) — source unique côté `ai`, `platform-config` orchestre l'écran.
- **Technique** : `TECHNICAL.*` (limites, quotas, flags) — défauts système consommés par User
  Preferences (héritage — TSPEC.05).

---

# Tests de configuration

```ts
interface ConfigTester {
  testMail(cfg: MailConfig): Promise<TestResult>;   // envoi d'un message de test → statut
  testAi(cfg: AiPlatformConfig): Promise<TestResult>; // ping fournisseur → statut
}
```

- Un test met à jour `status` (`TESTED`/`FAILED`) du setting **et** du secret associé (SecretRef.status).
- Une fonctionnalité dépendante ne s'active que si le test est concluant (RG-CFG-03) : le vecteur email
  (TSPEC.04) lit `MAIL.status = TESTED`.

---

# Diffusion des changements

- À l'écriture, `platform-config` publie `PlatformConfigChanged { section }` sur l'Event Bus ; les
  consommateurs (notifications, ai, frontend) **invalident** leurs caches et rechargent la config
  effective. Évite les redéploiements pour un changement à chaud (ADR.12 config externalisée).

---

# API (esquisse, `/api/v1`)

| Méthode | Route | Accès |
|---------|-------|-------|
| `GET` | `/admin/config/:section` | Operator (`platform.configure`) |
| `PUT` | `/admin/config/:section` | Operator (valeurs non secrètes + `secretRef`) |
| `POST` | `/admin/config/mail/test` | Operator (`mail.configure`) |
| `POST` | `/admin/config/ai/test` | Operator |

Les secrets se saisissent via le composant SEC-01 (UISPEC.08) → `SecretsProvider.put` → `secretRef`.
Jamais de valeur secrète dans les réponses (RG-CFG-02).

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| `OPE-005 Configuration` prévu, non construit | concrétisé (technique/mail/IA) |
| Mail/push stubbés | mail opérationnel (SMTP réel via secret), testé |
| Config externalisée (env), pas d'écran | paramètres non sensibles éditables à chaud + historisation |

---

# Contraintes

- Aucune valeur secrète en base/API/UI (références seulement — ADR.21) ; test avant activation ;
  changements historisés (hors valeurs) et diffusés par l'Event Bus ; Prisma confiné aux Repositories ;
  source unique de la config IA côté module `ai`. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.21-SecretsManagement · 99-ADR.16/17/12 · 02-FSPEC.09-Configuration-v3.0 ·
04-UISPEC.09-Configuration-v3.0 · 03-TSPEC.04-Notification-v3.0 · 03-TSPEC.07-AI-v3.0 ·
03-TSPEC.08-Secrets-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique de la configuration Operator (settings non secrets + références de secrets, tests, diffusion). |
