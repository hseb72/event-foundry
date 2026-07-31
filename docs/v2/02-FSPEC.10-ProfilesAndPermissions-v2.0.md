# Profiles and Permissions

**Document** : V2.04

**Fichier** : 02-FSPEC.10-ProfilesAndPermissions-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le modèle de gestion des rôles et des permissions d'EventFoundry.

Le système repose sur un modèle RBAC (Role-Based Access Control) permettant d'associer plusieurs rôles à un même utilisateur.

Les rôles déterminent les expériences accessibles.

Les permissions déterminent les actions autorisées.

---

# Principes

Les rôles ne représentent pas des utilisateurs.

Ils représentent des responsabilités.

Un même utilisateur peut exercer plusieurs responsabilités au sein de la plateforme.

Le système doit permettre cette flexibilité sans dupliquer les comptes.

---

# Les rôles

La plateforme distingue plusieurs rôles principaux.

- Explorer
- Organizer
- Platform Operator
- Customer Success
- Finance

D'autres rôles pourront être ajoutés sans modifier l'architecture générale.

---

# Explorer

Le rôle Explorer permet d'accéder à l'expérience grand public.

Il autorise notamment :

- consulter le catalogue ;
- gérer son planning ;
- suivre des activités ;
- effectuer des réservations ;
- recevoir des recommandations.

---

# Organizer

Le rôle Organizer permet de publier des événements.

Il autorise notamment :

- créer des événements ;
- importer des documents ;
- modifier ses publications ;
- consulter ses statistiques ;
- gérer son organisation.

---

# Platform Operator

Le Platform Operator supervise le fonctionnement technique de la plateforme.

Il intervient sur :

- le pipeline documentaire ;
- les imports ;
- les validations ;
- les référentiels ;
- les traitements automatiques.

---

# Customer Success

Le Customer Success accompagne les organisateurs.

Il peut notamment :

- consulter les comptes organisateurs ;
- accompagner les publications ;
- intervenir sur certaines demandes d'assistance.

Il ne dispose pas des permissions techniques réservées aux opérateurs.

---

# Finance

Le rôle Finance intervient sur les aspects commerciaux.

Il peut accéder notamment :

- aux abonnements ;
- à la facturation ;
- aux paiements ;
- aux remboursements.

Il n'intervient jamais sur les traitements techniques.

---

# Les permissions

Chaque rôle regroupe un ensemble de permissions.

Une permission représente une action métier.

Exemples :

- event.read
- event.create
- event.publish
- import.create
- validation.review
- dashboard.view
- billing.manage
- user.manage

Les permissions constituent le niveau de contrôle utilisé par le backend.

---

# Le cumul des rôles

Un utilisateur peut posséder plusieurs rôles.

Exemple :

Explorer

+

Organizer

Le système lui permet de changer d'expérience sans changer de compte.

Les permissions sont alors cumulées.

---

# Le changement d'expérience

Le changement d'expérience ne modifie jamais les permissions.

Il modifie uniquement :

- la navigation ;
- les écrans disponibles ;
- le tableau de bord ;
- les raccourcis.

L'expérience sélectionnée correspond simplement au contexte de travail actuel.

---

# Les organisations

Un utilisateur peut appartenir à plusieurs organisations.

Par exemple :

- une association ;
- une mairie ;
- une entreprise événementielle.

Les permissions sont évaluées dans le contexte de l'organisation sélectionnée.

---

# Les abonnements

Certaines fonctionnalités peuvent dépendre de l'offre souscrite.

Les abonnements ne remplacent pas les permissions.

Ils viennent compléter le contrôle d'accès.

Exemple :

Une permission peut autoriser l'accès aux statistiques.

L'abonnement détermine le niveau de statistiques disponible.

---

# Les principes

Le système respecte plusieurs règles.

## Une responsabilité par rôle

Chaque rôle possède un objectif clair.

---

## Des permissions atomiques

Une permission représente une seule capacité métier.

---

## Une architecture évolutive

L'ajout d'un nouveau rôle ne doit pas remettre en cause les rôles existants.

---

## Une séparation des responsabilités

Les responsabilités métier restent indépendantes des offres commerciales.

---

# Notre différence

Les rôles structurent les expériences utilisateur.

Les permissions sécurisent les fonctionnalités.

Les abonnements déterminent les services accessibles.

Ces trois notions sont volontairement indépendantes afin de permettre une évolution simple de la plateforme.

---

# Documents liés

10-STRAT.02-Personas-v2.0

10-STRAT.03-UserExperiences-v2.0

02-FSPEC.00-FunctionalSpecifications-v2.0

99-ADR.08-RoleBasedAccessControl

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification du modèle RBAC et de la gestion des rôles, permissions et expériences utilisateur. |