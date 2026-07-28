# SPEC – Taxonomie EventFoundry

**Document** : SPEC-EVENT-TAXONOMY

**Fichier** : 09-DATA.01-EventAttributes-v3.0.md

**Version** : 2.0

**Statut** : Validé (décisions PO 2026-07)

**Dernière mise à jour** : 2026-07

---

# 1. Objectif

Cette spécification définit la taxonomie de classification d'EventFoundry. Elle sert à
normaliser les données quelle que soit la source, faciliter la recherche et les filtres,
alimenter les recommandations et les statistiques, et rester extensible.

La v2.0 corrige deux défauts structurels de la v1.1, identifiés avec le Product Owner :

1. **Absence de critère de disjonction** entre `Format` et `Catégorie` : deux référentiels
   « fourre-tout » de dimensions hétérogènes, d'où des termes qui **coexistaient dans plusieurs
   tables** (`Compétitif`, `Professionnel`, `Privé`, `Famille`…).
2. **Absence d'un niveau « sujet »** : le jeu lui-même (Pokémon, Magic, *Seven Wonders*) était
   tantôt modélisé comme **Activité** (V1 TCG), tantôt absent (généraliste « Jeux »). Deux
   représentations incompatibles du même concept.

---

# 2. Principe directeur : quatre axes disjoints

> **Règle de disjonction (TAX-000).** Un terme n'appartient qu'à **un seul** référentiel, et
> chaque référentiel ne répond qu'à **une seule** question. Aucun terme ne coexiste dans deux
> tables. Les collisions historiques sont résolues à la migration (§9).

La classification repose sur **deux natures** que la v1.1 mélangeait, désormais séparées :

- une **hiérarchie taxonomique** — *« de quoi ça parle »* — **partagée** par l'`Event`,
  l'`Organization` **et** le `Venue` ;
- des **facettes orthogonales** — *« comment / pour qui / dans quelles conditions »* — **propres
  à l'événement**.

```
AXE A — Sujet (hiérarchie, PARTAGÉE Event / Organization / Venue)
    Domain    (déduit, jamais saisi ni filtré)
      └─ Activity     Jeux · Musique · Sport …           ← niveau partagé & filtrable
           └─ Family  TCG · Jeu de plateau · Jeu de rôle  ← regroupement (matérialisé)
                └─ Subject  Pokémon · Magic · Seven Wonders  ← « le sujet lui-même »

AXE B — Type (nature du rassemblement, TRANSVERSE au sujet)   Tournoi · Concert · Atelier …
AXE C — Facettes (référentiel unique dimensionné)             Participation · Public · Ambiance …
AXE D — Tags (mots-clés libres, non contrôlés)
```

| Axe | Référentiel | Question | Porté par | Cardinalité |
|-----|-------------|----------|-----------|-------------|
| A | Domain → Activity → Family → Subject | De quoi ça parle ? | Event, Organization, Venue | Event : 1 Activity + 0..N Subject |
| B | Type | Quelle est la nature du rassemblement ? | Event | exactement 1 |
| C | FacetTerm (par FacetDimension) | Comment / pour qui / conditions ? | Event | 0..N |
| D | Tag | Mots-clés libres | Event (et Venue) | 0..N |

---

# 3. Axe A — Sujet (Domain → Activity → Family → Subject)

## 3.1 Domain

Regroupement de plus haut niveau. **Déduit** de l'Activité (règle d'or n°3), jamais saisi,
jamais envoyé par le client, jamais utilisé comme filtre. Exemples : `Général`, `TCG`.
Un Domain ne caractérise jamais directement un Event, une Organization ou un Venue.

## 3.2 Activity

Le domaine principal d'activité humaine. **C'est le niveau partagé** : un événement *concerne*
une Activité, une organisation *propose* des Activités, un lieu *héberge* des Activités. Nombre
volontairement limité et stable.

| Activité |
|----------|
| Arts · Culture · Patrimoine · Musique · Spectacle vivant · Cinéma · **Jeux** · Sport · Esport · Technologie · Sciences · Éducation · Business · Lifestyle · Gastronomie · Tourisme · Nature · Solidarité |

