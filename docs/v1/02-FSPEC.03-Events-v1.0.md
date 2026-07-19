# Gestion des Events

**Document** : FSPEC.03  
**Fichier** : 02-FSPEC.03-Events-v1.0.md  
**Version** : 1.0  
**Statut** : Validé

---

# Historique des modifications

Version 0.2

- suppression de la saisie du Domain ;
- ajout de la provenance d'un Event ;
- clarification Organizer / Venue ;
- prise en compte des référentiels inactifs.

---

# Objectif

Permettre la création, la consultation, la modification et la suppression logique des événements de la plateforme.

Un **Event** constitue la représentation officielle d'un événement dans EventFoundry.

Tous les autres composants (Recherche, Calendrier, Participation...) manipulent exclusivement des **Event**.

---

# Création d'un Event

Deux modes de création existent.

## Création depuis un EventCandidate

```
Import

↓

EventCandidate

↓

Validation

↓

Event
```

---

## Création manuelle

```
Nouvel Event

↓

Saisie

↓

Validation

↓

Event
```

Les deux mécanismes produisent exactement le même objet métier.

La seule différence est la valeur du champ **source**.

---

# Provenance

Chaque Event possède une provenance.

Valeurs V1 :

- IMPORT
- MANUAL

Cette information est calculée automatiquement.

Elle est utilisée :

- pour les statistiques ;
- pour l'audit ;
- pour le suivi qualité.

Elle n'est jamais modifiable par l'utilisateur.

---

# Données éditables

Lors de la création ou de la modification, l'utilisateur renseigne :

- titre ;
- description ;
- date de début ;
- date de fin (optionnelle) ;
- prix (optionnel) ;
- devise ;
- Activity ;
- EventType ;
- EventFormat (optionnel) ;
- Organizer ;
- Venue.

Le **Domain n'est jamais demandé**.

Il est automatiquement déduit de l'Activity.

---

# Organizer et Venue

Les notions sont indépendantes.

Un Organizer peut organiser des événements dans plusieurs lieux.

Un Venue peut accueillir des événements organisés par plusieurs Organizer.

Le lien entre les deux n'est pas obligatoire.

---

# Référentiels

Les listes proposées à l'utilisateur ne présentent que les valeurs actives.

Les Events existants continuent cependant d'utiliser des valeurs devenues inactives.

L'utilisateur peut donc consulter un ancien événement sans incohérence.

---

# Règles métier

### RM-001

Le Domain est toujours déduit de l'Activity.

---

### RM-002

L'Activity est obligatoire.

---

### RM-003

Le EventType doit appartenir à l'Activity.

---

### RM-004

Le EventFormat, lorsqu'il est renseigné, doit appartenir à cette même Activity.

---

### RM-005

L'Organizer et le Venue sont deux informations indépendantes.

Le système ne crée jamais de dépendance artificielle entre eux.

---

### RM-006

La provenance d'un Event est figée lors de sa création.

Elle ne peut plus être modifiée.

---

### RM-007

Les suppressions restent exclusivement logiques.

---

# Critères d'acceptation supplémentaires

### CA-008

Le Domain est correctement déterminé à partir de l'Activity.

---

### CA-009

Les référentiels inactifs ne sont plus proposés lors de la création d'un Event.

---

### CA-010

La provenance est correctement renseignée :

- IMPORT pour les Events issus d'un EventCandidate ;
- MANUAL pour les créations manuelles.

---

# Tests fonctionnels supplémentaires

### TF-007

Créer un Event manuel.

Résultat attendu :

```
source = MANUAL
```

---

### TF-008

Valider un EventCandidate.

Résultat attendu :

```
source = IMPORT
```

---

### TF-009

Désactiver une Activity.

Résultat attendu :

Elle disparaît des listes de création mais reste visible sur les anciens Events.

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 1.0 | Domain déduit de l'Activity, ajout de la provenance, clarification Organizer/Venue, gestion des référentiels inactifs ; spécification validée pour la V1. |
