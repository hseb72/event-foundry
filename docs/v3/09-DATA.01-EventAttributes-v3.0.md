# SPEC – Taxonomie des événements EventFoundry

**Document** : SPEC-EVENT-TAXONOMY

**Version** : 1.0

**Statut** : Draft

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
Activité
    ↓
Type
    ↓
Format
    ↓
Catégorie
    ↓
Tags
```

Chaque niveau possède une responsabilité précise.

---

# 2. Activité

## Définition

L'Activité représente le domaine principal auquel appartient l'événement.

Il s'agit du niveau le plus élevé de classification.

Le nombre de valeurs doit rester volontairement limité afin de garantir une navigation cohérente.

Un événement possède **une seule Activité**.

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

Les Types sont organisés par Activité.

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

## Visite

| Type |
|------|
| Visite guidée |
| Visite libre |
| Circuit |
| Balade |
| Randonnée découverte |
| Parcours |

---

## Spectacle

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
| Lecture publique |
| Performance artistique |
| Happening |

---

## Exposition

| Type |
|------|
| Exposition |
| Salon |
| Convention |
| Foire |
| Biennale |
| Marché artisanal |
| Vide-grenier |
| Bourse |
| Collection |
| Démonstration |

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
| Tournoi sportif |
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

## Formation

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

## Gastronomie

| Type |
|------|
| Dégustation |
| Marché gourmand |
| Festival culinaire |
| Cours de cuisine |
| Repas |

---

## Famille

| Type |
|------|
| Animation |
| Spectacle enfant |
| Atelier enfant |
| Chasse au trésor |

---

# 4. Format

## Définition

Le Format décrit la manière dont se déroule l'événement.

Contrairement au Type, le Format est indépendant de la nature de l'événement.

Un événement peut posséder plusieurs Formats.

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

Un événement peut appartenir à plusieurs catégories.

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
| TAX-002 | Chaque événement possède exactement un Type. |
| TAX-003 | Un événement peut posséder plusieurs Formats. |
| TAX-004 | Un événement peut appartenir à plusieurs Catégories. |
| TAX-005 | Un événement peut posséder un nombre illimité de Tags. |
| TAX-006 | Les Tags sont extensibles sans modification de la taxonomie. |
| TAX-007 | Les Activités sont limitées et rarement modifiées. |
| TAX-008 | Les Types évoluent avec les besoins fonctionnels. |
| TAX-009 | Les Formats décrivent uniquement la manière dont se déroule l'événement. |
| TAX-010 | Les Catégories sont destinées au filtrage fonctionnel. |

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