# Identité visuelle par univers — Spécification d'interface (charte)

**Document** : UISPEC.13

**Fichier** : 04-UISPEC.13-VisualIdentity-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Documenter la **charte visuelle** des trois univers (Explorer / Organizer / Operator) : couleurs,
usage des tokens, éléments d'identité (icônes, vocabulaire, navigation) et coexistence avec les thèmes.
Cette UISPEC **ancre** la charte jusque-là présente uniquement dans `styles.css`. Met en œuvre FSPEC.13
/ TSPEC.13 (ADR.22).

---

# Charte de couleurs

| Univers | Couleur | Valeur | Signification |
|---------|---------|--------|---------------|
| **Explorer** | magenta | `#ec4899` | découverte, plaisir, communauté |
| **Organizer** | vert | `#16a34a` | production, gestion, croissance |
| **Operator** | violet | `#6d28d9` | supervision, autorité, technique |

- La couleur de l'univers **actif** est exposée par le token `--exp` (TSPEC.13).
- **Une page accessible à deux profils change de couleur selon le profil utilisé** (RG-VIS-03).

---

# Marque festive & dégradé signature

En complément de l'identité **par univers** (couleur `--exp`, qui régit l'**intérieur** de
l'application), EventFoundry possède une **identité de marque** commune, festive, utilisée sur les
surfaces **sans contexte d'expérience**. Elle matérialise le ton « Découvrez. Planifiez. Vivez. ».

## Dégradé de marque

Dégradé signature décliné du logo : **orange → rose → violet → indigo**.

| Token | Valeur | Usage |
|-------|--------|-------|
| `--brand-1` | `#f97316` (orange) | butée chaude du dégradé |
| `--brand-2` | `#ec4899` (rose) | — |
| `--brand-3` | `#8b5cf6` (violet) | accents (eyebrow, icônes de section) |
| `--brand-4` | `#6366f1` (indigo) | butée froide du dégradé |
| `--brand` / `--brand-strong` | `#7c3aed` / `#6d28d9` | aplat de marque (theme-color, focus neutres) |
| `--brand-gradient` | `linear-gradient(120deg, …)` | boutons `.btn-brand`, titres `.brand-text`, couvertures |
| `--brand-gradient-soft` | dégradé très pâle | fonds de bandes CTA |

## Où l'utiliser — et où **ne pas** l'utiliser

- **Marque (dégradé) autorisée** : page de garde publique (vitrine), pages d'authentification
  (connexion / inscription), logo, favicon, couvertures d'événement **sans image**, bande CTA.
- **Interdit à l'intérieur de l'application** : les écrans applicatifs restent gouvernés par `--exp`
  (RG-VIS-03). Le dégradé de marque **ne remplace pas** la couleur d'univers active pour les boutons
  primaires, chips, onglets, liens actifs d'un écran interne.

> Règle : *sans contexte d'expérience → marque ; avec contexte d'expérience → `--exp`.*

## Logo

Marque vectorielle (`shared/logo.component.ts`) : **calendrier + enclume + étoile + confettis** dans le
dégradé de marque, accompagnée du wordmark bicolore « **Event**Foundry » (« Event » neutre, « Foundry »
en dégradé). Taille paramétrable ; variante fond sombre (`onDark`) pour la sidebar. Identifiant de
dégradé unique par instance (plusieurs logos sur une page). Le favicon reprend l'icône (SVG *data URI*).

## Cartes d'événement illustrées