> **Retirées de la liste des Activités** (ce n'étaient pas des sujets) : `Famille` et
> `Communauté` deviennent des **facettes** (Axe C, dimension *Public visé* / *Ambiance*). Voir §9.

## 3.3 Family (matérialisée)

Regroupement intermédiaire **entre l'Activité et le Sujet**, décidé PO. Une Family appartient à
une Activité. Elle porte le « genre » sous lequel se rangent les sujets.

| Activité | Familles (exemples) |
|----------|---------------------|
| Jeux | **TCG** · Jeu de plateau · Jeu de rôle · Jeu vidéo · Wargame · Jeu d'ambiance |
| Musique | Rock · Jazz · Classique · Électronique · Musiques du monde |
| Sport | Sports collectifs · Sports de combat · Sports de raquette · Sports mécaniques |

La Family est **optionnelle** sur un Event (un événement peut cibler une Activité sans préciser
la Family), mais un **Subject** appartient toujours à une Family (donc à une Activité).

## 3.4 Subject (le sujet / le jeu lui-même)

Le sujet précis. C'est **ici** qu'arrivent Pokémon, Magic, *Seven Wonders*, un groupe, une
discipline. Un Subject appartient à une Family.

| Family | Sujets (exemples) |
|--------|-------------------|
| TCG | Magic · Pokémon · Lorcana · One Piece · Star Wars Unlimited · Flesh and Blood · Riftbound · Yu-Gi-Oh! · Altered · Dragon Ball Super · Union Arena · KeyForge |
| Jeu de plateau | Seven Wonders · Catan · Terraforming Mars · Wingspan |
| Jeu de rôle | Donjons & Dragons · L'Appel de Cthulhu |

**Rattachements de l'Axe A :**

- `Event` : **1 Activity** (obligatoire) + **0..N Subject** (donc Family implicite). Ex. un tournoi
  peut mêler plusieurs sujets ; un événement « Jeux » générique n'a aucun Subject.
- `Organization` : **0..N Activity** (déjà en place via `OrganizationActivity`) + **0..N Subject**.
- `Venue` : **0..N Activity** + **0..N Subject** (nouveau — cf. import boutiques, §10.4).

---

# 4. Axe B — Type (transverse)

Le Type décrit la **nature du rassemblement**, **indépendamment du sujet** (décision PO :
**Type transverse**). Un « Tournoi » vaut pour Pokémon, le judo ou l'esport ; un « Concert »
pour tous les genres musicaux. Un événement possède **exactement un** Type.

Conséquence directe : la **duplication par Activité disparaît** (fin de `@@unique(activityId, name)` ;
`EventType.name` devient **unique globalement**, sans `activityId`).

Référentiel Type (extrait représentatif ; le `seed.ts` fait foi pour la liste complète) :

| Nature du rassemblement |
|-------------------------|
| Tournoi · Ligue · Compétition · Match · Rencontre · Meetup · Atelier · Stage · Initiation · Démonstration · Avant-première · Conférence · Table ronde · Débat · Exposition · Vernissage · Projection · Concert · Festival · Spectacle · Représentation · Salon · Convention · Marché · Vente · Portes ouvertes · Visite · Assemblée |

> **Sous-formats spécifiques d'un jeu** (`Draft`, `Scellé`, `Constructed`…) ne sont **pas** des
> Types. Ce sont des modalités liées à la **Family/au Subject** (ex. modes de jeu d'une famille
> TCG) ; en V1 ils vivent en **Tags** ou dans une future facette *Mode de jeu détaillé*. Ils ne
> polluent pas le référentiel Type transverse.

---

# 5. Axe C — Facettes (référentiel unique dimensionné)

`Format` et `Catégorie` **fusionnent** en un seul référentiel de **facettes**. Chaque terme
(`FacetTerm`) appartient à **une** dimension (`FacetDimension`). La disjonction est garantie *par
construction* : le nom d'un terme est **unique globalement**, une dimension le porte. Un événement
porte **0..N** FacetTerm.

| Dimension (FacetDimension) | Termes (FacetTerm) |
|----------------------------|--------------------|
| Participation | Présentiel · En ligne · Hybride |
| Accès | Libre · Sur inscription · Sur invitation |
| Tarification | Gratuit · Payant |
| Public visé | Tout public · Famille · Enfant · Adolescent · Étudiant · Senior · Professionnel · Expert · Débutant |
| Accessibilité | PMR · Langue des signes · Audiodescription · Sous-titré |
| Ambiance | Festif · Culturel · Éducatif · Caritatif · Convivial · Communautaire |
| Rayonnement | Local · Régional · National · International |
| Nature de l'organisateur | Association · Collectivité · Entreprise · Particulier · Institution |
| Mode de jeu | Compétitif · Coopératif |
| Durée | Permanent · Temporaire · Ponctuel · Récurrent |
| Cadre | Intérieur · Extérieur |
| Formation d'équipe | Solo · Équipe |

**Collisions v1.1 résolues (§9) :** `Compétitif` → dimension *Mode de jeu* uniquement (retiré de
l'ex-Ambiance) ; `Professionnel` → *Public visé* uniquement (retiré d'Ambiance/Organisateur) ;
`Communautaire` remplace l'ex-Activité `Communauté` (dimension *Ambiance*) ; `Privé` disparaît des
facettes (c'est `Event.visibility`, TAX-012).

Les facettes restent des **qualificatifs de recherche**, jamais des règles métier : elles ne se
substituent pas à `Event.price` / `Event.visibility` / la Participation (TAX-012 conservé).

---

# 6. Axe D — Tags

Mots-clés **libres**, non contrôlés, extensibles sans modifier la taxonomie. C'est l'échappatoire :
tout ce qui n'entre pas dans A/B/C. Aucun terme des axes A/B/C n'y est dupliqué. Portés par l'Event
et (nouveau) par le Venue.

---

# 7. Règles de gestion

| Id | Règle |
|----|-------|
| TAX-000 | **Disjonction** : un terme n'existe que dans un référentiel ; un référentiel = une question. |
| TAX-001 | Chaque Event a **exactement une** Activity. |
| TAX-002 | Chaque Event a **0..N** Subject (chacun rattaché à une Family, donc à une Activity). |
| TAX-003 | La Family est un niveau matérialisé entre Activity et Subject ; un Subject appartient à une Family. |
| TAX-004 | Chaque Event a **exactement un** Type ; le Type est **transverse** (aucun rattachement à l'Activité), `name` unique global. |
| TAX-005 | Chaque Event a **0..N** FacetTerm ; chaque FacetTerm appartient à une FacetDimension ; `name` de FacetTerm unique global. |
| TAX-006 | Chaque Event a **0..N** Tag (libres, extensibles). |
| TAX-007 | Activity, Family, Type, FacetDimension sont stables et rarement modifiés ; Subject, FacetTerm, Tag évoluent avec les besoins. |
| TAX-008 | Domain est **déduit** de l'Activity, jamais saisi, jamais filtré (règle d'or n°3). |
| TAX-009 | L'axe Sujet (Activity + Subject) est **partagé** : porté aussi par Organization et Venue. Le Type et les Facettes restent **propres à l'Event**. |
| TAX-010 | Les FacetTerm ne se substituent jamais à `price` / `visibility` / la Participation (qualificatifs de recherche, pas règles métier). |
| TAX-011 | Provisioning : un Subject / FacetTerm / Tag reconnu à l'import mais absent du référentiel est créé `provisional = true` puis curé en administration (ADR.24). Activity, Family, Type ne sont **jamais** auto-provisionnés. |

---

# 8. Modèle persistant cible

| Table | Rôle | Clés / contraintes notables |
|-------|------|------------------------------|
| `domains` | Domain | `name` unique |
| `activities` | Activity | `@@unique(domain_id, name)` |
| `activity_families` | **Family (nouveau)** | `activity_id` FK ; `@@unique(activity_id, name)` |
| `subjects` | **Subject (nouveau)** | `family_id` FK ; `@@unique(family_id, name)` ; `provisional` |
| `event_types` | Type **transverse** | `name` **unique global** ; suppression de `activity_id` |
| `facet_dimensions` | **Dimension (nouveau)** | `name` unique |
| `facet_terms` | **FacetTerm (nouveau)** | `dimension_id` FK ; `name` **unique global** ; `provisional` |
| `tags` | Tag | `name` unique |
| `event_subjects` | N-N Event ↔ Subject | PK composite |
| `event_facets` | N-N Event ↔ FacetTerm | PK composite (remplace `event_format_links` + `event_category_links`) |
| `event_tags` | N-N Event ↔ Tag | inchangé |
| `venue_activities` | **N-N Venue ↔ Activity (nouveau)** | PK composite |
| `venue_subjects` | **N-N Venue ↔ Subject (nouveau)** | PK composite |
| `venue_tags` | **N-N Venue ↔ Tag (nouveau)** | PK composite |
| `organization_activities` | N-N Org ↔ Activity | inchangé |
| `organization_subjects` | **N-N Org ↔ Subject (nouveau)** | PK composite |

Tables **supprimées** : `event_formats`, `categories`, `event_format_links`,
`event_category_links` (absorbées par `facet_dimensions` / `facet_terms` / `event_facets`).
Champs Event `activity_id` (conservé, obligatoire) et `event_type_id` (conservé) ; `Event` perd
tout scalaire de format/catégorie.

---

# 9. Plan de migration des données existantes

Migration Prisma `*_data02_taxonomy`, en **une transaction**, ordre :

1. **Créer** `activity_families`, `subjects`, `facet_dimensions`, `facet_terms`, et les tables
   de liaison (§8).
2. **Sujets ex-Activités TCG** : `Magic, Pokémon, Lorcana, One Piece, SWU, Flesh and Blood,
   Riftbound…` (Domain `TCG`) → **Subjects** sous Activity `Jeux` / Family `TCG`. Réaffecter les
   `Event.activity_id` pointant vers ces ex-Activités → Activity `Jeux`, et créer le
   `event_subjects` correspondant. Le Domain `TCG` est ensuite retiré/désactivé.
3. **Ex-EventType « TCG » sous « Jeux »** → devient la **Family `TCG`** (pas un Type).
4. **Facettes** : chaque `event_formats` + `categories` → `facet_terms` (avec dimension d'origine) ;
   `event_format_links` + `event_category_links` → `event_facets`. Dédoublonnage par nom global
   (résolutions §5) ; `Privé` (Visibilité) **écarté**.
5. **Ex-Activités `Famille` / `Communauté`** → `facet_terms` (`Famille` = *Public visé* déjà
   présent ; `Communautaire` = *Ambiance*). Les Events qui les portaient reçoivent une Activity
   de repli déterministe (`Jeux` ou selon Type) + le FacetTerm ; règle de reprise documentée dans
   la migration.
6. **Type transverse** : fusionner les `event_types` de même `name` (dédoublonnage), supprimer
   `activity_id`, poser l'unicité globale ; recâbler `Event.event_type_id` vers le Type fusionné.
7. **Contrôle** : aucun Event orphelin (Activity + Type obligatoires), aucun terme en double
   inter-tables, tables obsolètes supprimées.

> Tant que migration + adaptation applicative (DTO, mappers, services, recherche, reco, moteur
> expert, frontend, admin) ne sont pas déployées, cette section **fait foi** sur la cible ; toute
> divergence code/doc est un reste à faire, pas une entorse à la spec.

---

# 10. Exemples

## 10.1 Événement « Tournoi Pokémon »
| Axe | Valeur |
|-----|--------|
| Activity | Jeux |
| Subject | Pokémon *(Family TCG)* |
| Type | Tournoi |
| Facettes | Présentiel · Payant · Compétitif · Sur inscription |
| Tags | Pokémon · Draft · Deckbuilding |

## 10.2 Événement « Concert de Jazz »
| Axe | Valeur |
|-----|--------|
| Activity | Musique |
| Subject | *(Family Jazz)* — optionnel |
| Type | Concert |
| Facettes | Présentiel · Payant · Tout public · Culturel |
| Tags | Jazz · Live · Quartet |

## 10.3 Organisation « Boutique Cartapapa »
| Axe | Valeur |
|-----|--------|
| Activity | Jeux |
| Subjects | Pokémon · Magic · Lorcana · One Piece · SWU |
| Type / Facettes | *(non applicables — propres à l'Event)* |

## 10.4 Lieu « Cartapapa » (Venue)
| Axe | Valeur |
|-----|--------|
| Activity | Jeux |
| Subjects | Pokémon · Magic · Lorcana · One Piece · SWU |
| Tags | tcg · magic · pokemon · lorcana · one-piece · swu |
| Services *(hors taxonomie)* | Tournois · Avant-premières · Cartes à l'unité · Rachat de collections |

> Les 12 magasins du jeu d'essai valident l'Axe A partagé (mêmes Activity/Subject pour Venue et
> Event) et alimentent le provisioning des Subjects hors V1 (Yu-Gi-Oh!, Altered, Dragon Ball
> Super, Union Arena). Voir §11 pour les `services[]`.

---

# 11. Administration des référentiels

Tous les référentiels de cette spec sont gérés dans la **zone d'administration** (rôle `ADMIN`,
`catalog.manage`), avec la même trame par référentiel :

- **CRUD + activation** (`is_active`, jamais de suppression physique d'un référentiel — TSPEC.02) ;
- **curation du provisoire** : lister les entrées `provisional = true` (issues de l'import), les
  **valider** (→ `provisional = false`), **fusionner** vers une entrée canonique, ou **désactiver** ;
- **hiérarchie** : édition Domain → Activity → Family → Subject (rattachement d'un Subject à une
  Family) ; édition FacetDimension → FacetTerm ;
- **garde de disjonction** : refus déterministe de créer un terme dont le `name` existe déjà dans
  un autre référentiel de la taxonomie (matérialise TAX-000).

Cas particulier des **`services[]` de Venue** (Tournois, Ligues, Avant-premières…) : ce **ne sont
pas** des attributs de la taxonomie d'événement. Décision de modélisation (à acter à l'implémentation
Venue) : petit référentiel dédié `VenueService` N-N, curable en admin, distinct des Axes A–D.

---

# 12. Historique

| Version | Description |
|---------|-------------|
| 1.0 | Première taxonomie (Draft). |
| 1.1 | Réconciliation modèle : Format/Catégorie en N-N, Format transverse, Type↔Activité par Activité (TAX-011 v1.1), non-chevauchement formalisé. |
| 2.0 | **Refonte en 4 axes disjoints** (décisions PO) : Axe Sujet `Domain→Activity→Family→Subject` **partagé Event/Org/Venue** (le « jeu » devient un **Subject**) ; **Type transverse** ; **fusion Format+Catégorie** en **Facettes dimensionnées** (règle de disjonction TAX-000) ; `Famille`/`Communauté` reclassés en facettes. Plan de migration §9, administration §11. Statut : **Validé**. |
