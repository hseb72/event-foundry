# Backlog V3

**Document** : BACKLOG.V3

**Fichier** : 98-Backlog-v3.md

**Version** : 3.0

**Statut** : Évolutions futures

---

# Objectif

Ce document recense les évolutions volontairement exclues de la V2.

Ces fonctionnalités ne constituent pas des anomalies ni des oublis.

Leur implémentation a été reportée afin de préserver la simplicité, la cohérence et la maîtrise de l'architecture de la V2.

---

# Principes

Une fonctionnalité est inscrite dans ce backlog lorsqu'elle répond aux critères suivants :

- apporte une valeur identifiée ;
- nécessite une évolution importante de l'architecture ;
- ou augmente significativement la complexité du produit.

Les éléments de ce document ne constituent pas un engagement de réalisation.

Ils représentent des pistes d'évolution.

---

# Assistant culturel

## Concept "Opportunity"

**Description**

Créer un objet métier représentant une opportunité proposée par l'assistant.

Une opportunité pourrait regrouper :

- une recommandation ;
- une suggestion ;
- un rappel ;
- une alerte ;
- une alternative ;
- une action proposée.

**Pourquoi reporté**

La V2 repose volontairement sur des concepts métier simples.

L'introduction d'un nouvel objet transversal augmenterait fortement la complexité du modèle.

---

## Priorisation dynamique

Adapter automatiquement les recommandations selon le contexte utilisateur.

Exemples :

- heure de la journée ;
- météo ;
- activité récente ;
- fatigue supposée.

**Pourquoi reporté**

Nécessite un moteur décisionnel plus évolué.

---

# Planning

## Temps de trajet

Évaluer automatiquement le temps nécessaire pour rejoindre un événement depuis :

- le domicile ;
- le lieu de travail ;
- un événement précédent.

Permettre la détection de conflits liés aux déplacements.

**Pourquoi reporté**

Nécessite un fournisseur cartographique, un calcul d'itinéraires et la gestion de données personnelles.

---

## Contexte géographique

Prendre en compte :

- domicile ;
- bureau ;
- lieux favoris ;
- zones géographiques habituelles.

Les recommandations deviennent sensibles au contexte de déplacement.

**Pourquoi reporté**

Complexité fonctionnelle et implications RGPD.

---

## Calendriers externes

Synchronisation avec :

- Google Calendar ;
- Microsoft Outlook ;
- Apple Calendar.

Le planning EventFoundry pourrait tenir compte des indisponibilités de l'utilisateur.

**Pourquoi reporté**

Dépendance à des services tiers.

---

# Découverte

## Parcours culturels

Créer des propositions regroupant plusieurs événements autour d'un thème.

Exemples :

- semaine du jazz ;
- festival d'Avignon ;
- patrimoine industriel.

**Pourquoi reporté**

Nécessite un nouveau modèle de données.

---

## Collections

Permettre de créer ou partager des collections d'événements.

Exemples :

- Mes festivals préférés ;
- À voir cet été ;
- En famille.

**Pourquoi reporté**

Impact important sur l'interface Explorer.

---

# Recommandations

## Recommandations collaboratives

Suggérer des événements selon les comportements d'utilisateurs présentant des profils similaires.

**Pourquoi reporté**

Nécessite des traitements statistiques avancés.

---

## Machine Learning

Compléter le moteur déterministe par des modèles d'apprentissage.

Le moteur resterait explicable.

**Pourquoi reporté**

Volume de données insuffisant en V2.

---

# Notifications

## Priorisation intelligente

Adapter automatiquement la fréquence des notifications.

Prendre en compte :

- habitudes utilisateur ;
- contexte ;
- disponibilité.

---

## Mode silencieux intelligent

Reporter automatiquement certaines notifications lorsque leur consultation paraît peu probable.

---

## Notifications géolocalisées

Notifier lorsqu'un événement intéressant est détecté à proximité.

**Pourquoi reporté**

Dépendance à la géolocalisation en temps réel.

---

# Organizer

## Publication assistée

Aider l'organisateur à améliorer automatiquement la qualité de ses publications.

Exemples :

- description incomplète ;
- image absente ;
- horaires incohérents.

---

## Suggestions d'amélioration

Recommandations basées sur les performances passées.

---

# Explorer

## Objectifs personnels

Permettre de définir des objectifs.

Exemples :

- assister à 20 concerts cette année ;
- découvrir 10 nouveaux lieux ;
- visiter tous les musées de la ville.

---

## Statistiques personnelles

Visualiser son activité culturelle.

Exemples :

- activités favorites ;
- répartition par catégorie ;
- villes visitées.

---

# Social

## Invitations

Inviter des proches à participer à un événement.

---

## Groupes

Créer un groupe culturel.

---

## Activité des proches

Partager volontairement certaines participations.

**Pourquoi reporté**

Le positionnement de la V2 privilégie l'assistant personnel plutôt qu'un réseau social.

---

# Plateforme

## API publique

Permettre à des applications tierces d'accéder à certaines fonctionnalités.

---

## Widgets

Développer des widgets :

- agenda ;
- recommandations ;
- prochains événements.

---

## Application mobile native

Développer une application mobile dédiée.

---

# Décisions maintenues

Les principes suivants restent inchangés.

- Le moteur de recommandation demeure déterministe.
- Les recommandations restent explicables.
- Le planning reste le cœur du produit.
- Le catalogue demeure une ressource.
- Les expériences utilisateur restent séparées.

Toute évolution future devra respecter ces principes.

---

# Documents liés

10-STRAT.01-ProductVision-v2.0

02-FSPEC.08-Planning-v2.0

02-FSPEC.09-RecommendationEngine-v2.0

99-ADR.09-DeterministicRecommendationEngine-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première formalisation des évolutions volontairement reportées après la définition de la V2. |