- Chaque carte d'événement (`shared/event-card.component.ts`) et la vitrine affichent une **couverture
  pleine largeur** : la **1ʳᵉ image** de l'événement (`media[]`) si disponible, sinon un **dégradé
  festif déterministe** (dérivé de l'`id`, palette déclinée de la marque). Une **chip d'activité** est
  incrustée sur la couverture ; le prix éventuel en surimpression.
- Interaction : léger *lift* au survol (ombre `--shadow`). La **pastille de participation** (palette
  planning, UISPEC.12) reste portée par la bordure gauche `--stripe`.

---

# Usage des tokens (règles UI)

Les composants **n'utilisent que des tokens**, jamais de couleur en dur :

| Élément | Token à utiliser |
|---------|------------------|
| Bouton primaire (`.btn-primary`) | `--exp` (fond), `--exp-contrast` (texte) |
| Chips / facettes actives | `--exp` / `--exp-weak` |
| Onglets actifs | `--exp` (indicateur) |
| Bordures d'accent | `--exp` |
| Liens de navigation actifs | `--exp` |
| Fonds, textes, séparateurs | tokens **neutres** (`--surface`, `--text`, `--muted`) pilotés par le thème |
| Bouton de marque (`.btn-brand`) | `--brand-gradient` — **hors contexte d'expérience uniquement** (vitrine, auth) |
| Titre festif (`.brand-text`), couverture de repli | `--brand-gradient` |

> **Interdit** : `var(--accent)` en dur (couleur Explorer figée) dans un composant partagé — cause de
> la dette du chantier §7. Utiliser `var(--exp)`.
>
> **Interdit** : `--brand-gradient` / `.btn-brand` sur un écran **interne** (contexte d'expérience) —
> réservé aux surfaces sans univers actif (cf. « Marque festive »).

---

# Éléments d'identité par univers (ADR.22)

Au-delà de la couleur, chaque univers peut définir :

- **Icônes / illustrations** cohérentes avec le ton de l'univers.
- **Vocabulaire** adapté (Explorer : « découvrir », « mon planning » ; Organizer : « publier »,
  « imports », « statistiques » ; Operator : « superviser », « configurer », « journaux »).
- **Navigation / tableaux de bord** propres à chaque univers, sans impact sur le domaine métier.

Ces éléments sont documentés dans les UISPEC de chaque domaine ; UISPEC.13 fixe le **cadre commun**.

---

# Repère de l'univers actif

- La **sidebar** et le **menu profil** (UISPEC.11) portent la couleur `--exp` de l'univers actif.
- Le **sélecteur d'expérience** (bascule Explorer/Organizer/Operator) met à jour instantanément toute
  l'UI (couleur, navigation, vocabulaire) — repère immédiat (RG-VIS-01).

---

# Thèmes (préférence utilisateur)

- **Clair / sombre / contraste élevé** : préférence utilisateur (UISPEC.05), pilote les **tokens
  neutres**.
- L'**identité d'univers** (`--exp`) reste **inchangée** selon le thème (RG-VIS-05) ; on ajuste
  seulement les contrastes si nécessaire (accessibilité).

---

# Remise en cohérence (chantier §7)

Checklist d'audit à appliquer aux écrans existants (dette V1→V2) :

- [ ] boutons primaires → `--exp` ;
- [ ] chips / facettes → `--exp` / `--exp-weak` ;
- [ ] onglets actifs → `--exp` ;
- [ ] bordures d'accent → `--exp` ;
- [ ] liens de navigation actifs → `--exp` ;
- [ ] suppression de tout `var(--accent)` en dur dans les composants partagés.

Quick win : substitution globale `--accent` → `--exp` + `.btn-primary` sensible à `--exp`.

---

# Accessibilité

- Contrastes conformes (texte sur `--exp` via `--exp-contrast`) ; vérifier chaque couleur d'univers sur
  fonds clair et sombre. Le **contraste élevé** est un thème dédié.

---

# Composants

Jeton de couleur d'univers · bouton primaire tokenisé · **bouton de marque** (`.btn-brand`) · **logo**
(`app-logo`) · **carte d'événement illustrée** (`app-event-card`) · chips/facettes · onglets ·
sélecteur d'expérience · sélecteur de thème (renvoi UISPEC.05).

---

# États communs

Les comportements d'états (chargement/vide/erreur) sont définis par domaine ; UISPEC.13 ne régit que
l'**identité visuelle**.

---

# Documents liés

99-ADR.22-ExperienceIdentityStrategy · 02-FSPEC.13-VisualIdentity-v3.0 · 03-TSPEC.13-VisualIdentity-v3.0 ·
04-UISPEC.05-Preferences-v3.0 · 04-UISPEC.11-Profile-v3.0 · (V2) `styles.css`, `shell.component.ts`

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première charte d'identité visuelle par univers (couleurs, tokens, vocabulaire, thèmes, remise en cohérence). |
| 3.1 | Ajout de la **marque festive** : dégradé signature `--brand-*`, logo vectoriel, boutons `.btn-brand` / titres `.brand-text`, cartes d'événement illustrées (couverture image ou dégradé de repli). Règle de coexistence : marque hors contexte d'expérience, `--exp` à l'intérieur de l'application. |
