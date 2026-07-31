# Identité visuelle par univers — Spécification technique

**Document** : TSPEC.13

**Fichier** : 03-TSPEC.13-VisualIdentity-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir la mise en œuvre technique (Frontend) de l'identité visuelle par univers (ADR.22) : **tokens de
design**, mécanisme `--exp` (couleur de l'expérience active), coexistence avec les thèmes utilisateur,
et plan de remise en cohérence de la charte (chantier §7). Le domaine métier n'est **pas** concerné
(présentation uniquement).

---

# Position

Capacité **Frontend** (Angular). Aucune donnée métier ; aucun impact backend. Les tokens vivent dans la
couche de présentation (`styles.css` global + composants standalone).

---

# Tokens de design

Principe (ADR.22) : les composants **n'emploient que des tokens**, jamais de couleur en dur.

| Token | Rôle |
|-------|------|
| `--exp` | **couleur de l'expérience active** (accent contextuel) — valeur posée par le layout |
| `--exp-contrast` | couleur de texte sur fond `--exp` |
| `--exp-weak` | variante atténuée (fonds de chips, survols) |
| `--explorer` / `--organizer` / `--operator` | couleurs de référence par univers (source de `--exp`) |
| `--surface`, `--text`, `--muted`, … | tokens neutres, pilotés par le **thème** (clair/sombre) |

- **Valeurs de référence** (charte) : Explorer `#ec4899`, Organizer `#16a34a`, Operator `#6d28d9`.
- `--exp` est **dérivé** de l'expérience active, pas fixé par la page.

---

# Mécanisme `--exp` (expérience active)

- Le layout (`shell.component.ts`) pose `--exp` sur le conteneur racine :
  `[style.--exp]="accent()"`, où `accent()` mappe l'expérience active → couleur d'univers (mécanisme
  **déjà présent** en V2).
- Tous les composants descendants héritent de `--exp` et l'utilisent (`background: var(--exp)`,
  `border-color: var(--exp)`, etc.).
- **Basculement d'expérience** : changer l'expérience active met à jour `accent()` → `--exp` → toute
  l'UI se recolore, sans recharger (RG-VIS-03).

---

# Coexistence avec les thèmes (ADR.22 §Thèmes)

- Le **thème** (clair / sombre / contraste élevé) est une **préférence utilisateur** (TSPEC.05) qui
  pilote les tokens **neutres** (`--surface`, `--text`…), via `@media (prefers-color-scheme)` et un
  attribut de thème sur la racine.
- L'**identité d'univers** (`--exp`) reste **inchangée** par le thème (orthogonalité — RG-VIS-05) ;
  seules les variantes de contraste s'ajustent si nécessaire.

---

# Remise en cohérence de la charte (chantier §7)

Plan d'action (dette V1→V2) :

1. **Audit** : recenser les usages de `var(--accent)` (couleur Explorer fixe) dans les composants.
2. **Substitution** : remplacer systématiquement `var(--accent)` par `var(--exp)` sur : **boutons
   primaires**, **chips / facettes**, **onglets actifs**, **bordures d'accent**, **liens de navigation
   actifs**.
3. `.btn-primary` (et équivalents) rendus **sensibles à `--exp`**.
4. **Garde-fou** : interdire les couleurs en dur dans les composants (revue / lint de style) — seule la
   charte (`styles.css`) définit les valeurs de référence.

> **Quick win** possible et **indépendant** : substitution `--accent` → `--exp` + `.btn-primary`
> sensible à `--exp`, réalisable sans attendre le reste de la V3 (chantier §7).

---

# Extensibilité

- Ajouter une expérience (Volunteer, Moderator, Partner…) = définir une couleur d'univers
  (`--partner`, …) et l'ajouter au mapping `accent()`. **Aucun** composant métier modifié (RG-VIS-06).

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| `--exp` posé par la sidebar (`[style.--exp]`) | conservé et **généralisé** à tous les composants |
| `var(--accent)` (Explorer fixe) répandu | remplacé par `var(--exp)` (dette corrigée) |
| Charte seulement dans `styles.css` | **ancrée dans un UISPEC** (UISPEC.13) |
| Thème non implémenté | thème (préférence) piloté par tokens neutres |

---

# Contraintes

- Composants sans couleur en dur (tokens uniquement) ; `--exp` = expérience active ; thème orthogonal à
  l'univers ; domaine métier indépendant de la présentation ; charte centralisée. Toute exception =
  nouvel ADR.

---

# Documents liés

99-ADR.22-ExperienceIdentityStrategy · 02-FSPEC.13-VisualIdentity-v3.0 ·
04-UISPEC.13-VisualIdentity-v3.0 · 03-TSPEC.05-Preferences-v3.0 · (V2) `styles.css`, `shell.component.ts`

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique de l'identité visuelle (tokens, mécanisme `--exp`, thèmes, remise en cohérence de la charte). |
