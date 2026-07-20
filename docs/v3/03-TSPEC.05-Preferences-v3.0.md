# Préférences utilisateur — Spécification technique

**Document** : TSPEC.05

**Fichier** : 03-TSPEC.05-Preferences-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique du modèle **User Preferences** (ADR.20) : stockage structuré,
résolution hiérarchique (système → organisation → personnel), interface de consultation par les autres
modules, et migration depuis le champ `preferences` JSONB de la V2.

---

# Position & module

Domaine `user`/`preferences` (module NestJS), Prisma confiné aux Repositories (ADR.02). Exposé aux
autres modules via une **interface de service** `PreferencesService`
(`resolve(userId, key)`, `getCategory(userId, category)`), jamais via les entités.

```
preferences/
  repositories/    UserPreference (Prisma)
  services/        PreferencesService (résolution hiérarchique)
  defaults/        catalogue des clés + valeurs par défaut système
  controllers/     API /me/preferences
  dto/ · mappers/ · interfaces/
```

---

# Modèle de données

```prisma
model UserPreference {
  id        String  @id @default(uuid())
  userId    String  @map("user_id")
  category  PrefCategory  // GENERAL | INTERFACE | NOTIFICATIONS | DISCOVERY | AI | PRIVACY
  data      Json          // valeurs de la catégorie (structurées, sans secret)
  updatedAt DateTime @updatedAt @map("updated_at")
  createdAt DateTime @default(now()) @map("created_at")
  @@unique([userId, category])
  @@map("user_preferences")
}
```

- Une ligne **par (utilisateur, catégorie)** ; `data` JSONB structuré selon un **schéma documenté** par
  catégorie (validé par class-validator au niveau DTO).
- **Aucun secret** dans `data` (RG-PREF-05) : les préférences IA ne portent qu'un **choix de
  fournisseur** + **opt-in** + **cas autorisés** ; la clé API est une **référence logique** gérée par le
  Secrets Management (ADR.21 / TSPEC.08).
- **Défauts système** et **défauts d'organisation** ne sont pas dupliqués par utilisateur : ils vivent
  respectivement dans `defaults/` (code/config) et dans `Organization.settings` (TSPEC.02).

---

# Résolution hiérarchique

```ts
interface PreferencesService {
  resolve<T>(userId: string, key: PreferenceKey): Promise<T>;      // valeur effective
  getCategory(userId: string, category: PrefCategory): Promise<Record<string, unknown>>;
  update(userId: string, category: PrefCategory, patch: object): Promise<void>;
}
```

Ordre de résolution (ADR.20) — le niveau le plus spécifique **surcharge** le précédent :

```
défaut système  →  défaut organisation (org active)  →  préférence personnelle
```

- La résolution est **pure** (aucune décision métier) et **mise en cache** par utilisateur (invalidée à
  l'`update`).
- Une clé absente à tous les niveaux retourne son **défaut système explicite** (RG-PREF-03) — jamais
  `undefined`.

---

# Consommation par les autres modules

- **Notification** (TSPEC.04) : lit la catégorie `NOTIFICATIONS` (vecteur par fréquence).
- **Frontend** : lit `INTERFACE.theme` (clair/obscur/système) et `GENERAL.language`.
- **Discovery / Reco** : lit `DISCOVERY` (rayon pays+code postal, favoris).
- **AI** (TSPEC.07) : lit `AI` (fournisseur préféré, opt-in, cas) — la **clé** vient des secrets.

Chaque module **consulte** via `PreferencesService`, ne stocke rien en parallèle (RG-PREF-01/02).

---

# Migration depuis la V2

- La V2 stocke un champ **`preferences` JSONB** sur l'utilisateur (mis à jour par `updateProfile`).
- Migration : **répartir** ce JSONB en lignes `user_preferences` par catégorie ; les clés inconnues
  vont dans `GENERAL` en attendant une catégorisation. Migration Prisma **additive** (nouvelle table),
  le champ V2 peut être conservé en lecture le temps de la bascule puis retiré.
- Le **thème** (absent V2) est ajouté dans `INTERFACE` avec défaut `system`.

---

# API (esquisse, `/api/v1`)

| Méthode | Route | Accès |
|---------|-------|-------|
| `GET` | `/me/preferences` | toutes mes catégories (résolues) |
| `GET` | `/me/preferences/:category` | une catégorie résolue |
| `PUT` | `/me/preferences/:category` | mettre à jour mes préférences (validation DTO) |

DTO validés (class-validator) ; **rejet** de toute clé ressemblant à un secret (RG-PREF-05).

---

# Contraintes

- Source unique des préférences ; consultation via `PreferencesService` (abstraction) ; défauts
  explicites ; aucun secret ; aucune décision métier ; Prisma confiné aux Repositories ; évolutions
  additives et documentées. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.20-UserPreferencesModel · 99-ADR.16/17/21 · 02-FSPEC.05-Preferences-v3.0 ·
04-UISPEC.05-Preferences-v3.0 · 03-TSPEC.04-Notification-v3.0 · 03-TSPEC.08-Secrets-v3.0 ·
03-TSPEC.02-Organization-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du modèle centralisé de préférences (stockage par catégorie, résolution hiérarchique, migration V2). |
