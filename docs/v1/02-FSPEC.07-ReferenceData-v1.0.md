# Gestion des Référentiels

**Document** : FSPEC.07  
**Fichier** : 02-FSPEC.07-ReferenceData-v1.0.md  
**Version** : 1.0  
**Statut** : Validé

---

# Objectif

Permettre l'administration des référentiels métier utilisés par l'ensemble de la plateforme.

Les référentiels constituent la connaissance métier d'EventFoundry.

Ils sont utilisés par :

- les formulaires de saisie ;
- les recherches ;
- les validations métier ;
- le moteur expert de classification.

Toute évolution des référentiels doit être immédiatement prise en compte par la plateforme sans redéploiement.

---

# Périmètre

Cette spécification couvre :

- la consultation des référentiels ;
- leur création ;
- leur modification ;
- leur désactivation ;
- la gestion des alias.

Elle ne couvre pas :

- le fonctionnement interne du moteur expert (TSPEC) ;
- les imports ;
- les EventCandidate.

---

# Acteurs

## Administrateur

Gère les référentiels.

Ajoute de nouvelles valeurs.

Corrige les valeurs existantes.

Désactive les valeurs obsolètes.

---

## Utilisateur

Consulte les référentiels au travers des listes de sélection.

Aucune modification n'est autorisée.

---

# Référentiels V1

## Domain

Exemples :

- TCG
- Musique
- Sport
- Culture

Le Domain est uniquement utilisé pour structurer les référentiels.

Il n'est jamais sélectionné directement lors de la création d'un Event.

---

## Activity

Chaque Activity appartient à un Domain.

Exemples :

- Magic
- Pokémon
- Lorcana
- One Piece
- Flesh & Blood
- Running
- Metal

---

## EventType

Chaque EventType appartient à une Activity.

Exemples :

- Avant-première
- Tournoi
- Concert
- Convention
- Course

---

## EventFormat

Le format appartient à une Activity.

Il est facultatif.

---

## Organizer

Organisateur d'un événement.

---

## Venue

Lieu où se déroule l'événement.

---

## Alias

Chaque valeur métier peut posséder plusieurs alias.

Les alias sont utilisés exclusivement par le moteur expert.

Exemple :

```
Magic

↓

Magic The Gathering

↓

MTG
```

↓

Activity = Magic

---

# Cycle de vie

Création

↓

Modification

↓

Désactivation

Une suppression physique n'est jamais réalisée.

---

# Règles métier

### RM-001

Tous les référentiels sont administrables.

---

### RM-002

Toutes les suppressions sont logiques.

Le champ :

```
is_active
```

est utilisé.

---

### RM-003

Les valeurs inactives :

- ne sont plus proposées dans les listes ;
- restent utilisables par les anciens Events.

---

### RM-004

Les alias sont uniques.

Une même écriture ne peut référencer qu'une seule valeur métier.

---

### RM-005

Toute modification est immédiatement disponible pour :

- les formulaires ;
- les recherches ;
- le moteur expert.

---

### RM-006

Les dépendances hiérarchiques sont toujours respectées.

Exemple :

Activity

↓

EventType

Le système interdit toute incohérence.

---

### RM-007

Les référentiels constituent la base de connaissance du moteur expert.

Le code de classification ne contient aucune liste codée en dur.

Toute nouvelle connaissance métier est ajoutée via les référentiels.

---

# Interfaces utilisateur

Chaque référentiel possède :

- une liste ;
- un écran de création ;
- un écran de modification.

Les listes affichent :

- nom ;
- nombre d'utilisations ;
- état (Actif / Inactif).

---

# Alias

Chaque élément possède sa propre liste d'alias.

Les alias peuvent être :

- ajoutés ;
- modifiés ;
- désactivés.

Ils sont pris en compte dès l'import suivant.

---

# API concernées

Toutes les ressources suivent le même contrat REST.

Exemple :

GET /api/v1/activities

POST /api/v1/activities

PUT /api/v1/activities/{id}

DELETE /api/v1/activities/{id}

Les ressources de consultation retournent uniquement les valeurs actives.

Les interfaces d'administration peuvent demander les valeurs inactives.

---

# Critères d'acceptation

### CA-001

Tous les référentiels peuvent être consultés.

---

### CA-002

Tous les référentiels peuvent être créés.

---

### CA-003

Les valeurs peuvent être désactivées.

---

### CA-004

Les anciens Events restent cohérents.

---

### CA-005

Les alias sont immédiatement utilisables lors d'un import.

---

### CA-006

Aucun redéploiement n'est nécessaire après modification d'un référentiel.

---

# Tests fonctionnels

### TF-001

Créer une nouvelle Activity.

Résultat attendu :

Elle apparaît immédiatement dans les formulaires.

---

### TF-002

Créer un nouvel alias.

Résultat attendu :

Le moteur expert reconnaît cette nouvelle écriture.

---

### TF-003

Désactiver une Activity.

Résultat attendu :

Elle disparaît des listes mais reste visible sur les anciens Events.

---

### TF-004

Modifier un Organizer.

Résultat attendu :

Les nouveaux Events utilisent immédiatement cette valeur.

---

### TF-005

Créer un nouvel EventType.

Résultat attendu :

Il est immédiatement disponible dans les imports, les formulaires et les recherches.

---

# Évolutions identifiées (V2)

Les sujets suivants sont hors périmètre V1 :

- import/export CSV des référentiels ;
- fusion de doublons ;
- versionnement des référentiels ;
- gestion multilingue ;
- hiérarchies multiples.

---

# Documents liés

- VISION
- ARCHI.02
- ARCHI.03
- ARCHI.04
- FSPEC.01
- FSPEC.02
- FSPEC.03

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 0.2 | Ajout des référentiels actifs, suppression logique, rôle des référentiels dans le moteur expert et clarification du Domain comme donnée déduite. |
| 1.0 | Spécification validée pour la V1. |
