# Recommendation Engine

**Document** : V2.05

**Fichier** : 12-V2.02-RecommendationEngine-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le fonctionnement du moteur de recommandation d'EventFoundry.

Le moteur constitue le cœur de l'assistant culturel.

Il analyse le contexte de l'utilisateur afin de proposer les événements les plus pertinents au bon moment.

Toutes les recommandations sont déterministes, explicables et entièrement maîtrisées par la plateforme.

---

# Philosophie

Le moteur de recommandation ne cherche pas à remplacer les choix de l'utilisateur.

Son rôle consiste à accompagner la construction de son planning culturel.

Chaque proposition doit répondre à une intention simple :

- compléter le planning ;
- améliorer le planning ;
- favoriser la découverte.

---

# Les sources d'information

Le moteur exploite plusieurs familles de données.

## Le planning

Le planning représente le contexte principal.

Il permet notamment d'identifier :

- les créneaux libres ;
- les événements à venir ;
- les conflits potentiels ;
- le rythme de participation.

---

## Les participations

Les participations permettent d'identifier les habitudes de l'utilisateur.

Exemples :

- concerts ;
- expositions ;
- théâtre ;
- sport.

Ces informations renforcent progressivement la pertinence des recommandations.

---

## Les suivis

Le moteur prend en compte les éléments suivis.

Exemples :

- organisateurs ;
- lieux ;
- activités.

Les nouveautés provenant de ces objets bénéficient d'une priorité plus importante.

---

## Les préférences

Le moteur exploite également les préférences explicites.

Par exemple :

- distance maximale ;
- horaires privilégiés ;
- jours favoris ;
- activités préférées.

---

# Les objectifs

Le moteur poursuit plusieurs objectifs simultanément.

---

## Compléter le planning

Le moteur recherche en priorité les créneaux disponibles.

Il propose ensuite des événements compatibles.

Cette règle constitue la priorité principale.

---

## Améliorer le planning

Lorsqu'un événement plus pertinent est identifié, le moteur peut proposer une alternative.

Cette suggestion ne remplace jamais automatiquement un événement existant.

L'utilisateur conserve toujours la décision finale.

---

## Favoriser la découverte

Le moteur cherche régulièrement à élargir les habitudes culturelles.

Ces propositions restent compatibles avec le contexte de l'utilisateur.

---

# Les critères de recommandation

Chaque recommandation résulte d'une combinaison de règles métier.

Les principaux critères sont notamment :

- organisateur suivi ;
- activité suivie ;
- lieu suivi ;
- proximité géographique ;
- créneau disponible ;
- habitudes de participation ;
- popularité ;
- récence de publication.

Ces critères pourront évoluer sans modifier l'architecture générale.

---

# Les niveaux de priorité

Les recommandations sont classées selon plusieurs niveaux.

## Priorité forte

Événement correspondant directement aux centres d'intérêt.

Exemples :

- organisateur suivi ;
- activité favorite ;
- créneau libre.

---

## Priorité moyenne

Événement proche des habitudes de l'utilisateur.

Exemples :

- activité similaire ;
- lieu fréquenté ;
- horaire habituel.

---

## Priorité faible

Découverte.

Le moteur élargit progressivement les propositions.

---

# Le mode « Surprends-moi »

Le mode **Surprends-moi** permet d'élargir volontairement les recommandations.

Lorsque ce mode est activé, le moteur diminue progressivement le poids des habitudes.

Il favorise davantage :

- les nouvelles activités ;
- les nouveaux organisateurs ;
- les nouveaux lieux.

Cette fonctionnalité encourage la curiosité sans supprimer totalement la personnalisation.

---

# Les explications

Chaque recommandation doit pouvoir être expliquée.

Exemples :

- Vous suivez cet organisateur.
- Cet événement complète votre samedi après-midi.
- Cette activité ressemble à celles auxquelles vous participez régulièrement.
- Ce lieu se situe à proximité d'un événement déjà prévu.

L'utilisateur comprend toujours pourquoi une proposition lui est faite.

---

# Les refus

Le moteur apprend également des décisions de l'utilisateur.

Exemples :

- recommandation ignorée ;
- recommandation refusée ;
- événement supprimé du planning.

Ces informations permettent d'ajuster les propositions futures.

Le moteur ne déduit jamais d'informations qui n'ont pas été explicitement observées.

---

# Les limites

Le moteur ne prend jamais de décision à la place de l'utilisateur.

Il ne modifie pas automatiquement le planning.

Il ne crée jamais de réservation.

Il ne réalise aucun paiement.

Son rôle est uniquement de proposer.

---

# Les principes fondateurs

Le moteur repose sur plusieurs principes.

## Déterministe

Une même situation produit les mêmes recommandations.

---

## Explicable

Chaque proposition possède une justification compréhensible.

---

## Progressif

Les recommandations évoluent avec les habitudes de l'utilisateur.

---

## Respectueux

Le moteur ne cherche jamais à maximiser le temps passé dans l'application.

Son objectif est d'aider l'utilisateur à organiser sa vie culturelle.

---

# Évolutions futures

Le moteur pourra intégrer de nouvelles règles.

Exemples :

- météo ;
- vacances scolaires ;
- déplacements ;
- calendrier personnel ;
- préférences temporelles avancées.

Ces évolutions devront toujours respecter les principes définis dans ce document.

---

# Documents liés

11-V2.01-ProductVision-v2.0

12-V2.01-FunctionalSpecifications-v2.0

12-V2.05-Planning-v2.0

12-V2.06-Discovery-v2.0

ADR.09-RecommendationEngine

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification du moteur de recommandation de l'assistant culturel. |