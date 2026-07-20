# Profil & identité utilisateur — Spécification technique

**Document** : TSPEC.11

**Fichier** : 03-TSPEC.11-Profile-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique du menu profil unifié : agrégation des données de compte (identité,
rôles, organisations), lecture/écriture des préférences via User Preferences (TSPEC.05), avatar, et
articulation avec l'identité visuelle du rôle actif (ADR.22). Réorganise l'`IdentityComponent`/
`updateProfile` de la V2 sans refondre le modèle de compte.

---

# Position

- **Backend** : réutilise les modules `users`/`auth` (V2) et l'endpoint `/me` ; le profil n'introduit
  pas de nouveau domaine métier — il **agrège** des données existantes + les préférences (TSPEC.05) +
  les organisations (TSPEC.02).
- **Frontend** : `IdentityComponent` réorganisé en sections ; le menu profil est un composant de layout
  (sidebar) **sticky**.

---

# Données agrégées par `/me`

```ts
interface MeView {
  account: { id; email; displayName; avatar?: AvatarMeta };   // email non modifiable
  roles: RoleAssignment[];          // Explorer | Organizer | Operator (+ permissions, lecture)
  organizations: OrgMembershipView[]; // orgs + OrgRole (TSPEC.02)
  activeExperience: ExperienceId;    // rôle/expérience actif (identité visuelle — ADR.22)
  subscription: SubscriptionInfo;    // mode de souscription (V2)
  // préférences résolues via PreferencesService (non dupliquées ici)
}
```

- **Agrégation** : le service `/me` compose ces vues à partir de `users`/`auth`, `organization`
  (memberships) et `preferences` (résolution). Aucune duplication de stockage.
- **Email** exposé en lecture seule (identifiant de compte — RG-PRO-02).

---

# Modification du profil

- **Nickname** (`displayName`) : `PATCH /me` (déjà en V2). Validation DTO (class-validator).
- **Préférences** (thème, langue…) : `PUT /me/preferences/:category` → **User Preferences** (TSPEC.05),
  jamais un stockage parallèle (RG-PRO-03).
- **Configurations personnelles IA** : renvoient au module `ai` (`AiConfig` scope `USER`) et aux
  **secrets** (référence, jamais la clé — TSPEC.07/08).

---

# Avatar

- **Décision recommandée (FSPEC.11)** : **initiales générées** en V3 (couleur dérivée du nickname/rôle,
  aucun stockage d'image) → `AvatarMeta { kind: 'initials', seed, color }`.
- **Évolution** : upload d'image (MinIO) → `AvatarMeta { kind: 'image', objectKey }` ; le contrat
  `AvatarMeta` est prévu pour accueillir les deux sans refonte.

---

# Identité visuelle du rôle actif (ADR.22)

- Le layout expose `activeExperience` ; la sidebar pose le token `--exp` = couleur de l'expérience
  active (mécanisme V2 : `[style.--exp]="accent()"`). Le menu profil et ses composants n'utilisent que
  des **tokens** (`var(--exp)`), jamais de couleur en dur (cf. UISPEC.13 VisualIdentity).
- Le basculement d'expérience met à jour `--exp` et le repère du menu profil.

---

# Sidebar sticky (quick win livré)

- `.sidebar { position: sticky; top: 0; align-self: start; height: 100vh; overflow-y: auto; }` +
  reset mobile en `@media (max-width: 720px)` — **déjà en place** (chantier §5, quick win). Le bloc
  profil reste visible quel que soit le défilement (RG-PRO-01).

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| `IdentityComponent` (`/me`) : rôles/permissions/expériences/orgs | réorganisé en sections, point d'entrée unique |
| `updateProfile` (`displayName` + `preferences` JSONB) | `PATCH /me` + préférences via User Preferences (catégorisées) |
| Pas d'avatar, pas de thème | `AvatarMeta` (initiales) + thème (Interface) |
| Sidebar défilante (bloc profil perdu) | sidebar **sticky** (déjà corrigé) |

---

# Contraintes

- Le profil **agrège**, ne duplique pas (préférences via User Preferences, orgs via Organization,
  secrets via Secrets) ; email non modifiable ; aucun secret réaffiché ; tokens de design uniquement
  (ADR.22) ; réutilisation maximale des modules V2. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.20/22 · (V2) ADR.08/ADR.11 · 02-FSPEC.11-Profile-v3.0 · 04-UISPEC.11-Profile-v3.0 ·
03-TSPEC.05-Preferences-v3.0 · 03-TSPEC.02-Organization-v3.0 · 03-TSPEC.07-AI-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du menu profil unifié (agrégation /me, préférences, avatar, identité visuelle). |
