# SPEC – Taxonomie EventFoundry

**Document** : SPEC-EVENT-TAXONOMY

**Fichier** : 09-DATA.01-EventAttributes-v3.0.md

**Version** : 2.0

**Statut** : Validé (décisions PO 2026-07)

**Dernière mise à jour** : 2026-07

---

# 1. Objectif

Cette spécification définit la taxonomie de classification d'EventFoundry : normaliser les données
quelle que soit la source, faciliter recherche et filtres, alimenter recommandations et
statistiques, rester extensible.

La v2.0 corrige deux défauts structurels de la v1.1 (arbitrés avec le PO) :

1. **Absence de critère de disjonction** entre `Format` et `Catégorie` → des termes coexistaient
   dans plusieurs tables (`Compétitif`, `Professionnel`, `Privé`, `Famille`…).
2. **Absence d'un niveau « sujet »** : le jeu lui-même (Magic, Pokémon, *Catane*) était tantôt une
   Activité (V1 TCG), tantôt absent (généraliste « Jeux »).

Elle acte aussi (décision PO, option A) la **promotion du `Domain`** en **grands univers** visibles.

---

# 2. Principe directeur : quatre axes disjoints

> **Règle de disjonction (TAX-000).** Un terme n'appartient qu'à **un seul** référentiel de la
> taxonomie, et chaque référentiel ne répond qu'à **une seule** question. Aucun terme ne coexiste
> dans deux référentiels différents. (À l'intérieur d'un même référentiel, l'unicité est précisée
> par table au §8 — ex. un Subject est unique *par Family*.)

Deux natures, désormais séparées :

- une **hiérarchie taxonomique** — *« de quoi ça parle »* — **partagée** par `Event`,
  `Organization` **et** `Venue` ;
- des **modalités orthogonales** — *« comment / pour qui / dans quelles conditions »* — **propres à
  l'Event**.

```
AXE A — Sujet (hiérarchie, PARTAGÉE Event / Organization / Venue)
    Domain    « grand univers »   Culture & Patrimoine · Jeux & Esport · Sport & Plein air …
      └─ Activity                 Jeux · Musique · Sport …            ← niveau partagé & filtrable
           └─ Family              TCG · Jeu de plateau · Jazz & Blues ← regroupement (matérialisé)
                └─ Subject        Magic · Pokémon · Catane · Rock …   ← « le sujet lui-même »

AXE B — Type (nature du rassemblement, TRANSVERSE)   Tournoi · Concert · Atelier · Dégustation …
AXE C — Modalités (référentiel unique dimensionné)    Participation · Public · Ambiance · Accès …
AXE D — Tags (mots-clés libres, non contrôlés)
```

| Axe | Référentiel | Question | Porté par | Cardinalité (Event) |
|-----|-------------|----------|-----------|---------------------|
| A | Domain → Activity → Family → Subject | De quoi ça parle ? | Event, Organization, Venue | 1 Activity + 0..N Subject |
| B | Type | Nature du rassemblement ? | Event | exactement 1 |
| C | Modality (par ModalityDimension) | Comment / pour qui / conditions ? | Event | 0..N |
| D | Tag | Mots-clés libres | Event, Venue | 0..N |

---

# 3. Axe A — Sujet (Domain → Activity → Family → Subject)

## 3.1 Domain — les « grands univers » (option A)

Le Domain est le **regroupement de plus haut niveau, visible**, présenté à l'utilisateur : sections
du méga-menu Découverte, choix de centres d'intérêt à l'onboarding, rollups statistiques.

Il reste **déduit de l'Activity** — jamais *saisi* sur un Event/Organization/Venue (on choisit
l'Activité, le Domain suit) — mais il **peut** servir de **regroupement de navigation** (filtre
dérivé) et d'axe statistique. C'est l'évolution de la règle d'or n°3 (CLAUDE.md §2).

