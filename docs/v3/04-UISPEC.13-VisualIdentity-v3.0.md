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

> **Interdit** : `var(--accent)` en dur (couleur Explorer figée) dans un composant partagé — cause de
> la dette du chantier §7. Utiliser `var(--exp)`.

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

Jeton de couleur d'univers · bouton primaire tokenisé · chips/facettes · onglets · sélecteur
d'expérience · sélecteur de thème (renvoi UISPEC.05).

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
