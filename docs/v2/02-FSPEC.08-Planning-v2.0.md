# Planning

**Document** : V2.03

**Fichier** : 02-FSPEC.08-Planning-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le fonctionnement du planning personnel.

Le planning constitue le cœur de l'expérience Explorer.

Toutes les fonctionnalités de la plateforme ont pour objectif direct ou indirect d'enrichir ce planning.

---

# Philosophie

Le planning n'est pas un simple calendrier.

Il représente la vie culturelle de l'utilisateur.

Il rassemble :

- les événements prévus ;
- les réservations ;
- les suggestions acceptées ;
- les événements suivis ;
- l'historique des participations.

Le planning devient ainsi le point d'entrée naturel de l'application.

---

# Les objectifs

Le planning permet à l'utilisateur de répondre immédiatement aux questions suivantes.

- Que fais-je aujourd'hui ?
- Que fais-je cette semaine ?
- Quels créneaux sont encore disponibles ?
- Quels événements nécessitent une action ?

---

# Les sources du planning

Le planning est alimenté automatiquement par plusieurs mécanismes.

---

## Participations

Toute participation confirmée apparaît dans le planning.

---

## Réservations

Une réservation crée automatiquement une entrée dans le planning.

Le statut de la réservation est visible.

---

## Suggestions acceptées

Lorsqu'une recommandation est acceptée, elle est ajoutée au planning.

---

## Événements suivis

Un événement simplement suivi peut apparaître dans le planning selon les préférences de l'utilisateur.

Il reste clairement identifié comme non confirmé.

---

# Les états

Chaque élément du planning possède un état.

Exemples :

- suggestion ;
- suivi ;
- réservé ;
- confirmé ;
- annulé ;
- terminé.

Ces états permettent à l'utilisateur de distinguer immédiatement les actions à réaliser.

---

# Les vues

Le planning peut être consulté selon plusieurs périodes.

- Aujourd'hui
- Cette semaine
- Ce mois
- Agenda

La vue "Aujourd'hui" constitue le point d'entrée par défaut.

---

# Les créneaux disponibles

Le planning identifie automatiquement les périodes libres.

Ces créneaux sont utilisés par le moteur de recommandation.

Ils peuvent être mis en avant afin de suggérer de nouvelles activités.

---

# Les conflits

Le planning détecte les conflits.

Exemples :

- deux événements simultanés ;
- événements incompatibles géographiquement ;
- réservation en attente sur un créneau occupé.

Le système informe l'utilisateur.

Il ne prend jamais de décision à sa place.

---

# Les actions

Depuis le planning, l'utilisateur peut notamment :

- consulter un événement ;
- confirmer une suggestion ;
- supprimer une suggestion ;
- accéder à la réservation ;
- partager un événement ;
- ajouter un rappel.

Le planning devient ainsi le point central de toutes les interactions.

---

# Les interactions

Le planning échange des informations avec les autres domaines.

Le moteur de recommandation analyse les créneaux libres.

Les suivis influencent les propositions.

Les réservations alimentent automatiquement le planning.

Les notifications rappellent les événements à venir.

Cette centralisation garantit une expérience cohérente.

---

# Les principes

Le planning respecte plusieurs principes.

## Priorité à la lisibilité

L'utilisateur doit comprendre son agenda en quelques secondes.

---

## Priorité aux actions

Chaque événement doit permettre une action simple.

---

## Priorité au contexte

Les recommandations tiennent compte du contenu du planning.

---

## Priorité au contrôle

L'utilisateur reste maître de son agenda.

Aucune modification automatique n'est réalisée.

---

# Notre différence

Les calendriers traditionnels affichent ce qui est déjà prévu.

Le planning EventFoundry aide également à identifier ce qui pourrait enrichir la vie culturelle de l'utilisateur.

Il devient un outil de décision.

---

# Citation fondatrice

> Le planning n'est pas une conséquence de l'application.

> Il est l'application.

---

# Documents liés

10-STRAT.01-ProductVision-v2.0

02-FSPEC.00-FunctionalSpecifications-v2.0

02-FSPEC.09-RecommendationEngine-v2.0

02-FSPEC.10-ProfilesAndPermissions-v2.0

02-FSPEC.11-Notifications-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification du planning personnel, cœur fonctionnel d'EventFoundry V2. |