# SPEC – Taxonomie des événements EventFoundry

**Document** : SPEC-EVENT-TAXONOMY

**Fichier** : 09-DATA.01-EventAttributes-v3.0.md

**Version** : 1.1

**Statut** : Validé

**Dernière mise à jour** : 2026-07

---

# 1. Objectif

Cette spécification définit la taxonomie standard utilisée pour classifier tous les événements de la plateforme EventFoundry.

Cette taxonomie poursuit plusieurs objectifs :

- normaliser les événements provenant de multiples sources ;
- faciliter la recherche ;
- améliorer les recommandations ;
- permettre les statistiques ;
- simplifier les filtres de recherche ;
- conserver une structure extensible dans le temps.

Chaque événement est caractérisé par cinq niveaux :

```
Activité   (exactement 1)
    ↓
Type       (exactement 1)
    ↓
Format     (0..N — transverse)
    ↓
Catégorie  (0..N — transverse)
    ↓
Tags       (0..N — extensibles)
```

Chaque niveau possède une responsabilité précise.

**Cardinalités (source de vérité — §7 Règles de gestion) :**

| Niveau | Cardinalité | Portée | Modèle |
|--------|-------------|--------|--------|
| Activité | exactement 1 | rattachée à un `Domain` (déduit, jamais saisi) | `Event.activityId` (obligatoire) |
| Type | exactement 1 | **rattaché à une Activité** | `Event.eventTypeId` |
| Format | 0..N | **transverse** (indépendant de l'Activité) | N-N `Event ↔ EventFormat` |
| Catégorie | 0..N | **transverse** | N-N `Event ↔ Category` |
| Tags | 0..N | **transverse**, extensibles | N-N `Event ↔ Tag` |

> **Alignement modèle.** Cette version 1.1 réconcilie la taxonomie avec le modèle
> persistant (`schema.prisma`) : le Format et la Catégorie deviennent des **relations
> N-N** portées par des tables de liaison (`event_format_links`, `event_category_links`),
> et le Format devient un **référentiel transverse** (non rattaché à une Activité), au
> même titre que la Catégorie et les Tags. La migration correspondante est décrite au §10.

---

# 2. Activité

## Définition

L'Activité représente le domaine principal auquel appartient l'événement.

Il s'agit du niveau le plus élevé de classification proposé à l'utilisateur.

Le nombre de valeurs doit rester volontairement limité afin de garantir une navigation cohérente.

Un événement possède **une seule Activité**.

> **Domain vs Activité.** Le modèle EventFoundry conserve un niveau `Domain` **au-dessus**
> de l'Activité (règle d'or n°3 : le `Domain` est toujours **déduit** de l'Activité, jamais
> saisi, jamais envoyé par le client, jamais utilisé comme filtre). La taxonomie généraliste
> ci-dessous est regroupée sous un `Domain` unique **« Général »** ; la V1 TCG reste
> disponible sous le `Domain` **« TCG »**. Un Domain ne caractérise jamais directement un Event.

## Valeurs

| Activité |
|----------|
| Arts |
| Culture |
| Patrimoine |
| Musique |
| Spectacle vivant |
| Cinéma |
| Jeux |
| Sport |
| Esport |
| Technologie |
| Sciences |
| Éducation |
| Business |
| Lifestyle |
| Gastronomie |
| Tourisme |
| Nature |
| Solidarité |
| Famille |
| Communauté |

---

# 3. Type

## Définition

Le Type décrit précisément la nature de l'événement.

Il s'agit du principal critère de recherche.

Un événement possède **un seul Type**.

Les Types sont **rattachés à une Activité** (relation `EventType.activityId`).

