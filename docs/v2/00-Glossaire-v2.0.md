# Glossaire

**Document** : GLOSSAIRE

**Fichier** : 00-Glossaire-v2.0.md

**Version** : 2.0

**Statut** : Référence

---

# Objectif

Ce document définit le vocabulaire de référence utilisé dans la documentation EventFoundry V2.

Chaque terme possède une définition unique afin de garantir une compréhension commune des concepts métier et des choix d'architecture.

---

# Assistant culturel

Positionnement produit d'EventFoundry.

L'application accompagne l'utilisateur dans sa découverte et sa pratique culturelle en lui proposant des recommandations personnalisées et en l'aidant à construire son planning.

---

# Catalogue

Patrimoine culturel de la plateforme.

Le catalogue centralise l'ensemble des événements publiés et qualifiés.

Il constitue une ressource commune utilisée par les différents domaines fonctionnels.

Le catalogue n'est pas le produit.

---

# Événement

Activité culturelle publiée dans le catalogue.

Un événement possède des caractéristiques propres (date, lieu, organisateur, catégorie, etc.).

Il constitue l'unité documentaire de base de la plateforme.

---

# Publication

Processus par lequel un événement est créé, enrichi, validé puis intégré au catalogue.

---

# Discovery

Fonction permettant d'explorer le patrimoine culturel de la plateforme.

Discovery complète les recommandations et le planning en laissant l'utilisateur rechercher librement des événements.

---

# Recommandation

Sélection d'événements proposée à un utilisateur selon des règles métier déterministes.

Une recommandation est explicable.

Elle peut être acceptée, ignorée ou refusée.

---

# Notification

Canal de communication utilisé pour informer un utilisateur.

Une notification transporte une information.

Elle ne constitue pas un objet métier.

---

# Planning

Organisation personnelle des événements retenus par l'utilisateur.

Le planning constitue le cœur de l'expérience Explorer.

---

# Participation

Relation entre un utilisateur et un événement.

Elle traduit l'intention ou la confirmation de participer.

---

# Explorer

Expérience destinée au grand public.

Elle permet de découvrir des événements, gérer son planning et recevoir des recommandations.

---

# Organizer

Expérience destinée aux organisateurs.

Elle permet de publier et de gérer des événements.

---

# Operator

Expérience destinée aux administrateurs et opérateurs de la plateforme.

Elle permet d'assurer le fonctionnement et la qualité du système.

---

# Expérience

Contexte d'utilisation de l'application.

Une expérience définit les fonctionnalités et la navigation présentées à un utilisateur selon son rôle.

---

# Identité

Compte unique représentant une personne dans EventFoundry.

Une identité peut disposer de plusieurs rôles.

---

# Rôle

Fonction attribuée à une identité.

Les rôles déterminent les permissions accordées.

---

# Permission

Autorisation permettant d'effectuer une action donnée.

Les permissions sont accordées via les rôles.

---

# Abonnement

Configuration permettant à un utilisateur d'accéder à certaines fonctionnalités ou services.

L'abonnement ne modifie ni les rôles ni les permissions.

---

# Référentiels

Ensemble des données de référence utilisées pour qualifier les événements.

Exemples :

- catégories ;
- lieux ;
- communes ;
- organisateurs ;
- activités.

---

# Patrimoine culturel

Ensemble des événements publiés constituant la richesse documentaire de la plateforme.

Le patrimoine culturel est exploité par Discovery, le moteur de recommandation et le Planning.

---

# Documents liés

10-STRAT.01-ProductVision-v2.0

02-FSPEC.14-Catalog-v2.0

99-ADR.11-IdentityRolesExperiencesSubscriptions

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Création du glossaire de référence de la V2. |