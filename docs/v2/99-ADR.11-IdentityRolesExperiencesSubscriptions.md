# ADR.11 – Identity, Roles, Experiences and Subscriptions

**Document** : ADR.11

**Fichier** : 99-ADR.11-IdentityRolesExperiencesSubscriptions.md

**Version** : 2.0

**Statut** : Accepted

---

# Contexte

La V2 d'EventFoundry introduit plusieurs expériences utilisateur au sein d'une plateforme unique.

Un même utilisateur peut :

- utiliser l'application comme Explorer ;
- publier des événements comme Organizer ;
- administrer la plateforme comme Operator.

Les premières réflexions ont montré qu'il était nécessaire de distinguer plusieurs notions qui sont souvent mélangées dans les applications traditionnelles.

---

# Décision

Le modèle d'identité de la plateforme repose sur quatre concepts indépendants.

- Identity
- Role
- Experience
- Subscription

Chaque concept possède une responsabilité unique.

---

# Identity

L'identité représente une personne authentifiée.

Elle répond à la question :

> Qui est connecté ?

Une identité possède notamment :

- un compte ;
- des informations personnelles ;
- une authentification ;
- des préférences.

L'identité ne définit jamais les permissions.

---

# Role

Un rôle représente une responsabilité métier.

Exemples :

- Explorer
- Organizer
- Platform Operator
- Customer Success
- Finance

Un utilisateur peut posséder plusieurs rôles.

Les rôles déterminent les permissions disponibles.

---

# Experience

Une expérience représente une interface utilisateur adaptée à un contexte.

Exemples :

- Explorer Experience
- Organizer Experience
- Operator Experience

Une expérience définit notamment :

- la navigation ;
- les tableaux de bord ;
- les écrans ;
- le vocabulaire ;
- les raccourcis.

Une expérience ne modifie jamais les permissions.

Elle modifie uniquement la manière de présenter les fonctionnalités.

---

# Subscription

La souscription représente l'offre commerciale.

Exemples :

- Free
- Pro
- Premium

La souscription ne définit jamais les permissions.

Elle détermine les fonctionnalités disponibles parmi celles autorisées.

Exemple :

Un Organizer possède la permission de consulter ses statistiques.

Son abonnement détermine :

- le niveau de détail ;
- l'historique disponible ;
- les fonctionnalités avancées.

---

# Relations

Le modèle obtenu est le suivant.

Identity

↓

Roles

↓

Permissions

↓

Experiences

↓

Subscriptions

Chaque niveau possède une responsabilité indépendante.

---

# Conséquences

Cette architecture présente plusieurs avantages.

## Séparation des responsabilités

Chaque notion possède un objectif unique.

Les responsabilités ne sont plus mélangées.

---

## Évolutivité

Il devient possible :

- d'ajouter un rôle ;
- d'ajouter une expérience ;
- d'ajouter une offre commerciale ;

sans remettre en cause les autres composants.

---

## Simplicité

Les développeurs savent immédiatement où intervenir.

Une évolution commerciale n'impacte pas le système RBAC.

Une évolution ergonomique n'impacte pas les permissions.

---

## Réutilisabilité

Les mêmes rôles peuvent être utilisés :

- par l'application web ;
- par une future application mobile ;
- par l'API publique ;
- par les widgets.

---

# Alternatives étudiées

## Fusionner rôles et expériences

Rejeté.

Une expérience représente une interface.

Un rôle représente une responsabilité.

Ces deux notions évoluent indépendamment.

---

## Fusionner rôles et abonnements

Rejeté.

Les abonnements représentent une offre commerciale.

Les rôles représentent des responsabilités métier.

Leur cycle de vie est différent.

---

## Une expérience unique

Rejeté.

Les besoins d'un Explorer, d'un Organizer et d'un Operator sont trop différents.

Une interface unique deviendrait rapidement complexe.

---

# Décision finale

EventFoundry adopte une architecture reposant sur quatre concepts indépendants :

- Identity
- Role
- Experience
- Subscription

Cette séparation constitue un principe fondateur de la V2.

Toute évolution future devra respecter cette architecture.

---

# Documents liés

ADR.08-UserRolesAndRBAC

11-V2.02-Personas-v2.0

11-V2.03-UserExperiences-v2.0

12-V2.04-ProfilesAndPermissions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Formalisation du modèle Identity / Role / Experience / Subscription introduit par la V2. |