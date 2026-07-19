# Functional Specifications V2

**Document** : V2.04

**Fichier** : 12-V2.01-FunctionalSpecifications-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir les fonctionnalités proposées par EventFoundry V2.

Ce document traduit la vision produit en exigences fonctionnelles.

Il constitue la référence pour les développements des interfaces Explorer, Organizer et Operator.

---

# Principes

Toutes les fonctionnalités décrites dans ce document doivent respecter les principes définis par la vision produit.

En particulier :

- le planning constitue le cœur de l'expérience Explorer ;
- le catalogue est une ressource interne ;
- les recommandations sont déterministes et explicables ;
- chaque expérience reste adaptée à son utilisateur.

---

# Les domaines fonctionnels

La plateforme est organisée autour de plusieurs domaines fonctionnels.

- Planning
- Assistant culturel
- Découverte
- Catalogue
- Participation
- Réservations
- Suivis
- Notifications
- Publication
- Administration

Chaque domaine regroupe un ensemble cohérent de fonctionnalités.

---

# Planning

Le planning constitue le point d'entrée principal de l'expérience Explorer.

Il rassemble tous les événements qui concernent l'utilisateur.

---

## Fonctionnalités

Le planning permet notamment :

- consulter son agenda ;
- visualiser les événements passés ;
- visualiser les événements à venir ;
- distinguer les événements confirmés des suggestions ;
- identifier les créneaux disponibles.

---

## Sources d'alimentation

Le planning est alimenté automatiquement par :

- les participations ;
- les réservations ;
- les événements suivis ;
- les suggestions acceptées.

---

# Assistant culturel

L'assistant accompagne l'utilisateur dans l'organisation de sa vie culturelle.

Il exploite les informations disponibles afin de proposer des recommandations pertinentes.

---

## Fonctionnalités

L'assistant est capable de :

- proposer des événements adaptés ;
- compléter les créneaux disponibles ;
- recommander des alternatives ;
- favoriser la découverte ;
- expliquer chaque recommandation.

---

# Découverte

La découverte permet d'explorer librement le catalogue.

Elle complète les recommandations automatiques.

---

## Fonctionnalités

L'utilisateur peut notamment :

- rechercher une activité ;
- rechercher une ville ;
- rechercher un organisateur ;
- filtrer les événements ;
- préparer un déplacement.

---

# Catalogue

Le catalogue centralise les événements publiés sur la plateforme.

Il constitue la source de données utilisée par les différents services.

Les utilisateurs n'interagissent plus directement avec le catalogue comme objectif principal.

---

# Participations

Une participation représente la relation entre un utilisateur et un événement.

Elle permet notamment :

- d'exprimer un intérêt ;
- de gérer une réservation ;
- de suivre un paiement.

Les états restent définis par le modèle métier de la V1.

---

# Réservations

La plateforme permet de suivre les réservations associées aux événements.

Selon les cas :

- réservation externe ;
- réservation interne ;
- événement libre.

Les réservations alimentent automatiquement le planning.

---

# Suivis

Le suivi permet de personnaliser l'expérience utilisateur.

L'utilisateur peut suivre :

- un organisateur ;
- un lieu ;
- une activité.

Ces informations améliorent les recommandations.

---

# Notifications

Les notifications informent l'utilisateur des événements importants.

Exemples :

- nouvelle publication d'un organisateur suivi ;
- modification d'un événement ;
- rappel avant un événement ;
- proposition correspondant à un créneau libre.

Toutes les notifications restent configurables.

---

# Publication

L'expérience Organizer permet de publier rapidement de nouveaux événements.

Les principales fonctionnalités sont :

- import documentaire ;
- création manuelle ;
- modification ;
- publication ;
- suivi statistique.

Le pipeline documentaire développé lors de la V1 reste inchangé.

---

# Administration

L'expérience Operator assure le fonctionnement de la plateforme.

Elle permet notamment :

- superviser le pipeline ;
- valider les événements ;
- gérer les référentiels ;
- administrer les utilisateurs ;
- suivre les traitements.

---

# Les interactions entre domaines

Les différents domaines collaborent.

Par exemple :

Le catalogue alimente les recommandations.

Les recommandations enrichissent le planning.

Les participations améliorent les recommandations.

Les suivis personnalisent les suggestions.

Les réservations alimentent automatiquement le planning.

Cette organisation permet un enrichissement continu de l'expérience utilisateur.

---

# Les principes fonctionnels

Chaque nouvelle fonctionnalité devra respecter les règles suivantes.

## Priorité au planning

Une fonctionnalité Explorer doit améliorer directement le planning ou sa qualité.

---

## Assistance proactive

Le système privilégie les propositions automatiques plutôt que les recherches manuelles.

---

## Transparence

Chaque recommandation doit pouvoir être justifiée.

---

## Simplicité

Le nombre d'actions nécessaires pour accomplir une tâche doit rester minimal.

---

## Évolutivité

Les fonctionnalités doivent pouvoir évoluer sans remettre en cause les autres domaines fonctionnels.

---

# Documents liés

11-V2.01-ProductVision-v2.0

11-V2.02-Personas-v2.0

11-V2.03-UserExperiences-v2.0

12-V2.02-RecommendationEngine-v2.0

12-V2.03-ProfilesAndPermissions-v2.0

03-TechnicalSpecifications-v1.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première version des spécifications fonctionnelles de la V2. |