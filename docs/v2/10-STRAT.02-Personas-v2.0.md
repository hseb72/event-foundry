# Personas

**Document** : V2.02

**Fichier** : 10-STRAT.02-Personas-v2.0.md

**Version** : 2.0

**Statut** : Vision

---

# Objectif

Définir les différents profils d'utilisateurs de la plateforme EventFoundry.

Chaque persona possède ses propres objectifs, son vocabulaire, son interface et ses fonctionnalités.

Cette séparation permet de construire une plateforme unique proposant plusieurs expériences utilisateur cohérentes.

---

# Principes

EventFoundry repose sur une plateforme unique.

Tous les utilisateurs partagent les mêmes données.

En revanche, chaque utilisateur accède à une expérience adaptée à son rôle.

Les interfaces ne sont pas des variantes d'une même application.

Elles sont conçues autour des besoins réels de chaque persona.

---

# Les personas

La plateforme distingue trois grandes familles d'utilisateurs.

- Explorer
- Organizer
- Operator

Ces personas constituent les principales expériences proposées par la plateforme.

---

# Explorer

L'Explorer souhaite organiser sa vie culturelle.

Il utilise EventFoundry comme un assistant personnel.

Son objectif n'est pas de rechercher des événements.

Son objectif est d'organiser son temps libre.

---

## Ses priorités

- connaître son planning ;
- compléter les créneaux disponibles ;
- découvrir de nouveaux événements ;
- retrouver ses réservations ;
- suivre ses organisateurs préférés.

---

## Son point d'entrée

Le planning.

Chaque ouverture de l'application répond immédiatement aux questions :

> Que fais-je aujourd'hui ?

> Que fais-je cette semaine ?

Les recommandations viennent ensuite enrichir ce planning.

---

## Ses principales fonctionnalités

- planning personnel ;
- recommandations ;
- suggestions ;
- découverte ;
- réservations ;
- suivis ;
- historique.

---

## Son vocabulaire

Le produit utilise un vocabulaire simple.

Exemples :

- Mon planning
- Pour vous
- Découvrir
- Mes réservations
- Mes suivis

---

# Organizer

L'Organizer souhaite faire connaître ses événements.

Il utilise EventFoundry comme une plateforme de publication.

---

## Ses priorités

- créer rapidement un événement ;
- importer une affiche ;
- suivre ses publications ;
- analyser ses performances ;
- développer son audience.

---

## Son point d'entrée

Ses événements.

Il souhaite immédiatement connaître :

- les événements publiés ;
- ceux en attente ;
- les brouillons ;
- les statistiques.

---

## Ses principales fonctionnalités

- import documentaire ;
- création ;
- publication ;
- statistiques ;
- abonnés ;
- analytics.

---

## Son vocabulaire

Exemples :

- Mes événements
- Publier
- Statistiques
- Audience
- Imports

---

# Operator

L'Operator garantit le bon fonctionnement de la plateforme.

Son rôle est transversal.

Il dispose d'une interface orientée supervision.

---

## Ses priorités

- qualité des données ;
- pipeline OCR ;
- validation ;
- supervision ;
- utilisateurs ;
- exploitation.

---

## Son point d'entrée

Le tableau de bord.

Il fournit une vue globale sur l'état de la plateforme.

---

## Ses principales fonctionnalités

- modération ;
- validation ;
- monitoring ;
- administration ;
- référentiels ;
- supervision.

---

# Les spécialisations

L'expérience Operator pourra être déclinée selon plusieurs responsabilités.

---

## Platform Operator

Garant du fonctionnement technique.

Responsable :

- pipeline ;
- supervision ;
- qualité ;
- modération.

---

## Customer Success

Accompagne les organisateurs.

Responsable :

- onboarding ;
- accompagnement ;
- fidélisation ;
- support métier.

---

## Finance

Responsable des aspects commerciaux.

Exemples :

- abonnements ;
- facturation ;
- paiements ;
- relances ;
- contentieux.

---

# Une même personne, plusieurs rôles

Un utilisateur peut cumuler plusieurs rôles.

Exemple :

Marie est Organizer.

Elle utilise également EventFoundry pour ses loisirs.

Elle possède donc également le rôle Explorer.

La plateforme adapte automatiquement son interface selon l'expérience choisie.

---

# Le changement d'expérience

Lorsqu'un utilisateur possède plusieurs rôles, il peut basculer facilement entre ses expériences.

Exemple :

Explorer

↓

Organizer

↓

Operator

Chaque expérience conserve :

- ses menus ;
- son tableau de bord ;
- ses raccourcis ;
- son vocabulaire.

Le changement d'expérience ne modifie jamais les données.

Il modifie uniquement la manière de les présenter.

---

# Une plateforme, plusieurs applications

Du point de vue de l'utilisateur, EventFoundry se comporte comme trois applications spécialisées.

Toutes reposent pourtant sur :

- la même plateforme ;
- les mêmes données ;
- les mêmes services ;
- le même moteur métier.

Cette approche garantit une expérience adaptée sans multiplier les applications.

---

# Principes de conception

Chaque expérience doit :

- répondre à un objectif clair ;
- limiter les fonctionnalités au strict nécessaire ;
- utiliser un vocabulaire adapté ;
- privilégier les actions fréquentes.

Une fonctionnalité destinée à un persona ne doit pas perturber les autres expériences.

---

# Documents liés

10-STRAT.01-ProductVision-v2.0

10-STRAT.03-UserExperiences-v2.0

02-FSPEC.00-FunctionalSpecifications-v2.0

99-ADR.08-RoleBasedAccessControl

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première définition des personas de la V2 et de leurs expériences respectives. |