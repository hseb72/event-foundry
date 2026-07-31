# Identité visuelle par univers — Spécification fonctionnelle

**Document** : FSPEC.13

**Fichier** : 02-FSPEC.13-VisualIdentity-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire la **stratégie d'identité visuelle** des trois univers (expériences) de la plateforme —
**Explorer**, **Organizer**, **Operator** — afin que l'utilisateur **reconnaisse immédiatement** le
contexte dans lequel il évolue, tout en **mutualisant** les composants fonctionnels.

Met en œuvre **ADR.22** (Experience Identity Strategy) et répond au chantier §7 (charte de couleurs
non respectée à remettre en ordre). Le cœur normatif est porté par l'**UISPEC.13** (charte) et le
**TSPEC.13** (tokens de design) ; cette FSPEC en fixe le cadre fonctionnel.

> **Séparation fondamentale (ADR.22)** : le **domaine métier ignore totalement** les couleurs, thèmes
> et composants graphiques. L'identité est déterminée à la **couche de présentation** uniquement.

---

# Les trois univers

| Univers | Public | Priorités | Couleur (charte) |
|---------|--------|-----------|------------------|
| **Explorer** | utilisateurs cherchant des activités | découverte, recherche, recommandations, planning | **magenta** `#ec4899` |
| **Organizer** | organisations qui publient | gestion, imports, statistiques, contenus | **vert** `#16a34a` |
| **Operator** | administrateurs plateforme | supervision, configuration, observabilité, support | **violet** `#6d28d9` |

---

# Principe : la couleur suit l'expérience active

**Tranché (ADR.22 / chantier §7)** : la couleur **suit l'expérience active** de l'utilisateur. Une page
accessible à **deux profils** change de couleur **selon le profil utilisé**, pour un repère visuel clair
du rôle en cours. Les composants n'emploient **que des tokens** de design (jamais de couleur en dur).

---

# Règles fonctionnelles

## RG-VIS-01 — Repère immédiat du contexte

L'utilisateur reconnaît instantanément l'univers actif (couleur, navigation, vocabulaire). Le
basculement d'expérience change ce repère.

## RG-VIS-02 — Composants mutualisés, identité variable

Les composants fonctionnels sont **partagés** entre univers et adaptent **automatiquement** leur
identité visuelle via les tokens (ADR.22). Aucune duplication de composant par couleur.

## RG-VIS-03 — Couleur = expérience active

La couleur d'accent d'une page **dépend de l'expérience active**, pas de la page. Deux profils ouvrant
la même page voient deux couleurs différentes.

## RG-VIS-04 — Domaine métier indépendant de la présentation

Le domaine métier ne connaît ni couleurs, ni thèmes, ni composants graphiques (ADR.22 §Architecture).

## RG-VIS-05 — Thème utilisateur orthogonal

Le **thème** (clair / sombre / contraste élevé) est une **préférence utilisateur** (FSPEC.05) ;
il coexiste avec l'identité d'univers **sans la modifier** (ADR.22 §Thèmes).

## RG-VIS-06 — Extensibilité

L'ajout d'une future expérience (Volunteer, Moderator, Partner…) n'exige **aucune** modification des
composants métier (ADR.22 §Évolutivité).

---

# État actuel à corriger (chantier §7)

- La charte **existe** (3 univers, 3 couleurs) mais **n'est pas respectée** : la plupart des composants
  utilisent `var(--accent)` (couleur **Explorer fixe**) au lieu de `var(--exp)` (expérience active).
- Des écrans **ayant changé de rôle** entre V1 et V2 ont conservé la couleur Explorer d'origine.
- **À faire** : auditer et remettre en cohérence boutons primaires, chips/facettes, onglets actifs,
  bordures d'accent, liens de navigation actifs → adopter la couleur de l'univers **actif**.

---

# Correspondance avec la V2

- Le mécanisme `--exp` **existe déjà** (la sidebar pose `[style.--exp]="accent()"` sur `.layout`) ; la
  charte et le mapping des expériences sont dans `styles.css` / `shell.component.ts`.
- La V3 **généralise** l'usage des tokens (remplacer `var(--accent)` par `var(--exp)`), rend
  `.btn-primary` sensible à `--exp`, et **ancre la charte dans un UISPEC** (aujourd'hui seulement dans
  le CSS).

---

# Documents liés

99-ADR.22-ExperienceIdentityStrategy · 99-ADR.12/18/20 · 03-TSPEC.13-VisualIdentity-v3.0 ·
04-UISPEC.13-VisualIdentity-v3.0 · 02-FSPEC.05-Preferences-v3.0 · 02-FSPEC.11-Profile-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Cadre fonctionnel de l'identité visuelle par univers (couleur suivant l'expérience active, composants mutualisés). |