> **Réconciliation v1.1.** La v1.0 regroupait les Types sous des entêtes (« Spectacle »,
> « Visite », « Formation »…) qui ne correspondaient pas un-à-un à la liste des Activités,
> et ses exemples plaçaient un même Type sous des Activités différentes (ex. « Concert »
> présenté comme Type de l'Activité *Musique*). Le modèle imposant qu'un Type appartienne à
> une Activité (`@@unique([activityId, name])`), la v1.1 **rattache chaque Type à une ou
> plusieurs Activités** : un même **nom** de Type peut exister sous plusieurs Activités
> (ex. « Concert » sous *Musique* **et** *Spectacle vivant* ; « Tournoi » sous *Jeux*,
> *Sport* et *Esport*). L'unicité reste garantie **par Activité**. Les tables ci-dessous
> font foi ; le `seed.ts` en est la traduction exécutable.

Les Types sont organisés par Activité.

---

## Arts

| Type |
|------|
| Exposition |
| Vernissage |
| Performance artistique |
| Happening |
| Biennale |
| Atelier |

---

## Culture

| Type |
|------|
| Conférence |
| Lecture publique |
| Rencontre |
| Débat |
| Exposition |

---

## Patrimoine

| Type |
|------|
| Musée |
| Galerie d'art |
| Monument |
| Site touristique |
| Site historique |
| Château |
| Jardin |
| Parc |
| Réserve naturelle |
| Aquarium |
| Zoo |

---

## Musique

| Type |
|------|
| Concert |
| Festival |
| Récital |
| Jam session |
| DJ set |

---

## Spectacle vivant

| Type |
|------|
| Concert |
| Festival |
| Théâtre |
| Comédie musicale |
| Opéra |
| Ballet |
| Danse |
| Cirque |
| Cabaret |
| One-man-show |
| Improvisation |
| Humour |
| Performance artistique |
| Happening |

---

## Cinéma

| Type |
|------|
| Projection |
| Avant-première |
| Festival |
| Ciné-débat |

---

## Jeux

| Type |
|------|
| Jeux de société |
| Jeu de rôle |
| Escape Game |
| Murder Party |
| TCG |
| WarGame |
| Jeux vidéo |
| LAN |
| Quiz |
| Tournoi |

---

## Sport

| Type |
|------|
| Compétition |
| Match |
| Course |
| Trail |
| Marathon |
| Cyclisme |
| Triathlon |
| Randonnée |
| Tournoi |
| Stage |

---

## Esport

| Type |
|------|
| LAN |
| Championnat |
| Tournoi |
| Showmatch |
| Viewing Party |
| Meetup |

---

## Technologie

| Type |
|------|
| Conférence |
| Meetup |
| Hackathon |
| Atelier |
| Workshop |
| Bootcamp |
| Salon professionnel |

---

## Sciences

| Type |
|------|
| Conférence |
| Atelier |
| Démonstration |
| Séminaire |
| Exposition |

---

## Éducation

| Type |
|------|
| Conférence |
| Atelier |
| Cours |
| Masterclass |
| Formation |
| Séminaire |
| Workshop |
| Bootcamp |

---

## Business

| Type |
|------|
| Networking |
| Meetup |
| Forum |
| Salon professionnel |
| Pitch |
| Hackathon |
| Job Dating |

---

## Lifestyle

| Type |
|------|
| Atelier |
| Salon |
| Marché |
| Défilé |
| Rencontre |

---

## Gastronomie

| Type |
|------|
| Dégustation |
| Marché gourmand |
| Festival culinaire |
| Cours de cuisine |
| Repas |

---

## Tourisme

| Type |
|------|
| Visite guidée |
| Visite libre |
| Circuit |
| Balade |
| Randonnée découverte |
| Parcours |

---

## Nature

| Type |
|------|
| Randonnée |
| Balade |
| Sortie nature |
| Observation |
| Atelier |

---

## Solidarité

| Type |
|------|
| Collecte |
| Bénévolat |
| Gala caritatif |
| Sensibilisation |
| Repas solidaire |

---

## Famille

| Type |
|------|
| Animation |
| Spectacle enfant |
| Atelier enfant |
| Chasse au trésor |

---

## Communauté

| Type |
|------|
| Rencontre |
| Meetup |
| Assemblée |
| Vide-grenier |
| Marché artisanal |
| Fête de quartier |

---

# 4. Format

## Définition

Le Format décrit la manière dont se déroule l'événement.

Contrairement au Type, le Format est **indépendant de la nature de l'événement** : c'est un
**référentiel transverse**, partagé par toutes les Activités (aucun rattachement à une
Activité — évolution v1.1, cf. §10).

Un événement peut posséder **plusieurs Formats** (relation N-N `Event ↔ EventFormat`, table
de liaison `event_format_links`).

> **Pas de chevauchement avec les autres attributs (décision v1.1).** Les axes de Format
> — dont *Tarification* (Gratuit/Payant), *Réservation* (Avec/Sans) et *Visibilité*
> (Ouvert/Privé) — sont conservés **tels quels** dans la taxonomie. Ils ne se substituent
> pas et ne sont pas fusionnés avec les champs techniques de l'Event (`price`, `visibility`)
> ni avec la Participation : ce sont des **qualificatifs de recherche/filtrage**, pas des
> règles métier. La cohérence éventuelle entre un Format « Gratuit » et `price = 0` relève de
> l'ergonomie de saisie, jamais d'une déduction automatique.

## Valeurs

### Participation

- Présentiel
- En ligne
- Hybride

### Accès

- Libre
- Sur inscription
- Sur invitation

### Tarification

- Gratuit
- Payant

### Mode de jeu

- Compétitif
- Coopératif

### Durée

- Permanent
- Temporaire
- Ponctuel
- Récurrent

### Lieu

- Intérieur
- Extérieur

### Organisation

- Solo
- Équipe

### Réservation

- Avec réservation
- Sans réservation

### Visibilité

- Ouvert
- Privé

---

# 5. Catégorie

## Définition

Les Catégories permettent d'affiner la recherche.

C'est un **référentiel transverse** (aucun rattachement à une Activité).

Un événement peut appartenir à **plusieurs catégories** (relation N-N `Event ↔ Category`,
table de liaison `event_category_links`).

---

## Public

| Catégorie |
|------------|
| Tout public |
| Famille |
| Enfant |
| Adolescent |
| Étudiant |
| Senior |
| Professionnel |
| Expert |
| Débutant |

---

## Accessibilité

| Catégorie |
|------------|
| PMR |
| Langue des signes |
| Audiodescription |
| Sous-titré |

---

## Ambiance

| Catégorie |
|------------|
| Festif |
| Culturel |
| Compétitif |
| Éducatif |
| Caritatif |
| Professionnel |
| Convivial |

---

## Rayonnement

| Catégorie |
|------------|
| Local |
| Régional |
| National |
| International |

---

## Organisateur

| Catégorie |
|------------|
| Association |
| Collectivité |
| Entreprise |
| Particulier |
| Institution |

---

# 6. Tags

## Définition

Les Tags sont des mots-clés destinés à enrichir les événements.

Ils servent principalement :

- aux recherches textuelles ;
- aux recommandations ;
- au filtrage avancé.

Un événement peut posséder un nombre illimité de Tags.

Les Tags sont extensibles.

---

## Jeux de cartes

- Magic
- Pokémon
- Lorcana
- Altered
- Star Wars Unlimited
- Yu-Gi-Oh
- Flesh and Blood
- KeyForge

---

## Jeux de société

- Catane
- Terraforming Mars
- Brass
- Ark Nova
- Carcassonne
- 7 Wonders
- Azul

---

## Sports

- Football
- Rugby
- Basket
- Handball
- Tennis
- Natation
- Escalade
- Judo

---

## Esport

- League of Legends
- Valorant
- Counter Strike
- Rocket League
- Fortnite
- Dota 2
- Overwatch

---

## Musique

- Rock
- Metal
- Jazz
- Classique
- Pop
- Rap
- Électro
- Blues
- Reggae
- Country

---

## Culture

- Impressionnisme
- Art moderne
- Photographie
- Street Art
- Architecture
- Histoire
- Archéologie

---

## Tourisme

- UNESCO
- Médiéval
- Antiquité
- Nature
- Panorama

---

## Gastronomie

- Vin
- Bière
- Fromage
- Chocolat
- Cuisine italienne
- Cuisine japonaise
- Cuisine française

---

# 7. Règles de gestion

| Identifiant | Règle |
|-------------|--------|
| TAX-001 | Chaque événement possède exactement une Activité. |
| TAX-002 | Chaque événement possède exactement un Type, rattaché à son Activité. |
| TAX-003 | Un événement peut posséder plusieurs Formats (relation N-N). |
| TAX-004 | Un événement peut appartenir à plusieurs Catégories (relation N-N). |
| TAX-005 | Un événement peut posséder un nombre illimité de Tags. |
| TAX-006 | Les Tags sont extensibles sans modification de la taxonomie. |
| TAX-007 | Les Activités sont limitées et rarement modifiées. |
| TAX-008 | Les Types évoluent avec les besoins fonctionnels. |
| TAX-009 | Les Formats décrivent uniquement la manière dont se déroule l'événement ; ils sont transverses (indépendants de l'Activité). |
| TAX-010 | Les Catégories sont destinées au filtrage fonctionnel ; elles sont transverses. |
| TAX-011 | Un même nom de Type peut exister sous plusieurs Activités ; l'unicité est garantie par Activité. |
| TAX-012 | Le Format et la Catégorie ne se substituent jamais aux champs techniques (`price`, `visibility`) ni à la Participation : ce sont des qualificatifs de recherche, jamais des règles métier (règle d'or n°1). |

---

# 8. Exemple

## Tournoi Altered

| Attribut | Valeur |
|----------|--------|
| Activité | Jeux |
| Type | TCG |
| Format | Présentiel |
| Format | Payant |
| Format | Compétitif |
| Format | Sur inscription |
| Catégorie | Tout public |
| Catégorie | Association |
| Tags | Altered |
| Tags | Tournoi |
| Tags | Deckbuilding |

---

## Concert de Jazz

| Attribut | Valeur |
|----------|--------|
| Activité | Musique |
| Type | Concert |
| Format | Présentiel |
| Format | Payant |
| Catégorie | Tout public |
| Catégorie | Culturel |
| Tags | Jazz |
| Tags | Live |
| Tags | Quartet |

> Valide en v1.1 : « Concert » existe désormais comme Type de l'Activité *Musique*
> (et de *Spectacle vivant*), conformément à TAX-011.

---

## Musée du Louvre

| Attribut | Valeur |
|----------|--------|
| Activité | Patrimoine |
| Type | Musée |
| Format | Présentiel |
| Format | Permanent |
| Catégorie | Culturel |
| Catégorie | International |
| Tags | Art |
| Tags | Louvre |
| Tags | Peinture |
| Tags | Sculpture |

---

# 9. Évolutivité

La présente taxonomie est conçue pour être extensible.

Les évolutions futures privilégient :

- l'ajout de nouveaux Types ;
- l'ajout de nouvelles Catégories ;
- l'enrichissement des Tags.

Les Activités doivent rester stables afin de préserver la cohérence globale de la plateforme et des mécanismes de recommandation.

---

# 10. Réconciliation & impact modèle (v1.1)

Cette version fige cinq décisions (arbitrées avec le Product Owner) et leur traduction dans le modèle persistant.

| # | Décision | Impact |
|---|----------|--------|
| 1 | **Format multiple** confirmé (TAX-003). | Suppression du scalaire `Event.eventFormatId` ; création de la table de liaison N-N `event_format_links` (`event_id`, `event_format_id`). |
| 2 | **Catégorie multiple** confirmée (TAX-004). | Suppression du scalaire `Event.categoryId` ; création de la table de liaison N-N `event_category_links` (`event_id`, `category_id`). |
| 3 | **Pas de chevauchement** : les axes de Format (Tarification, Réservation, Visibilité…) restent des qualificatifs, distincts de `Event.price` / `Event.visibility` / Participation (TAX-012). | Aucun champ technique n'est fusionné ni déduit. |
| 4 | **Réconciliation** du mapping Type↔Activité : chaque Type est rattaché à une (ou plusieurs) Activité(s) réelle(s) ; un nom de Type peut se répéter entre Activités (TAX-011). | §3 réécrit par Activité ; `seed.ts` aligné. |
| 5 | **Taxonomie généraliste** confirmée. | `Domain` « Général » regroupant les 20 Activités et leurs Types ; `Domain` « TCG » conservé (V1). Référentiels Format / Catégorie / Tags (re)semés depuis les §4/§5/§6. |

**Migration Prisma associée (résumé)** — voir la migration `*_data01_taxonomy` :

- `EventFormat` : la colonne `activity_id` devient **transverse** (le Format n'est plus rattaché à une Activité) ; l'unicité passe de `(activity_id, name)` à `(name)`.
- `events.event_format_id` et `events.category_id` : **supprimées** (remplacées par les tables de liaison).
- Nouvelles tables : `event_format_links`, `event_category_links` (clés composites, index sur la clé étrangère de liaison).
- La projection de recherche (`search_documents`) expose désormais des **listes** de formats et catégories (au lieu d'un identifiant/nom unique).

> Tant que la migration et l'adaptation applicative (DTO, mappers, services, recherche,
> recommandation, moteur expert, frontend) ne sont pas déployées, cette section fait foi sur
> la cible ; toute divergence code/doc constatée est un reste à faire, pas une entorse à la spec.

---

# 11. Historique

| Version | Description |
|----------|-------------|
| 1.0 | Première rédaction de la taxonomie (Draft). |
| 1.1 | Réconciliation avec le modèle persistant : Format/Catégorie en N-N, Format transverse, mapping Type↔Activité par Activité réelle (TAX-011), non-chevauchement formalisé (TAX-012), taxonomie généraliste sous `Domain` « Général ». Statut : **Validé**. |
