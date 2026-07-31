# Design Principles

**Document** : UISPEC.00

**Fichier** : 04-UISPEC.00-DesignPrinciples-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir les principes de conception de l'interface utilisateur de la plateforme EventFoundry.

Ce document constitue la référence commune pour l'ensemble des expériences utilisateur.

Il garantit la cohérence de l'interface, indépendamment des technologies utilisées pour son implémentation.

---

# Principes généraux

L'interface utilisateur est conçue autour des principes suivants :

- simplicité ;
- cohérence ;
- lisibilité ;
- efficacité ;
- accessibilité ;
- réactivité.

Chaque écran doit permettre à l'utilisateur d'accomplir une tâche avec un minimum d'effort cognitif.

---

# Philosophie de conception

EventFoundry est un assistant culturel.

L'interface ne cherche pas à exposer la complexité du système mais à accompagner naturellement l'utilisateur dans ses objectifs.

Les principes fondamentaux sont :

- guider plutôt que contraindre ;
- suggérer plutôt qu'imposer ;
- expliquer plutôt que masquer ;
- limiter les distractions ;
- favoriser la découverte.

---

# Architecture des expériences

L'application est organisée autour de trois expériences.

```text
Explorer

Organizer

Operator
```

Chaque expérience possède :

- sa navigation ;
- ses écrans ;
- ses fonctionnalités ;
- son vocabulaire.

Le changement d'expérience ne modifie ni l'identité de l'utilisateur ni ses permissions.

---

# Organisation des écrans

Chaque écran possède une responsabilité unique.

Un écran ne doit pas mélanger plusieurs objectifs métier.

Exemples :

- rechercher ;
- consulter ;
- planifier ;
- publier ;
- administrer.

---

# Navigation

La navigation doit être :

- simple ;
- prévisible ;
- cohérente.

Chaque utilisateur doit toujours connaître :

- où il se trouve ;
- comment revenir ;
- quelles actions sont disponibles.

La navigation principale reste stable au sein d'une même expérience.

---

# Hiérarchie visuelle

Chaque écran respecte une hiérarchie claire.

Ordre de lecture :

1. Titre
2. Contexte
3. Action principale
4. Contenu
5. Actions secondaires

Une seule action principale doit être mise en avant.

---

# Terminologie

Le vocabulaire utilisé dans l'interface est issu du Glossaire.

Les mêmes concepts utilisent toujours le même terme.

Exemples :

- Événement
- Planning
- Recommandation
- Publication
- Organisateur

Les synonymes sont évités.

---

# Composants

Les composants sont réutilisables.

Exemples :

- bouton ;
- formulaire ;
- carte événement ;
- liste ;
- calendrier ;
- carte géographique ;
- recherche ;
- filtres ;
- notification.

Chaque composant possède un comportement uniforme dans toute l'application.

---

# États des écrans

Chaque écran doit prévoir les états suivants.

## Chargement

Les informations sont en cours de récupération.

L'utilisateur reçoit un retour visuel immédiat.

---

## Vide

Aucune donnée n'est disponible.

L'écran explique la situation et propose une action.

---

## Succès

L'action demandée a été exécutée.

La confirmation est explicite mais discrète.

---

## Erreur

Les erreurs sont compréhensibles.

Le message indique :

- ce qui s'est produit ;
- les conséquences ;
- les actions possibles.

Les messages techniques sont interdits.

---

# Feedback utilisateur

Chaque action utilisateur reçoit un retour.

Exemples :

- validation ;
- suppression ;
- enregistrement ;
- publication ;
- erreur.

Le délai de réponse perçu doit être minimal.

---

# Formulaires

Les formulaires respectent les principes suivants.

- validation immédiate lorsque pertinent ;
- indication des champs obligatoires ;
- messages d'erreur localisés ;
- conservation des données saisies en cas d'erreur.

---

# Recherche

Toutes les fonctionnalités de recherche présentent une expérience cohérente.

Les principes sont :

- recherche rapide ;
- filtres visibles ;
- résultats immédiatement exploitables ;
- possibilité d'affiner progressivement.

---

# Listes

Les listes proposent, lorsque pertinent :

- tri ;
- filtres ;
- pagination ;
- recherche ;
- sélection.

Les comportements restent identiques dans toute l'application.

---

# Fiches de détail

Les fiches présentent toujours :

- les informations essentielles ;
- les actions principales ;
- les informations complémentaires.

La lecture doit rester fluide.

---

# Notifications

Les notifications sont :

- courtes ;
- explicites ;
- contextualisées.

Elles ne remplacent jamais une information importante affichée dans un écran.

---

# Accessibilité

L'interface respecte les principes d'accessibilité.

Elle garantit notamment :

- navigation clavier ;
- contrastes suffisants ;
- textes alternatifs ;
- structure sémantique ;
- compatibilité avec les lecteurs d'écran.

L'objectif est de satisfaire au minimum le niveau WCAG 2.1 AA.

---

# Responsive Design

L'application est utilisable sur :

- ordinateur ;
- tablette ;
- smartphone.

Les fonctionnalités restent identiques.

Seule leur présentation peut évoluer.

---

# Performance perçue

L'utilisateur doit percevoir une interface réactive.

Les principes retenus sont :

- chargement progressif ;
- pagination ;
- lazy loading lorsque pertinent ;
- limitation des attentes visibles.

---

# Cohérence entre expériences

Explorer, Organizer et Operator partagent :

- les mêmes composants ;
- les mêmes conventions graphiques ;
- les mêmes interactions de base.

Chaque expérience conserve néanmoins une identité fonctionnelle propre.

---

# Sécurité visible

Les permissions influencent l'interface.

Une action non autorisée :

- n'est pas proposée ;
- ou apparaît désactivée avec une explication.

Les erreurs d'autorisation ne doivent jamais surprendre l'utilisateur.

---

# Traçabilité

Les actions importantes donnent lieu à une confirmation.

Exemples :

- publication ;
- archivage ;
- suppression ;
- changement d'expérience.

Lorsque pertinent, un historique est consultable.

---

# Contraintes

Les interfaces respectent les principes suivants.

- une responsabilité principale par écran ;
- une action principale par écran ;
- composants réutilisables ;
- vocabulaire unique ;
- navigation cohérente ;
- accessibilité intégrée dès la conception.

Toute dérogation doit être justifiée.

---

# Documents liés

00-Glossaire-v2.0

00-STRAT.02-UserExperiences-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

04-UISPEC.01-ExplorerExperience-v2.0

04-UISPEC.02-OrganizerExperience-v2.0

04-UISPEC.03-OperatorExperience-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification des principes de conception de l'interface utilisateur. |