# Gestion de la Participation Utilisateur

**Document** : FSPEC.06  
**Fichier** : 02-FSPEC.06-Participation-v0.2.md  
**Version** : 0.2  
**Statut** : Draft

---

# Objectif

Permettre à chaque utilisateur de gérer sa relation personnelle avec un Event.

La participation est totalement indépendante de l'événement lui-même.

Chaque utilisateur possède sa propre participation.

La participation constitue le lien entre la recherche d'événements et le calendrier personnel.

---

# Périmètre

Cette spécification couvre :

- la création d'une participation ;
- la modification d'une participation ;
- la suppression d'une participation ;
- les informations personnelles associées à un Event.

Elle ne couvre pas :

- les réservations réelles ;
- les paiements réels ;
- les plateformes tierces ;
- les billets électroniques.

---

# Acteurs

## Utilisateur

Déclare son intérêt.

Suit ses réservations.

Suit ses paiements.

Retire sa participation.

---

# Préconditions

L'utilisateur est authentifié.

L'Event existe.

---

# Workflow

```text
Recherche

↓

Consultation Event

↓

Création / modification Participation

↓

Mise à jour immédiate

↓

Calendrier
```

La participation peut être modifiée à tout moment.

---

# Modèle de participation

La participation est constituée de trois informations indépendantes.

## Intérêt

```text
true

false
```

---

## Réservation

```text
NONE

RESERVED

WAITLIST

CANCELLED
```

---

## Paiement

```text
NONE

PENDING

PAID

REFUNDED
```

Aucune dépendance automatique n'existe entre ces trois informations.

---

# Cas d'utilisation

## UC01 — Déclarer son intérêt

L'utilisateur indique simplement :

```
interested = true
```

L'Event apparaît immédiatement dans son calendrier.

---

## UC02 — Réserver

L'utilisateur indique qu'il possède une réservation.

La plateforme ne réalise aucune réservation.

---

## UC03 — Liste d'attente

L'utilisateur indique être sur liste d'attente.

Le calendrier affiche l'événement avec la couleur associée.

---

## UC04 — Déclarer un paiement

L'utilisateur indique avoir payé.

Le système mémorise uniquement cette information.

---

## UC05 — Annuler une réservation

L'utilisateur peut annuler sa réservation.

Cette action ne modifie pas automatiquement son intérêt.

Exemple :

```
Interested = true

Reservation = CANCELLED
```

reste parfaitement valide.

---

## UC06 — Retirer totalement sa participation

L'utilisateur remet :

```
Interested = false

Reservation = NONE

Payment = NONE
```

L'événement disparaît immédiatement de son calendrier.

Il reste accessible via la recherche.

---

# Règles métier

### RM-001

Une seule participation existe par couple :

```
Utilisateur

+

Event
```

---

### RM-002

La participation est entièrement indépendante de l'Event.

---

### RM-003

Modifier une participation ne modifie jamais l'Event.

---

### RM-004

Les attributs Interested, Reservation et Payment sont totalement indépendants.

Le système ne réalise jamais de déduction automatique.

---

### RM-005

Une réservation annulée n'implique pas la perte d'intérêt.

---

### RM-006

Une participation existe dès qu'au moins une information est renseignée :

- Interested = true
- Reservation ≠ NONE
- Payment ≠ NONE

---

### RM-007

Lorsque toutes les informations reviennent à leur état neutre :

```
Interested = false

Reservation = NONE

Payment = NONE
```

la participation est supprimée.

L'événement disparaît du calendrier.

---

### RM-008

La suppression logique d'un Event conserve les participations.

---

# Interfaces utilisateur

## Depuis la recherche

Actions :

- Je suis intéressé
- Réserver
- Liste d'attente
- Paiement
- Retirer ma participation

---

## Depuis la fiche Event

Toutes les informations sont modifiables.

---

## Depuis le calendrier

Les mêmes actions sont disponibles.

Toute modification est immédiatement visible.

---

# API concernées

```text
PUT /api/v1/events/{id}/participation

GET /api/v1/events/{id}

GET /api/v1/me/calendar
```

---

# Tables concernées

- user_participation
- events

---

# Critères d'acceptation

### CA-001

Un utilisateur peut créer une participation.

---

### CA-002

Une participation est immédiatement visible dans le calendrier.

---

### CA-003

Chaque utilisateur possède sa propre participation.

---

### CA-004

Annuler une réservation ne retire pas automatiquement l'intérêt.

---

### CA-005

Retirer totalement sa participation retire immédiatement l'Event du calendrier.

---

### CA-006

Les participations restent indépendantes entre utilisateurs.

---

# Tests fonctionnels

### TF-001

Déclarer un intérêt.

Résultat attendu :

L'Event apparaît dans le calendrier.

---

### TF-002

Déclarer une réservation.

Résultat attendu :

Le statut devient RESERVED.

---

### TF-003

Passer en WAITLIST.

Résultat attendu :

Le calendrier affiche la couleur violette.

---

### TF-004

Annuler une réservation.

Résultat attendu :

L'événement reste présent si Interested = true.

---

### TF-005

Retirer totalement la participation.

Résultat attendu :

L'Event disparaît du calendrier mais reste trouvable via la recherche.

---

### TF-006

Deux utilisateurs modifient leur participation.

Résultat attendu :

Les deux participations restent totalement indépendantes.

---

# Évolutions identifiées (V2)

Les évolutions suivantes sont explicitement hors périmètre V1 :

- rôle de participation (Participant, Bénévole, Organisateur, Arbitre, Exposant, Invité...) ;
- notes personnelles sur un Event ;
- rappels ;
- notifications ;
- historique complet des changements de participation.

Ces éléments seront documentés dans le Backlog.

---

# Documents liés

- VISION
- ARCHI.02
- ARCHI.03
- ARCHI.04
- FSPEC.03
- FSPEC.04
- FSPEC.05

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 0.2 | Clarification du lien avec le calendrier, indépendance complète des statuts, règles de suppression de participation et préparation des rôles V2. |