| Domain (univers) | Activités regroupées |
|------------------|----------------------|
| **Culture & Patrimoine** | Arts · Culture · Patrimoine · Cinéma |
| **Musique & Spectacle** | Musique · Spectacle vivant |
| **Jeux & Esport** | Jeux · Esport |
| **Sport & Plein air** | Sport · Nature |
| **Savoirs & Innovation** | Sciences · Technologie · Éducation |
| **Société & Art de vivre** | Business · Lifestyle · Gastronomie · Tourisme · Solidarité |

Chaque Activité appartient à **exactement un** univers (disjonction respectée jusqu'au sommet).

## 3.2 Activity

Le domaine principal d'activité. **Niveau partagé** : un événement *concerne* une Activité, une
organisation *propose* des Activités, un lieu *héberge* des Activités. Liste stable (18 valeurs,
regroupées par univers ci-dessus).

> **Retirées des Activités** (ce n'étaient pas des sujets, cf. §9) : `Famille` et `Communauté`
> deviennent des **modalités** (Axe C).

## 3.3 Family (matérialisée) & 3.4 Subject

La **Family** regroupe des sujets sous une Activité ; le **Subject** est le sujet précis (le jeu, le
genre, la discipline). Vocabulaire **représentatif** ci-dessous ; le `seed.ts` fait foi pour
l'exhaustivité. Un Subject appartient à une Family (donc à une Activité) ; unique **par Family**.

### Univers « Jeux & Esport »

| Activité | Family | Subjects (exemples) |
|----------|--------|---------------------|
| Jeux | **TCG** | Magic · Pokémon · Lorcana · One Piece · Star Wars Unlimited · Flesh and Blood · Riftbound · Yu-Gi-Oh! · Altered · Dragon Ball Super · Union Arena · KeyForge |
| Jeux | **Jeu de plateau** | Catane · Carcassonne · 7 Wonders · Terraforming Mars · Wingspan · Les Aventuriers du Rail · Azul · Gloomhaven |
| Jeux | **Jeu de rôle** | Donjons & Dragons · L'Appel de Cthulhu · Pathfinder · Vampire : la Mascarade |
| Jeux | **Wargame & Figurines** | Warhammer 40,000 · Age of Sigmar · Blood Bowl · Bolt Action |
| Jeux | **Jeu d'ambiance** | Loup-Garou · Time's Up · Blanc-Manger Coco · Skull King |
| Esport | **MOBA** | League of Legends · Dota 2 |
| Esport | **FPS** | Counter-Strike · Valorant · Overwatch |
| Esport | **Jeu de combat** | Street Fighter · Tekken · Super Smash Bros |
| Esport | **Battle Royale** | Fortnite · Apex Legends |
| Esport | **Sport & Course** | EA Sports FC · Rocket League |

### Univers « Musique & Spectacle »

| Activité | Family | Subjects (exemples) |
|----------|--------|---------------------|
| Musique | **Musiques amplifiées** | Rock · Pop · Rap/Hip-hop · Électro · Métal · Reggae |
| Musique | **Jazz, Blues & Soul** | Jazz · Blues · Soul · Funk · Gospel |
| Musique | **Classique & Lyrique** | Musique classique · Opéra · Baroque · Musique de chambre |
| Musique | **Musiques du monde & trad.** | Latino · Afrobeat · Celtique · Folk · Chanson française |
| Spectacle vivant | **Théâtre** | Comédie · Tragédie · Théâtre d'impro |
| Spectacle vivant | **Danse** | Danse classique · Danse contemporaine · Danse hip-hop · Danses latines |
| Spectacle vivant | **Cirque & Arts de la rue** | Cirque · Arts de la rue · Marionnettes |
| Spectacle vivant | **Humour** | Stand-up · Café-théâtre · Improvisation |

### Univers « Sport & Plein air »

| Activité | Family | Subjects (exemples) |
|----------|--------|---------------------|
| Sport | **Sports collectifs** | Football · Basket-ball · Rugby · Handball · Volley-ball |
| Sport | **Sports de raquette** | Tennis · Padel · Badminton · Tennis de table |
| Sport | **Sports de combat** | Judo · Boxe · Karaté · MMA |
| Sport | **Sports individuels** | Athlétisme · Natation · Cyclisme · Escalade |
| Sport | **Sports mécaniques** | Automobile · Moto · Karting |
| Sport | **Sports de glisse** | Ski · Surf · Skateboard |
| Nature | **Découverte nature** | Randonnée · Observation de la faune · Botanique |
| Nature | **Animaux** | Zoo · Aquarium · Ferme pédagogique |
| Nature | **Jardinage & Permaculture** | Potager · Compostage · Apiculture |

### Univers « Culture & Patrimoine »

| Activité | Family | Subjects (exemples) |
|----------|--------|---------------------|
| Arts | **Arts visuels** | Peinture · Sculpture · Photographie · Illustration · Street art |
| Arts | **Arts numériques** | Art génératif · Motion design · Art vidéo |
| Arts | **Artisanat d'art** | Céramique · Verrerie · Bijouterie |
| Culture | **Littérature & BD** | Roman · Poésie · Bande dessinée · Manga |
| Culture | **Idées & Société** | Philosophie · Histoire des idées · Géopolitique |
| Patrimoine | **Patrimoine bâti** | Monument · Château · Site historique |
| Patrimoine | **Musées & Collections** | Beaux-arts · Histoire · Archéologie |
| Cinéma | **Fiction** | Drame · Comédie · Science-fiction · Horreur · Action · Thriller |
| Cinéma | **Non-fiction & formats** | Documentaire · Animation · Court-métrage · Série |

### Univers « Savoirs & Innovation » et « Société & Art de vivre »

| Activité | Family | Subjects (exemples) |
|----------|--------|---------------------|
| Sciences | **Sciences exactes** | Astronomie · Physique · Mathématiques |
| Sciences | **Sciences du vivant** | Biologie · Écologie · Médecine |
| Technologie | **Numérique** | Développement · Intelligence artificielle · Cybersécurité · Web3 |
| Technologie | **Hardware & Making** | Robotique · Impression 3D · Fablab/DIY · VR/AR |
| Éducation | **Formation pro.** | Bureautique · Management · Langues |
| Éducation | **Orientation & Emploi** | Métiers · Alternance · Reconversion |
| Business | **Entrepreneuriat** | Startup · Levée de fonds · Innovation |
| Business | **Marketing & Vente** | Growth · Social media · E-commerce |
| Lifestyle | **Bien-être** | Yoga · Méditation · Sophrologie |
| Lifestyle | **Mode & Maison** | Mode · Cosmétique · Décoration |
| Gastronomie | **Cuisine** | Cuisine française · Italienne · Japonaise · Street food · Végétarienne |
| Gastronomie | **Boissons** | Vin · Bière · Café · Cocktails · Spiritueux |
| Gastronomie | **Sucré** | Pâtisserie · Chocolat · Boulangerie |
| Tourisme | **Découverte & Terroir** | City tour · Route des vins · Patrimoine local |
| Tourisme | **Plein air & Aventure** | Écotourisme · Itinérance · Randonnée aventure |
| Solidarité | **Entraide & Caritatif** | Collecte alimentaire · Maraude · Bénévolat |
| Solidarité | **Sensibilisation** | Environnement · Inclusion handicap · Cause animale |

## 3.5 Placement des mots cités (contrôle de complétude)

| Mot | Axe | Référentiel | Rattachement |
|-----|-----|-------------|--------------|
| Magic, Pokémon | A | Subject | Jeux → TCG |
| Catane, Carcassonne | A | Subject | Jeux → Jeu de plateau |
| Rock | A | Subject | Musique → Musiques amplifiées |
| Jazz, Blues | A | Subject | Musique → Jazz, Blues & Soul |
| Football, Basket-ball, Rugby | A | Subject | Sport → Sports collectifs |
| Tournoi, Concert, Dégustation | B | Type | (transverse) |
| Présentiel, Payant, Compétitif | C | Modality | Participation / Tarification / Mode de jeu |
| Draft, Scellé, Constructed | C | Modality | Format de jeu |
| Deckbuilding, Cosplay, Vintage | D | Tag | (libre) |

---

# 4. Axe B — Type (transverse)

Le Type décrit la **nature du rassemblement**, **indépendamment du sujet** (décision PO). Un
événement possède **exactement un** Type ; `name` **unique global** (plus de rattachement à
l'Activité). Extrait représentatif (le `seed.ts` fait foi) :

| Nature du rassemblement |
|-------------------------|
| Tournoi · Championnat · Ligue · Compétition · Match · Concours · Rencontre · Meetup · Atelier · Stage · Cours · Initiation · Masterclass · Démonstration · Conférence · Table ronde · Débat · Colloque · Séminaire · Webinaire · Avant-première · Projection · Exposition · Vernissage · Concert · Récital · Festival · Spectacle · Représentation · Gala · Soirée · Salon · Convention · Foire · Marché · Vente · Dédicace · Dégustation · Portes ouvertes · Visite · Balade · Excursion · Assemblée · Cérémonie · Défilé · Showcase |

> Les sous-formats propres à un jeu (`Draft`, `Scellé`, `Constructed`…) **ne sont pas** des Types :
> ce sont des **modalités** (Axe C, dimension *Format de jeu* — décision PO). Ils ne polluent pas
> le référentiel Type transverse. De même, les anciens « Types » v1.1 qui étaient en réalité des
> lieux/sujets (`Musée`, `Château`, `Zoo`, `Aquarium`) deviennent des **Subjects** (§9).

---

# 5. Axe C — Modalités (référentiel unique dimensionné)

`Format` et `Catégorie` **fusionnent** en un référentiel de **modalités**. Chaque `Modality`
appartient à **une** `ModalityDimension` ; le `name` d'un Modality est **unique global**. Un Event
porte **0..N** Modality.

| Dimension | Termes |
|-----------|--------|
| Participation | Présentiel · En ligne · Hybride |
| Accès | Libre · Sur inscription · Sur invitation |
| Tarification | Gratuit · Payant |
| Public visé | Tout public · Famille · Enfant · Adolescent · Étudiant · Senior · Professionnel · Expert · Débutant |
| Accessibilité | PMR · Langue des signes · Audiodescription · Sous-titré |
| Ambiance | Festif · Culturel · Éducatif · Caritatif · Convivial · Communautaire |
| Rayonnement | Local · Régional · National · International |
| Nature de l'organisateur | Association · Collectivité · Entreprise · Particulier · Institution |
| Mode de jeu | Compétitif · Coopératif |
| Format de jeu | Constructed · Draft · Scellé · Standard · Commander · Limité |
| Durée | Permanent · Temporaire · Ponctuel · Récurrent |
| Cadre | Intérieur · Extérieur |
| Formation d'équipe | Solo · Équipe |

**Collisions v1.1 résolues :** `Compétitif` → *Mode de jeu* seul ; `Professionnel` → *Public visé*
seul ; `Famille` → *Public visé* (ex-Activité) ; `Communautaire` → *Ambiance* (ex-Activité
`Communauté`) ; `Privé` **écarté** (c'est `Event.visibility`, TAX-010). Les Modality restent des
**qualificatifs de recherche**, jamais des règles métier.

---

# 6. Axe D — Tags

Mots-clés **libres**, non contrôlés, extensibles sans modifier la taxonomie : l'échappatoire pour
tout ce qui n'entre pas dans A/B/C (`Deckbuilding`, `Cosplay`, `Vintage`, `Kids`…). Aucun
terme des axes A/B/C n'y est dupliqué. Portés par l'Event et par le Venue.

---

# 7. Règles de gestion

| Id | Règle |
|----|-------|
| TAX-000 | **Disjonction inter-référentiels** : un terme n'existe que dans un référentiel ; un référentiel = une question. |
| TAX-001 | Chaque Event a **exactement une** Activity. |
| TAX-002 | Chaque Event a **0..N** Subject (chacun rattaché à une Family, donc à une Activity). |
| TAX-003 | La Family est un niveau matérialisé entre Activity et Subject ; un Subject appartient à une Family. |
| TAX-004 | Chaque Event a **exactement un** Type ; le Type est **transverse**, `name` unique global. |
| TAX-005 | Chaque Event a **0..N** Modality ; chaque Modality appartient à une ModalityDimension ; `name` unique global. |
| TAX-006 | Chaque Event a **0..N** Tag (libres, extensibles). |
| TAX-007 | Domain, Activity, Family, Type, ModalityDimension sont stables ; Subject, Modality, Tag évoluent avec les besoins. |
| TAX-008 | Le **Domain** (« univers ») est **déduit** de l'Activity — jamais *saisi* sur un Event/Org/Venue — mais **peut** servir de regroupement de navigation (filtre dérivé) et d'axe statistique (option A ; règle d'or n°3 révisée). |
| TAX-009 | L'axe Sujet (Activity + Subject) est **partagé** Event/Organization/Venue. Type et Modalités restent **propres à l'Event**. |
| TAX-010 | Les Modality ne se substituent jamais à `price` / `visibility` / la Participation. |
| TAX-011 | Provisioning : un Subject / Modality / Tag reconnu à l'import mais absent est créé `provisional = true` puis curé en admin (ADR.24). Domain, Activity, Family, Type ne sont **jamais** auto-provisionnés. |

---

# 8. Modèle persistant cible

| Table | Rôle | Contraintes notables |
|-------|------|----------------------|
| `domains` | Domain (univers) | `name` unique |
| `activities` | Activity | `@@unique(domain_id, name)` |
| `activity_families` | **Family (nouveau)** | `activity_id` FK ; `@@unique(activity_id, name)` |
| `subjects` | **Subject (nouveau)** | `family_id` FK ; `@@unique(family_id, name)` ; `provisional` |
| `event_types` | Type **transverse** | `name` **unique global** ; plus de `activity_id` |
| `modality_dimensions` | **Dimension (nouveau)** | `name` unique |
| `modalities` | **Modality (nouveau)** | `dimension_id` FK ; `name` **unique global** ; `provisional` |
| `tags` | Tag | `name` unique |
| `event_subjects` · `event_modalities` · `event_tags` | N-N Event ↔ Subject / Modality / Tag | PK composite (`event_modalities` remplace format+category links) |
| `venue_activities` · `venue_subjects` · `venue_tags` | **N-N Venue ↔ … (nouveau)** | PK composite |
| `organization_activities` · `organization_subjects` | N-N Org ↔ Activity (existant) / Subject (**nouveau**) | PK composite |

**Supprimées** : `event_formats`, `categories`, `event_format_links`, `event_category_links`.
`Event` conserve `activity_id` (obligatoire) et `event_type_id` ; perd tout scalaire format/catégorie.

---

# 9. Plan de migration des données existantes

Migration Prisma `*_data02_taxonomy`, en **une transaction** :

1. **Créer** `domains` (6 univers), `activity_families`, `subjects`, `modality_dimensions`,
   `modalities`, et les tables de liaison. Réaffecter chaque Activity à son univers (§3.1).
2. **Sujets ex-Activités TCG** (`Magic, Pokémon, Lorcana…`, Domain `TCG`) → **Subjects** sous
   Activity `Jeux` / Family `TCG`. Recâbler `Event.activity_id` → `Jeux` + créer `event_subjects`.
   Domain `TCG` désactivé.
3. **Ex-EventType « TCG » sous « Jeux »** → **Family `TCG`** (pas un Type).
4. **Ex-« Types »-lieux** (`Musée, Château, Zoo, Aquarium, Jardin…`) → **Subjects** (Patrimoine /
   Nature) ; les Events concernés reçoivent un Type transverse de repli (`Visite`, `Exposition`).
5. **Modalités** : `event_formats` + `categories` → `modalities` (dimension d'origine) ;
   `event_format_links` + `event_category_links` → `event_modalities`. Dédoublonnage par nom global
   (§5) ; `Privé` écarté.
6. **Ex-Activités `Famille` / `Communauté`** → `modalities` (Public visé / Ambiance) ; Events
   concernés reçoivent une Activity de repli déterministe + le Modality.
7. **Type transverse** : fusionner les `event_types` de même `name`, supprimer `activity_id`, poser
   l'unicité globale, recâbler `Event.event_type_id`.
8. **Contrôle** : aucun Event orphelin (Activity + Type obligatoires), aucun terme en double
   inter-référentiels, tables obsolètes supprimées.

> Tant que migration + adaptation applicative ne sont pas déployées, cette section **fait foi** ;
> toute divergence code/doc est un reste à faire.

---

# 10. Exemples

## 10.1 Événement « Tournoi Pokémon »
Activity `Jeux` · Subject `Pokémon` *(TCG)* · Type `Tournoi` · Modalités {Présentiel, Payant,
Compétitif, Sur inscription, Draft *(Format de jeu)*} · Tags {Deckbuilding} · Univers déduit **Jeux & Esport**.

## 10.2 Événement « Concert de Blues »
Activity `Musique` · Subject `Blues` *(Jazz, Blues & Soul)* · Type `Concert` · Modalités {Présentiel,
Payant, Tout public, Culturel} · Tags {Live, Trio} · Univers **Musique & Spectacle**.

## 10.3 Événement « Initiation Catane en famille »
Activity `Jeux` · Subject `Catane` *(Jeu de plateau)* · Type `Initiation` · Modalités {Présentiel,
Gratuit, Famille, Convivial, Coopératif} · Univers **Jeux & Esport**.

## 10.4 Lieu « Cartapapa » (Venue)
Activity `Jeux` · Subjects {Pokémon, Magic, Lorcana, One Piece, SWU} · Tags {tcg, magic, pokemon} ·
Services *(hors taxonomie, cf. §11)* {Tournois, Avant-premières, Cartes à l'unité}.

## 10.5 Organisation « Club de Rugby »
Activity `Sport` · Subject `Rugby` *(Sports collectifs)* · Univers **Sport & Plein air**. (Type /
Modalités non applicables — propres à l'Event.)

---

# 11. Administration des référentiels

Zone d'administration (rôle `ADMIN`, `catalog.manage`), trame commune par référentiel :

- **CRUD + activation** (`is_active`, pas de suppression physique — TSPEC.02) ;
- **curation du provisoire** : lister `provisional = true` (issus de l'import), **valider** /
  **fusionner** vers une entrée canonique / **désactiver** ;
- **hiérarchie** : Domain → Activity → Family → Subject (rattacher un Subject à une Family, une
  Activity à un univers) ; ModalityDimension → Modality ;
- **garde de disjonction (TAX-000)** : refus déterministe de créer un terme dont le `name` existe
  déjà dans un **autre** référentiel de la taxonomie.

**`services[]` de Venue** (Tournois, Ligues…) : **hors** taxonomie d'événement → petit référentiel
dédié `VenueService` (N-N), curable en admin, distinct des Axes A–D. À acter à l'implémentation Venue.

---

# 12. Historique

| Version | Description |
|---------|-------------|
| 1.0 | Première taxonomie (Draft). |
| 1.1 | Réconciliation modèle : Format/Catégorie N-N, Format transverse, Type↔Activité par Activité. |
| 2.0 | **Refonte en 4 axes disjoints** (décisions PO) : axe Sujet `Domain→Activity→Family→Subject` **partagé Event/Org/Venue** (le « jeu » = **Subject**) ; **Domain promu en grands univers visibles** (option A) ; **Type transverse** ; **fusion Format+Catégorie** en **Modalités dimensionnées** (TAX-000) ; `Famille`/`Communauté` reclassés en modalités ; vocabulaires complets §3–§6, migration §9, admin §11. Statut : **Validé**. |
