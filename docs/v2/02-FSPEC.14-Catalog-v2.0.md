# Catalog

**Document** : FSPEC.14

**Fichier** : 02-FSPEC.14-Catalog-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le rôle du catalogue dans l'architecture fonctionnelle d'EventFoundry.

Le catalogue centralise l'ensemble des événements publiés sur la plateforme.

Il constitue le patrimoine culturel exploité par les différents services de l'application.

Le catalogue n'est plus le produit.

Il devient une ressource commune.

---

# Philosophie

Le catalogue n'est pas conçu pour être parcouru systématiquement par les utilisateurs.

Son rôle est de fournir des données qualifiées aux différents domaines fonctionnels.

Le planning, la découverte et le moteur de recommandation s'appuient sur ce patrimoine documentaire.

---

# Les objectifs

Le catalogue permet notamment de :

- centraliser les événements publiés ;
- garantir une information cohérente ;
- alimenter les recherches ;
- alimenter les recommandations ;
- enrichir le planning ;
- produire des statistiques.

---

# Les sources

Le catalogue est alimenté par plusieurs mécanismes.

## Publication

Les événements publiés par les organisateurs constituent la principale source d'alimentation.

---

## Pipeline documentaire

Les imports documentaires produisent des événements qualifiés qui rejoignent le catalogue après validation.

---

## Référentiels

Les référentiels enrichissent les événements.

Exemples :

- activités ;
- organisateurs ;
- lieux ;
- communes ;
- catégories.

---

# Les consommateurs

Le catalogue est utilisé par plusieurs domaines.

## Discovery

La recherche interroge directement le catalogue.

---

## Recommendation Engine

Le moteur sélectionne les événements les plus pertinents selon les règles métier.

---

## Planning

Les événements retenus peuvent enrichir le planning personnel.

---

## Notifications

Les nouveautés du catalogue peuvent générer des notifications selon les préférences de l'utilisateur.

---

## Statistiques

Le catalogue constitue également la base des indicateurs de diffusion.

---

# Les principes

## Une source unique

Chaque événement possède une représentation unique dans le catalogue.

---

## Des données qualifiées

Les événements sont enrichis avant publication.

---

## Une séparation des responsabilités

Le catalogue ne contient aucune logique de recommandation.

Il ne contient aucune logique de planning.

Il ne contient aucune logique de personnalisation.

Ces traitements sont réalisés par les domaines fonctionnels spécialisés.

---

## Une ressource commune

Tous les domaines métier exploitent le même patrimoine documentaire.

---

# Les interactions

Le cycle de vie d'un événement suit le parcours suivant.

Publication

↓

Qualification

↓

Catalogue

↓

Recherche

↓

Recommandations

↓

Planning

↓

Participation

Cette organisation garantit qu'un événement n'est qualifié qu'une seule fois avant d'être réutilisé par toute la plateforme.

---

# Notre différence

Dans la V1, le catalogue constituait le principal point d'entrée de l'application.

Dans la V2, il devient une infrastructure métier au service de l'assistant culturel.

Cette évolution constitue l'un des changements majeurs de la plateforme.

---

# Documents liés

02-FSPEC.03-Events-v1.0

02-FSPEC.07-ReferenceData-v1.0

02-FSPEC.08-Planning-v2.0

02-FSPEC.09-RecommendationEngine-v2.0

02-FSPEC.12-Discovery-v2.0

02-FSPEC.13-Publishing-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification du rôle du catalogue dans l'architecture fonctionnelle V2. |