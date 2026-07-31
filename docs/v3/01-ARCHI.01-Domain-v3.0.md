# Domain Model

**Document** : ARCHI.01

**Fichier** : 01-ARCHI.01-Domain-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les principaux concepts métier manipulés par EventFoundry.

Ce document définit le vocabulaire commun utilisé dans l'ensemble de la plateforme.

Il constitue la référence des documents fonctionnels et techniques.

---

# Principes

Le domaine est organisé autour d'objets métier indépendants.

Chaque objet possède une responsabilité clairement identifiée.

Les relations entre objets doivent rester explicites.

---

# Les grands domaines

La plateforme est organisée autour de huit domaines principaux.

- Identity
- Organizations
- Catalogue
- Planning
- Discovery
- Import
- Notifications
- Administration

---

# Identity

L'identité représente une personne utilisant la plateforme.

Elle possède :

- un compte ;
- un profil ;
- des préférences ;
- des rôles ;
- des appartenances à des organisations.

Une identité peut exercer plusieurs expériences.

---

# Organizations

Une organisation représente une structure utilisant EventFoundry.

Exemples :

- association ;
- mairie ;
- entreprise ;
- club.

Une organisation possède notamment :

- des membres ;
- des adresses ;
- des paramètres ;
- des connecteurs configurés.

---

# Catalogue

Le catalogue représente l'ensemble des événements connus.

Le catalogue est une ressource.

Il ne constitue pas le produit.

Il peut contenir :

- événements importés ;
- événements créés manuellement ;
- événements enrichis.

---

# Planning

Le planning représente la relation entre un Explorer et les événements qu'il a qualifiés.

Le planning constitue le cœur fonctionnel du produit.

Chaque qualification traduit une intention.

Exemples :

- intéressé ;
- réservé ;
- payé ;
- annulé.

---

# Discovery

Le domaine Discovery permet de proposer des événements susceptibles d'intéresser un utilisateur.

Les recommandations sont produites par un moteur déterministe.

Le moteur exploite :

- préférences ;
- suivis ;
- historique ;
- contexte connu.

---

# Import

Le domaine Import est chargé d'acquérir des événements depuis des sources externes.

Il repose sur des connecteurs indépendants.

Chaque import suit le pipeline :

Source

↓

Connector

↓

Raw Event

↓

Validation

↓

Normalization

↓

Imported Event

↓

Persistence

---

## Connecteur

Un connecteur connaît uniquement un fournisseur.

Il extrait les données disponibles.

Il ne prend aucune décision métier.

---

## Raw Event

Le Raw Event représente fidèlement les données reçues.

Il conserve toutes les propriétés du fournisseur.

Aucune normalisation n'est appliquée.

---

## Imported Event

L'Imported Event représente un événement normalisé.

Il constitue le modèle commun utilisé par EventFoundry.

---

# Notifications

Le domaine Notification centralise toutes les communications de la plateforme.

Deux familles sont distinguées :

- notifications techniques ;
- notifications utilisateur.

Les préférences utilisateur déterminent uniquement le mode de diffusion.

---

# Administration

Le domaine Administration regroupe :

- configuration ;
- monitoring ;
- observabilité ;
- paramètres techniques ;
- supervision.

---

# Les relations majeures

Identity

↓

Planning

↓

Event

↑

Import

↓

Connector

↓

Raw Event

Organization

↓

Connector

↓

Import

---

# Principes de conception

Les principes suivants s'appliquent à tout nouveau domaine.

## Responsabilité unique

Chaque objet possède une responsabilité clairement identifiée.

---

## Déterminisme

Les décisions métier restent déterministes.

---

## Traçabilité

Toute information importante doit pouvoir être retracée jusqu'à son origine.

---

## Extensibilité

L'ajout d'un nouveau fournisseur ne doit modifier aucun domaine métier.

---

## Séparation des responsabilités

Extraction.

Validation.

Normalisation.

Persistance.

Ces responsabilités restent indépendantes.

---

# Documents liés

ARCHI.02

FSPEC.*

TSPEC.*

ADR.*

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première formalisation du modèle de domaine V3. |