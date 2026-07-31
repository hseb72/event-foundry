# Préférences utilisateur — Spécification fonctionnelle

**Document** : FSPEC.05

**Fichier** : 02-FSPEC.05-Preferences-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le modèle **User Preferences** : un périmètre **unique** regroupant toutes les préférences
personnelles (général, interface, notifications, découverte, IA, confidentialité). Il est la **référence
officielle** consultée par les autres modules, sans jamais en devenir propriétaires.

Met en œuvre **ADR.20** (User Preferences Model), en lien avec **ADR.17** (notifications), **ADR.16**
(IA) et **ADR.21** (secrets). Intègre les chantiers §5 (menu profil, thème) et §1 (préférences de
notification).

> **Principe** : les préférences **n'entraînent aucune décision métier**. Elles adaptent le comportement
> (affichage, canaux, langue…) sans modifier les règles fonctionnelles.

---

# Catégories de préférences (ADR.20)

| Catégorie | Exemples | Domaine consommateur |
|-----------|----------|----------------------|
| **Général** | langue, fuseau horaire, format de date/heure, unités | transverse |
| **Interface** | **thème** (clair/obscur/système), densité, page d'accueil | Frontend (chantier §5) |
| **Notifications** | pour chaque fréquence active, vecteur choisi (ou aucun) | Notification (FSPEC.04) |
| **Découverte** | rayon (pays + code postal), activités/lieux favoris, niveau de perso | Discovery / Reco |
| **IA** | fournisseur préféré, opt-in, cas d'usage autorisés | AI (FSPEC.07) |
| **Confidentialité** | visibilité du profil, partage d'activités, stats anonymisées | transverse |

> Les **suivis** (organisateurs / activités / lieux) **ne sont pas** des préférences : ce sont des
> entités métier à cycle de vie propre (**Follow** — FSPEC.06 / ADR.19). Les préférences « Découverte »
> peuvent référencer des favoris, mais le suivi reste distinct.

---

# Résolution hiérarchique (ADR.20)

Une préférence effective est résolue par **surcharge** :

```
1. Valeurs système (défauts plateforme)
2. Valeurs de l'organisation (défauts d'une organisation, le cas échéant)
3. Préférences personnelles (utilisateur)
```

Chaque niveau **surcharge** le précédent. Toute préférence possède une **valeur par défaut explicite**
(RG-PREF-03), garantissant un comportement cohérent avant toute personnalisation.

---

# Règles fonctionnelles

## RG-PREF-01 — Source unique

Toutes les préférences personnelles vivent dans User Preferences. Aucun module ne stocke ses propres
préférences en parallèle (pas de duplication).

## RG-PREF-02 — Consultation, pas propriété

Les modules **consultent** les préférences dont ils ont besoin ; ils n'en deviennent jamais
propriétaires et ne les dupliquent pas.

## RG-PREF-03 — Valeur par défaut explicite

Chaque préférence a une valeur par défaut documentée. Une préférence absente est résolue par héritage
(système → organisation → personnel), jamais indéfinie.

## RG-PREF-04 — Aucune décision métier

Les préférences n'altèrent pas les règles fonctionnelles (déterminisme, classification, validation).
Elles n'influencent que présentation, canaux, langue, périmètre de découverte.

## RG-PREF-05 — Aucun secret

Les préférences ne contiennent **jamais** de secret (clé API, mot de passe, jeton). Ces éléments
relèvent du **Secrets Management** (ADR.21) ; les préférences IA ne référencent qu'un **choix de
fournisseur** et un **opt-in**, pas la clé (FSPEC.07 / FSPEC.08).

## RG-PREF-06 — Rétrocompatibilité & évolution

L'ajout d'une préférence est additif, avec valeur par défaut, sans casser l'existant (indépendance des
domaines, documentation).

## RG-PREF-07 — Confidentialité individuelle

Les préférences d'un utilisateur n'ont **aucun impact** sur les autres utilisateurs.

---

# Parcours

- **Régler ses préférences** : depuis le **menu profil** (FSPEC.11), l'utilisateur ouvre ses
  préférences par catégorie → modifie (ex. thème, langue, notifications) → prise en compte immédiate.
- **Un module consomme une préférence** : au besoin, un module lit la préférence effective (résolue par
  héritage) — ex. le Frontend applique le thème, le framework de notifications lit le vecteur par
  fréquence.

(Détail des écrans : UISPEC.05 Preferences, intégré au menu profil UISPEC.11.)

---

# Correspondance avec la V2 implémentée

- La V2 stocke des préférences dans un champ **`preferences` (JSONB)** de l'utilisateur, mis à jour par
  `updateProfile`. La V3 **structure** ce champ en **catégories** documentées et en fait la **référence
  officielle** consultée par les autres modules. Le **thème** n'était pas implémenté (chantier §5) → il
  entre dans la catégorie **Interface**.

---

# Hors périmètre (V3)

- Profils de préférences multiples / exportables (Backlog V4).
- Préférences par appareil (Backlog V4).

---

# Documents liés

99-ADR.20-UserPreferencesModel · 99-ADR.16/17/21 · 03-TSPEC.05-Preferences-v3.0 ·
04-UISPEC.05-Preferences-v3.0 · 02-FSPEC.04-Notification-v3.0 · 02-FSPEC.06-Follow-v3.0 ·
02-FSPEC.07-AI-v3.0 · 02-FSPEC.11-Profile-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle du modèle centralisé de préférences utilisateur. |
