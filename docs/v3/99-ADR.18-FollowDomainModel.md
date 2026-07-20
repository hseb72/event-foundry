# ADR.18 – Follow Domain Model

**Document** : ADR.18

**Fichier** : 99-ADR.18-FollowDomainModel.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

L'une des principales ambitions d'EventFoundry est de faciliter la découverte d'activités pertinentes pour chaque utilisateur.

Cette découverte ne repose pas uniquement sur une recherche ponctuelle.

Elle s'appuie également sur les centres d'intérêt exprimés par les utilisateurs.

La plateforme doit donc disposer d'un mécanisme permettant d'exprimer durablement ces intérêts.

---

# Problème

Les utilisateurs peuvent souhaiter suivre différents types d'objets.

Par exemple :

- une organisation ;
- un organisateur ;
- un lieu ;
- une activité ;
- une catégorie ;
- une série d'événements.

Ces suivis sont utilisés par plusieurs fonctionnalités.

Les représenter comme de simples préférences rendrait leur évolution difficile et entraînerait une forte duplication des traitements.

---

# Décision

Le **Follow** devient une entité métier indépendante.

Il représente la relation durable entre un utilisateur et un objet suivi.

Cette relation possède son propre cycle de vie.

Elle ne constitue pas une simple préférence utilisateur.

---

# Objectifs

Le modèle Follow poursuit plusieurs objectifs.

## Personnaliser l'expérience

Le suivi permet d'adapter automatiquement les contenus proposés à chaque utilisateur.

---

## Alimenter les recommandations

Les recommandations utilisent les objets suivis comme l'un des principaux signaux de pertinence.

---

## Déclencher les notifications

Les nouveaux événements liés à un objet suivi peuvent générer des notifications selon les préférences de l'utilisateur.

---

## Produire des statistiques

Les suivis permettent d'analyser les centres d'intérêt de la communauté.

Ces statistiques restent anonymisées lorsqu'elles sont utilisées à des fins analytiques.

---

# Objets suivables

Le modèle doit permettre de suivre plusieurs types d'objets.

Par exemple :

- Organization ;
- Organizer ;
- Venue ;
- Activity ;
- Category ;
- Event Series.

Cette liste est extensible.

L'ajout d'un nouveau type d'objet ne remet pas en cause le modèle.

---

# Relation

Un utilisateur peut suivre plusieurs objets.

Un même objet peut être suivi par plusieurs utilisateurs.

La relation est donc de type **Many-to-Many**.

Le Follow constitue l'entité reliant ces deux ensembles.

---

# Cycle de vie

Un Follow peut être :

- créé ;
- suspendu ;
- réactivé ;
- supprimé.

Chaque changement est historisé.

---

# Métadonnées

Le Follow peut contenir des informations complémentaires.

Par exemple :

- date de création ;
- origine du suivi ;
- niveau de priorité ;
- notifications activées ;
- commentaires internes.

Ces informations enrichissent la relation sans modifier l'objet suivi.

---

# Utilisation

Le Follow peut être exploité par plusieurs composants.

## Recommandations

Proposer des événements similaires.

---

## Notifications

Informer des nouveautés concernant les objets suivis.

---

## Recherche

Mettre en avant les contenus correspondant aux centres d'intérêt.

---

## Tableau de bord

Afficher les organisations, lieux ou activités suivis.

---

## Analytique

Mesurer les tendances et les intérêts de la communauté.

---

# Découplage

Les objets suivis ne connaissent jamais leurs abonnés.

Ils restent totalement indépendants.

Le modèle Follow constitue l'unique point de liaison.

Cette architecture limite le couplage entre les domaines métier.

---

# Évolutivité

Le modèle doit permettre d'introduire ultérieurement :

- plusieurs niveaux de suivi ;
- favoris ;
- abonnements temporaires ;
- recommandations collaboratives ;
- communautés d'intérêt.

Ces évolutions ne nécessitent aucune modification des objets suivis.

---

# Conséquences

Cette décision implique que :

- les suivis deviennent un objet métier à part entière ;
- les recommandations et notifications s'appuient sur un modèle commun ;
- les objets métier restent indépendants des utilisateurs ;
- les futures fonctionnalités sociales pourront réutiliser cette infrastructure.

Le Follow devient la représentation officielle des intérêts exprimés par les utilisateurs.

---

# Alternatives étudiées

## Préférences utilisateur

Stocker les suivis dans un ensemble de préférences.

Cette approche est simple mais ne permet pas de gérer un cycle de vie, des métadonnées ou de multiples types d'objets.

Elle limite fortement les évolutions futures.

Cette solution est rejetée.

---

## Entité métier dédiée

Le Follow devient une entité indépendante reliant un utilisateur à un objet métier.

Cette approche offre une meilleure évolutivité, favorise la réutilisation et réduit le couplage entre les domaines.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.Discovery.*

02-FSPEC.Notification.*

02-FSPEC.User.*

03-TSPEC.Recommendation.*

03-TSPEC.Notification.*

03-TSPEC.Search.*

99-ADR.*

---

# Documents liés

ADR.11 – Platform Architecture Principles

ADR.16 – Notification Framework

ADR.17 – Organization Domain Model

ADR.19 – User Preferences

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction du modèle métier Follow comme représentation des relations durables entre un utilisateur et les objets suivis. |