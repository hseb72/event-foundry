# Product Vision

**Document** : STRAT.01

**Fichier** : 10-STRAT.01-ProductVision-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Vision

EventFoundry est une plateforme permettant de découvrir, organiser et suivre des événements.

Sa vocation est de centraliser des événements provenant de multiples sources, de les qualifier, puis d'aider chaque utilisateur à identifier ceux qui présentent un intérêt réel selon son propre contexte.

Le produit ne cherche pas à remplacer les plateformes de diffusion existantes.

Il agit comme un moteur d'agrégation, de qualification, de recommandation et de planification.

---

# Mission

Permettre à chacun de découvrir les événements qui lui correspondent sans avoir à consulter une multitude de sites, de réseaux sociaux ou de calendriers.

EventFoundry rassemble les informations, les structure, les qualifie puis accompagne l'utilisateur tout au long du cycle de vie d'un événement.

---

# Les trois expériences

La plateforme reste organisée autour de trois expériences complémentaires.

## Explorer

Découvrir.

Suivre son planning.

Recevoir des recommandations.

Construire sa vie culturelle ou associative.

---

## Organizer

Publier.

Importer.

Administrer ses événements.

Suivre leur diffusion.

---

## Operator

Administrer la plateforme.

Configurer les services.

Superviser les imports.

Garantir la qualité des données.

---

# Les piliers de la V3

La V2 a permis de construire le produit.

La V3 vise à construire la plateforme.

Les principaux objectifs sont :

- industrialiser les imports ;
- rendre la plateforme extensible ;
- renforcer les capacités d'administration ;
- améliorer l'observabilité ;
- simplifier les futures intégrations.

---

# Les principes fondateurs

Les principes validés pendant la V2 restent inchangés.

## Le planning est le cœur du produit

Le catalogue est une ressource.

Le planning est le produit.

Toutes les fonctionnalités doivent contribuer à aider l'utilisateur à construire et gérer son planning.

---

## Les recommandations restent déterministes

Les recommandations doivent rester explicables.

Chaque suggestion doit pouvoir être justifiée.

---

## L'intelligence artificielle n'effectue aucune décision métier

L'IA peut assister :

- l'extraction d'informations ;
- l'OCR ;
- la génération de texte ;
- l'aide à la rédaction.

Elle ne décide jamais :

- qu'un événement est pertinent ;
- qu'un utilisateur doit recevoir une recommandation ;
- qu'un événement appartient à une catégorie.

Ces décisions restent déterministes.

Toute évolution de ce principe nécessite un ADR.

---

## Les expériences restent séparées

Explorer.

Organizer.

Operator.

Chaque expérience possède ses propres objectifs, ses propres interfaces et son propre langage.

---

## Les connecteurs sont indépendants

Chaque source de données est intégrée au travers d'un connecteur indépendant.

Un connecteur ne possède aucune logique métier.

Il extrait uniquement les données disponibles.

La normalisation est réalisée par la plateforme.

---

## Les données brutes sont conservées

Les informations extraites d'une source peuvent évoluer.

La plateforme conserve les données brutes afin de permettre :

- l'amélioration des mappings ;
- la réanalyse ;
- le rejeu d'un import.

---

# Les objectifs de la V3

La V3 poursuit six objectifs majeurs.

## Industrialiser les imports

Créer un framework de connecteurs.

Standardiser les pipelines.

Faciliter l'ajout de nouveaux fournisseurs.

---

## Renforcer la qualité des données

Améliorer les outils de validation.

Multiplier les sources.

Enrichir automatiquement les événements.

---

## Développer l'administration

Notifications.

Configuration.

Monitoring.

Observabilité.

Paramétrage.

---

## Personnaliser l'expérience utilisateur

Préférences.

Suivis.

Notifications.

Identité.

Organisation.

---

## Préparer les évolutions futures

La V3 doit permettre d'accueillir naturellement :

- de nouveaux connecteurs ;
- de nouveaux moteurs de recommandation ;
- de nouveaux canaux de notification ;
- de nouvelles interfaces.

---

## Préserver la simplicité

L'augmentation des capacités techniques ne doit jamais complexifier l'expérience utilisateur.

La simplicité reste un objectif permanent.

---

# Hors périmètre

La V3 ne modifie pas les principes fondamentaux de la plateforme.

Les fonctionnalités reportées restent documentées dans le Backlog.

---

# Documents liés

01-ARCHI.*

02-FSPEC.*

03-TSPEC.*

04-UISPEC.*

98-Backlog.*

99-ADR.*

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première vision stratégique de la V3. |