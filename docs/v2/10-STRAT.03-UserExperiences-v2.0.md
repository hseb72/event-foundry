# User Experiences

**Document** : V2.03

**Fichier** : 10-STRAT.03-UserExperiences-v2.0.md

**Version** : 2.0

**Statut** : Vision

---

# Objectif

Définir les différentes expériences utilisateur proposées par EventFoundry.

Chaque expérience est conçue pour répondre à un objectif précis.

Toutes reposent sur une plateforme unique et un modèle de données commun, mais proposent une interface, une navigation et des fonctionnalités adaptées aux besoins de leurs utilisateurs.

---

# Une plateforme, plusieurs expériences

EventFoundry est une plateforme unique.

Elle ne propose pas une interface universelle dans laquelle toutes les fonctionnalités sont visibles.

Elle adapte son fonctionnement selon l'expérience sélectionnée.

Chaque expérience possède :

- sa navigation ;
- son vocabulaire ;
- son tableau de bord ;
- ses écrans ;
- ses actions principales.

L'utilisateur a ainsi le sentiment d'utiliser une application conçue spécialement pour lui.

---

# Une expérience centrée sur les objectifs

Chaque expérience est construite autour d'une question simple.

Explorer :

> Que vais-je faire ?

Organizer :

> Comment publier mes événements ?

Operator :

> Comment garantir le bon fonctionnement de la plateforme ?

Ces objectifs déterminent l'organisation complète de l'interface.

---

# L'expérience Explorer

Explorer constitue l'expérience grand public.

Elle est pensée comme un assistant culturel personnel.

L'utilisateur ne vient pas consulter une base de données.

Il vient organiser son temps libre.

---

## Point d'entrée

Le planning personnel.

L'accueil présente immédiatement :

- les événements du jour ;
- les prochains événements ;
- les créneaux disponibles.

Les recommandations complètent ensuite naturellement cette vue.

---

## Navigation

La navigation est volontairement réduite.

- Pour vous
- Mon planning
- Découvrir
- Mes suivis
- Mes réservations
- Profil

Chaque écran contribue directement à enrichir le planning personnel.

---

## Philosophie

Le produit accompagne l'utilisateur.

Il ne lui demande pas ce qu'il souhaite rechercher.

Il lui propose ce qui lui correspond.

---

# L'expérience Organizer

Organizer est destinée aux organisateurs d'événements.

L'interface privilégie l'efficacité opérationnelle.

L'objectif est de réduire au maximum le temps consacré à la publication.

---

## Point d'entrée

Les événements de l'organisateur.

L'accueil présente notamment :

- les événements publiés ;
- les brouillons ;
- les événements en attente ;
- les statistiques récentes.

---

## Navigation

Exemple :

- Tableau de bord
- Mes événements
- Publier
- Imports
- Statistiques
- Audience
- Compte

Cette organisation favorise les tâches les plus fréquentes.

---

## Philosophie

L'utilisateur organise des événements.

La plateforme doit simplifier toutes les tâches administratives.

---

# L'expérience Operator

Operator constitue l'interface d'exploitation de la plateforme.

Elle est destinée aux équipes assurant le fonctionnement quotidien d'EventFoundry.

---

## Point d'entrée

Le tableau de bord opérationnel.

Il fournit une vision globale de l'état de la plateforme.

---

## Navigation

Exemple :

- Dashboard
- Pipeline
- Validation
- Monitoring
- Référentiels
- Utilisateurs
- Administration

---

## Philosophie

L'objectif est de superviser la plateforme.

Les indicateurs remplacent les contenus.

Les actions critiques sont immédiatement accessibles.

---

# Le changement d'expérience

Un utilisateur peut disposer de plusieurs rôles.

Dans ce cas, il peut changer d'expérience sans changer de compte.

Le changement d'expérience modifie uniquement :

- l'interface ;
- la navigation ;
- les tableaux de bord ;
- les fonctionnalités visibles.

Toutes les données restent communes.

---

# Une plateforme unique

Les différentes expériences ne constituent pas plusieurs produits.

Elles reposent sur :

- une architecture commune ;
- un domaine métier unique ;
- un catalogue partagé ;
- un système d'authentification commun ;
- des services mutualisés.

Cette approche garantit la cohérence de la plateforme tout en proposant une expérience adaptée à chaque utilisateur.

---

# Une évolution indépendante

Chaque expérience peut évoluer indépendamment.

L'ajout d'une fonctionnalité destinée aux organisateurs n'a aucun impact sur l'expérience Explorer.

De la même manière, les évolutions du back-office n'alourdissent jamais l'application grand public.

Cette séparation favorise la maintenabilité du produit.

---

# Les principes de conception

Toutes les expériences doivent respecter les principes suivants.

## Une seule intention

Chaque écran poursuit un objectif principal.

Les fonctionnalités secondaires restent discrètes.

---

## Un vocabulaire adapté

Chaque expérience utilise les termes de son métier.

Explorer parle de sorties.

Organizer parle de publications.

Operator parle de supervision.

---

## Une navigation minimale

Les actions les plus fréquentes doivent être accessibles en un minimum d'interactions.

La navigation reste stable et prévisible.

---

## Une identité commune

Bien que leurs interfaces soient différentes, toutes les expériences partagent :

- les mêmes principes ergonomiques ;
- la même identité graphique ;
- le même langage visuel.

L'utilisateur reconnaît immédiatement EventFoundry.

---

# Les bénéfices

Cette organisation permet :

- une meilleure lisibilité ;
- une expérience plus intuitive ;
- une réduction de la complexité ;
- une meilleure évolutivité ;
- une plateforme unique répondant à plusieurs métiers.

Elle constitue l'un des principaux choix d'architecture fonctionnelle de la V2.

---

# Citation fondatrice

> Une plateforme unique.

> Plusieurs expériences.

> Une seule promesse : proposer la bonne interface au bon utilisateur.

---

# Documents liés

10-STRAT.01-ProductVision-v2.0

10-STRAT.02-Personas-v2.0

02-FSPEC.00-FunctionalSpecifications-v2.0

02-FSPEC.10-ProfilesAndPermissions-v2.0

99-ADR.08-RoleBasedAccessControl

99-ADR.10-MultiExperiencePlatform

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première formalisation des expériences utilisateur de la V2 et de l'architecture multi-expériences d'EventFoundry. |