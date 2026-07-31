# Gestion des secrets — Spécification technique

**Document** : TSPEC.08

**Fichier** : 03-TSPEC.08-Secrets-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique du composant **Secrets Management** (ADR.21) : abstraction Secrets
Provider, référence logique, portées (plateforme / organisation / utilisateur), résolution tardive,
rotation, journalisation sans valeur, et portabilité entre gestionnaires d'infrastructure.

---

# Position & module

Domaine `secrets` (module NestJS transverse), Prisma confiné aux Repositories (ADR.02). Les
consommateurs (import, ai, mail…) dépendent d'une **interface** `SecretsProvider`, jamais d'une
implémentation d'infrastructure (ADR.07/21).

```
secrets/
  ports/           SecretsProvider (interface de résolution)
  backends/        adaptateurs (K8sSecretBackend, VaultBackend, EnvBackend…)
  repositories/    SecretRef, SecretAccessLog (Prisma) — MÉTADONNÉES uniquement
  services/        cycle de vie (création, rotation), masquage
  dto/ · mappers/ · interfaces/
```

---

# Port Secrets Provider (abstraction)

```ts
interface SecretsProvider {
  put(ref: SecretRefInput, value: string): Promise<SecretRef>; // stocke chiffré côté backend
  resolve(reference: string, ctx: AccessContext): Promise<string>; // valeur — au point d'usage seulement
  rotate(reference: string, newValue: string): Promise<void>;      // référence inchangée
  describe(reference: string): Promise<SecretMetadata>;            // métadonnées masquées (pas la valeur)
  revoke(reference: string): Promise<void>;
}
```

- **Résolution tardive** : `resolve` n'est appelé qu'au **moment de l'appel externe** (ADR.21). La
  valeur n'est **jamais** conservée en mémoire au-delà du besoin, ni journalisée.
- **Backends interchangeables** : K8s Secrets, Vault, AWS/Azure/GCP, variables sécurisées — choix
  d'infrastructure (RG-SEC-08). L'application ne dépend que du port.

---

# Modèle de données (métadonnées uniquement)

La base applicative **ne stocke jamais la valeur** — seulement une **référence** et des métadonnées.

```prisma
model SecretRef {
  id           String  @id @default(uuid())
  reference    String  @unique              // identifiant logique (clé dans le backend)
  type         SecretType                    // API_KEY | SMTP | OAUTH_SECRET | TLS_CERT | AI_KEY | …
  scope        SecretScope                   // PLATFORM | ORGANIZATION | USER
  scopeId      String? @map("scope_id")      // orgId / userId selon la portée
  provider     String?                        // fournisseur associé (openai, smtp host…)
  lastFour     String? @map("last_four")     // 4 derniers caractères pour l'affichage masqué
  status       SecretStatus                   // CONFIGURED | TESTED | FAILED | EXPIRED
  createdAt    DateTime @default(now()) @map("created_at")
  rotatedAt    DateTime? @map("rotated_at")
  expiresAt    DateTime? @map("expires_at")
  @@index([scope, scopeId])
  @@map("secret_refs")
}

model SecretAccessLog {                        // journalisation SANS valeur (RG-SEC-07)
  id          String  @id @default(uuid())
  reference   String
  consumer    String                           // composant consommateur
  type        SecretType
  result      AccessResult                      // SUCCESS | DENIED | ERROR
  accessedAt  DateTime @default(now()) @map("accessed_at")
  @@index([reference, accessedAt])
  @@map("secret_access_logs")
}
```

- **Valeur** : stockée **chiffrée** dans le backend (jamais dans `secret_refs`) — RG-SEC-04.
- **`lastFour`** : seule fraction affichable (`sk-…abcd`) — RG-SEC-03. Jamais plus.

---

# Portées & isolation

- **PLATFORM** : secrets de la plateforme (Operator) — SMTP par défaut, IA plateforme.
- **ORGANIZATION** : secrets d'une organisation (connecteurs, IA org) — isolés par tenant
  (`scopeId = organizationId`, contrôle via `OrganizationContextGuard` — TSPEC.02).
- **USER** : exceptionnel et justifié (clé IA personnelle — chantier §2).

`resolve` vérifie que le **contexte d'accès** (utilisateur/organisation actifs, composant) est
**autorisé** pour la portée demandée ; sinon `DENIED` journalisé (RG-SEC-06/07).

---

# Rotation & cycle de vie

- **Rotation** (`rotate`) : remplace la valeur dans le backend ; la **référence est inchangée** →
  aucun impact applicatif (RG-SEC-05). `rotatedAt` mis à jour ; statut recalculé au prochain test.
- **Expiration** : `expiresAt` optionnel ; un secret expiré passe `EXPIRED` et n'est plus résolu
  (repli / erreur explicite côté consommateur).
- **Révocation** (`revoke`) : supprime la valeur du backend et marque la référence hors service.

---

# Journalisation & observabilité (ADR.21/23)

- Chaque `resolve`/`rotate`/`revoke` produit un `SecretAccessLog` **sans valeur** (date, consommateur,
  type, résultat).
- Métriques : accès, erreurs, rotations, expirations, **tentatives non autorisées** (alerte sécurité).
- **Garde-fou logs** : aucun logger ne doit sérialiser une valeur ; filtre de rédaction sur les champs
  sensibles (défense en profondeur — RG-SEC-01).

---

# Intégration aux consommateurs

- **Import** (TSPEC.01) : `ImportSource` porte des **références** de secrets (auth) ; le worker
  `resolve` au moment du Fetch.
- **IA** (TSPEC.07) : `AiConfig.secretRef` → `resolve` au moment de l'appel.
- **Mail** (TSPEC.09) : identifiants SMTP par référence, résolus à l'envoi.

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Secrets injectés par K8s (règle d'or §10) | `K8sSecretBackend` derrière `SecretsProvider` |
| Config externalisée, pas de composant dédié | Composant Secrets (références, portées, rotation, logs) |
| — | secrets organisation/utilisateur (IA), masquage, journalisation d'accès |

---

# Contraintes

- Aucune valeur en base applicative, en logs, en API, en UI ni en Git ; référence logique + résolution
  tardive ; portées isolées ; rotation transparente ; backends interchangeables (abstraction) ; Prisma
  confiné aux Repositories (métadonnées seules). Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.21-SecretsManagement · 99-ADR.13/16/18/23 · 02-FSPEC.08-Secrets-v3.0 ·
04-UISPEC.08-Secrets-v3.0 · 03-TSPEC.01-Import-v3.0 · 03-TSPEC.07-AI-v3.0 ·
03-TSPEC.09-Configuration-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du Secrets Management (provider, référence logique, portées, rotation, journalisation sans valeur). |
