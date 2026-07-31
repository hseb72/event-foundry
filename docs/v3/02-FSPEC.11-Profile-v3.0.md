# Profil & identité utilisateur — Spécification fonctionnelle

**Document** : FSPEC.11

**Fichier** : 02-FSPEC.11-Profile-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le **menu profil unifié** : un point d'entrée unique (pastille avatar + nickname, **toujours
visible**) regroupant données personnelles, rôles/permissions, organisations, configurations
personnelles (IA) et préférences (dont le **thème**). Résout le problème V2 du bloc profil qui sort du
viewport et de l'entrée `[Mon identité]` dissociée.

Met en œuvre le chantier §5, en s'appuyant sur **ADR.20** (préférences) et **ADR.22** (identité
visuelle du rôle actif). Réutilise l'`IdentityComponent` (`/me`) de la V2 en le réorganisant.

> **Modèle d'identité (V2, préservé)** : une seule identité de compte, **plusieurs rôles** attribués
> entre lesquels l'utilisateur bascule. ADR.22 régit l'**identité visuelle** du rôle actif (couleur,
> repère) — aucun changement du modèle de compte.

---

# Menu profil unifié (chantier §5)

- **Pastille** : avatar + **nickname**, **toujours visible en bas à gauche** (sidebar **sticky**,
  hauteur viewport, scroll interne — le quick win V2 est déjà en place).
- **Point d'entrée unique** vers la gestion du profil, remplaçant le bloc épars (login/email · mode de
  souscription · `[Se déconnecter]`) et l'entrée `[Mon identité]` isolée.

## Sections de la gestion de profil

| Section | Contenu |
|---------|---------|
| **Données personnelles** | **nickname** (modifiable), **mail de login** (rappel, non modifiable), avatar |
| **Rôles & permissions** | rôles attribués (Explorer/Organizer/Operator) + permissions (lecture) |
| **Organisations** | organisations de l'utilisateur + rôle d'organisation (FSPEC.02) |
| **Configurations personnelles** | **IA** (fournisseur, opt-in, cas — FSPEC.07) et autres réglages techniques personnels |
| **Autres préférences** | **thème** clair / obscur / système, langue, densité… (FSPEC.05) |
| **Session** | mode de souscription, **[Se déconnecter]** |

---

# Règles fonctionnelles

## RG-PRO-01 — Point d'entrée unique et persistant

Le menu profil (avatar + nickname) est **toujours visible** (sidebar sticky), quel que soit le
défilement du contenu. Il est l'unique accès à la gestion du profil.

## RG-PRO-02 — Nickname modifiable, mail non modifiable

Le **nickname** (`displayName`) est modifiable ; le **mail de login** est rappelé mais **non
modifiable** (identifiant de compte).

## RG-PRO-03 — Préférences via User Preferences

Les préférences (thème, langue…) sont lues/écrites via le **modèle User Preferences** (FSPEC.05) —
source unique. Le menu profil n'est qu'une **vue** ; il ne duplique pas les préférences.

## RG-PRO-04 — Aucun secret affiché

Les configurations personnelles renvoyant à des secrets (clé IA) n'affichent que des **métadonnées
masquées** (UISPEC.08) ; la clé n'est jamais réaffichée (RG-SEC-03).

## RG-PRO-05 — Identité visuelle du rôle actif

Le menu reflète le **rôle actif** (repère visuel — ADR.22) ; la couleur suit l'expérience active
(tokens). Le basculement de rôle/expérience met à jour le repère.

## RG-PRO-06 — Rôles/permissions en lecture

Les rôles et permissions sont **consultables** dans le profil ; leur **attribution** reste du ressort
de l'administration (RBAC — ADR.08 V2), pas du menu profil.

---

# Points à trancher (chantier §5)

- **Avatar** : image uploadée (MinIO) **vs** initiales générées / gravatar. **Recommandation** :
  initiales générées en V3 (simple, sans stockage d'image), upload MinIO en évolution.
- **Sélecteur d'expérience / organisation active** : reste **en haut** de la sidebar **vs** rejoint le
  menu profil. **Recommandation** : contexte (expérience + organisation) en haut de la sidebar ;
  données de compte dans le menu profil (séparation claire navigation ↔ compte).

---

# Correspondance avec la V2

- La V2 fournit `IdentityComponent` (`/me`) affichant rôles / permissions / expériences / organisations,
  et `updateProfile` (`displayName` + `preferences` JSONB). La V3 **réorganise** en sections et fait du
  menu profil le **point d'entrée unique**. **Avatar** et **thème** sont **nouveaux** (absents V2).
- La sidebar **sticky** (bloc profil toujours visible) est **déjà corrigée** (quick win livré).

---

# Parcours

- **Modifier son nickname / thème** : ouvrir le menu profil → Données personnelles / Préférences →
  enregistrer (prise en compte immédiate du thème).
- **Consulter ses rôles / organisations** : menu profil → sections dédiées.
- **Configurer son IA personnelle** : menu profil → Configurations personnelles → renvoi vers AI-01.

(Détail des écrans : UISPEC.11 Profile.)

---

# Hors périmètre (V3)

- Gestion multi-comptes / fusion de comptes (Backlog V4).
- Avatars personnalisés avancés / bannières (Backlog V4).

---

# Documents liés

99-ADR.20-UserPreferencesModel · 99-ADR.22-ExperienceIdentityStrategy · (V2) ADR.08/ADR.11 ·
03-TSPEC.11-Profile-v3.0 · 04-UISPEC.11-Profile-v3.0 · 02-FSPEC.05-Preferences-v3.0 ·
02-FSPEC.02-Organization-v3.0 · 02-FSPEC.07-AI-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle du menu profil unifié (sections, thème, avatar, identité visuelle du rôle actif). |
