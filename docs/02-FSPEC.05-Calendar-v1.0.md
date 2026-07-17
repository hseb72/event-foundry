# Mon Calendrier

**Document** : FSPEC.05
**Fichier** : 02-FSPEC.05-Calendar-v1.0.md
**Version** : 0.2
**Statut** : Draft

---

# Objectif

Permettre à l'utilisateur de visualiser son planning personnel d'événements.

Le calendrier constitue la vue principale de la plateforme.

Il présente exclusivement les événements pour lesquels l'utilisateur a manifesté un intérêt ou possède une participation.

Le calendrier n'est pas un agenda généraliste.

Il représente la projection personnelle des événements présents dans EventFoundry.

Les événements ne présentant aucun intérêt pour l'utilisateur restent accessibles via la fonctionnalité de recherche.

---

# Périmètre

Cette spécification couvre :

- les vues calendrier ;
- les vues agenda ;
- la navigation temporelle ;
- l'affichage des participations ;
- l'ouverture d'un Event.

Ne couvre pas :

- la modification de la participation (FSPEC.06) ;
- la découverte des événements (FSPEC.04).

---

# Acteurs

## Utilisateur

Consulte son calendrier.

Navigue dans le temps.

Accède à la fiche détaillée d'un événement.

---

# Préconditions

L'utilisateur est authentifié.

Au moins une participation existe.

---

# Workflow

```text
Ouverture

↓

Chargement des participations

↓

Construction du calendrier

↓

Navigation

↓

Consultation d'un Event

↓

Modification éventuelle de la participation

↓

Rafraîchissement automatique
```

---

# Représentations

La V1 propose plusieurs représentations du calendrier.

## Vue Jour

Vision détaillée d'une journée.

---

## Vue Semaine

Vision des sept jours.

---

## Vue Mois

Vision globale.

---

## Vue Agenda

Liste chronologique.

---

## Vue "7 prochains jours"

Vue rapide centrée sur les événements imminents.

---

## Vue "30 prochains jours"

Vue rapide des événements à venir.

---

# Affichage des événements

Chaque carte affiche au minimum :

- titre ;
- date ;
- heure ;
- Activity ;
- Organizer ;
- Venue.

La couleur est déterminée automatiquement par la participation utilisateur.

Pour les événements issus d'un import, un indicateur discret de qualité peut être affiché.

Cette indication est purement informative.

---

# Code couleur

| Situation | Couleur |
|-----------|----------|
| Intéressé | Bleu |
| Réservé | Orange |
| Liste d'attente | Violet |
| Payé | Vert |
| Annulé | Rouge |

Cette palette constitue la palette officielle de la V1.

La personnalisation des couleurs sera étudiée en V2.

---

# Navigation

Actions disponibles :

- Aujourd'hui
- Jour précédent / suivant
- Semaine précédente / suivante
- Mois précédent / suivant
- Choix de la vue
- Sélection directe d'une date

---

# Ouverture d'un Event

Depuis le calendrier, un clic ouvre la fiche complète de l'événement.

Depuis cette fiche l'utilisateur peut :

- consulter les informations ;
- modifier sa participation.

Le calendrier est automatiquement rafraîchi après modification.

---

# Règles métier

### RM-001

Le calendrier n'affiche que les **Event** possédant une **UserParticipation**.

---

### RM-002

Les événements sont toujours affichés par ordre chronologique.

---

### RM-003

La couleur d'un événement est déterminée exclusivement par la participation de l'utilisateur.

---

### RM-003a

Le calendrier est construit exclusivement à partir de la participation de l'utilisateur.

Un événement ne possédant aucune participation n'apparaît jamais dans cette vue.

Il reste néanmoins consultable via la recherche.

---

### RM-004

Toute modification de la participation est immédiatement répercutée dans le calendrier.

---

### RM-005

Les événements supprimés logiquement disparaissent automatiquement du calendrier.

---

### RM-006

Les événements passés restent consultables.

---

### RM-007

Les vues "7 prochains jours" et "30 prochains jours" utilisent toujours la date courante comme point de départ.

---

# Règles d'inclusion dans le calendrier

Un Event apparaît dans le calendrier dès qu'au moins une des conditions suivantes est vraie :

- interested = true
- reservationStatus ≠ NONE
- paymentStatus ≠ NONE

Autrement dit, un événement est présent dans le calendrier tant que l'utilisateur entretient une relation avec celui-ci.

Exemples :

| Interested | Reservation | Payment | Visible |
|------------|-------------|----------|---------|
| false | NONE | NONE | ❌ |
| true | NONE | NONE | ✅ |
| true | RESERVED | NONE | ✅ |
| true | WAITLIST | NONE | ✅ |
| true | CANCELLED | NONE | ✅ |
| false | RESERVED | PAID | ✅ |

Lorsque toutes les informations reviennent à leur état neutre :

- interested = false
- reservationStatus = NONE
- paymentStatus = NONE

l'événement disparaît automatiquement du calendrier personnel.

Il reste disponible via la recherche.

---

# API concernées

```
GET /api/v1/me/calendar

GET /api/v1/events/{id}

PUT /api/v1/events/{id}/participation
```

---

# Tables concernées

- events
- user_participation

---

# Critères d'acceptation

### CA-001

Le calendrier affiche uniquement les événements personnels.

---

### CA-002

Les couleurs correspondent au statut de participation.

---

### CA-003

Les vues Jour, Semaine, Mois et Agenda fonctionnent.

---

### CA-004

Les vues rapides "7 jours" et "30 jours" fonctionnent.

---

### CA-005

Toute modification de participation est immédiatement visible.

---

### CA-006

Les événements passés restent consultables.

---

### CA-007

Lorsqu'un utilisateur retire totalement sa participation :

- interested = false
- reservationStatus = NONE
- paymentStatus = NONE

l'événement disparaît immédiatement du calendrier tout en restant disponible dans la recherche.

---

# Tests fonctionnels

### TF-001

Afficher le mois courant.

Résultat attendu :

Tous les événements du mois sont affichés.

---

### TF-002

Afficher les 7 prochains jours.

Résultat attendu :

Seuls les événements de cette période sont affichés.

---

### TF-003

Modifier une participation.

Résultat attendu :

Le calendrier est immédiatement mis à jour.

---

### TF-004

Ouvrir un événement.

Résultat attendu :

La fiche détaillée est affichée.

---

### TF-005

Afficher les événements passés.

Résultat attendu :

Ils restent consultables.

---

### TF-006

Déclarer un événement comme "Intéressé".

Résultat attendu :

L'événement apparaît immédiatement dans le calendrier.

---

### TF-007

Supprimer totalement sa participation.

Résultat attendu :

L'événement disparaît du calendrier mais reste accessible via la recherche.

---

### TF-008

Passer une réservation en WAITLIST.

Résultat attendu :

L'événement reste présent dans le calendrier avec la couleur violette.

---

# Questions ouvertes

Les éléments suivants sont explicitement hors périmètre V1 :

- synchronisation Google Calendar ;
- synchronisation Outlook ;
- export ICS ;
- personnalisation des couleurs ;
- gestion de plusieurs calendriers.

Ces sujets sont documentés dans le Backlog.

---

# Documents liés

- VISION
- ARCHI.02
- ARCHI.03
- ARCHI.04
- FSPEC.03
- FSPEC.04
- FSPEC.06

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 1.0 | Ajout des vues rapides, clarification du rôle du calendrier, règles d'inclusion, statut WAITLIST, palette officielle V1 et synchronisation immédiate avec la participation. |