# ADR.15 – Raw Event Model

**Document** : ADR.15

**Fichier** : 99-ADR.15-RawEventModel.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

L'ADR.13 introduit un framework de connecteurs indépendant des fournisseurs.

L'ADR.14 définit le pipeline d'import permettant de transformer les données d'une source externe en événements exploitables par EventFoundry.

Il reste à définir le contrat d'échange entre ces deux éléments.

La plateforme doit pouvoir évoluer indépendamment :

- des fournisseurs ;
- des règles métier ;
- des mécanismes de normalisation.

Cette indépendance nécessite un modèle intermédiaire.

---

# Problème

Les fournisseurs exposent des modèles de données très différents.

Par exemple :

- Tourism System publie plusieurs centaines de propriétés spécialisées ;
- Discord fournit essentiellement un message libre ;
- un fichier CSV possède une structure imposée ;
- une image nécessite une phase d'extraction préalable.

Ces modèles évoluent régulièrement.

Un connecteur qui construirait directement un `Event` métier devrait :

- interpréter les données ;
- choisir quelles propriétés conserver ;
- ignorer certaines informations ;
- appliquer des règles métier.

Cette approche créerait un fort couplage entre les connecteurs et le domaine métier.

Toute évolution du modèle `Event` imposerait la modification de l'ensemble des connecteurs.

---

# Décision

Le framework d'import introduit un modèle intermédiaire nommé **Raw Event**.

Le Raw Event constitue le contrat officiel entre les connecteurs et le pipeline d'import.

Chaque connecteur produit exclusivement des Raw Events.

Le domaine métier ne manipule jamais directement ces objets.

---

# Objectifs

Le modèle Raw Event poursuit plusieurs objectifs.

## Découpler les fournisseurs du domaine

Les connecteurs ignorent totalement le modèle métier.

Ils ne produisent que des représentations fidèles des données reçues.

---

## Préserver l'information

Aucune donnée fournie par la source n'est volontairement supprimée.

Même une propriété aujourd'hui inutilisée peut devenir pertinente dans une version future.

---

## Permettre le rejeu

Un import peut être rejoué sans solliciter à nouveau le fournisseur.

La plateforme réutilise les Raw Events déjà stockés.

---

## Faciliter l'évolution

Le mapping vers le modèle métier peut évoluer sans modifier les connecteurs.

Cette séparation limite fortement les impacts des évolutions fonctionnelles.

---

# Principes

Le Raw Event respecte les principes suivants.

## Fidélité

Le Raw Event représente fidèlement les données du fournisseur.

Il ne cherche jamais à les interpréter.

---

## Immutabilité

Une fois créé, un Raw Event n'est jamais modifié.

Toutes les transformations sont réalisées sur une copie logique lors des étapes suivantes du pipeline.

---

## Traçabilité

Chaque Raw Event reste associé :

- à son fournisseur ;
- à son Import Job ;
- à sa date d'acquisition ;
- à la version du connecteur utilisée.

Cette traçabilité permet d'expliquer l'origine de toute donnée métier.

---

## Neutralité

Le Raw Event ne contient aucune logique métier.

Il ne réalise notamment :

- aucune validation ;
- aucune normalisation ;
- aucune catégorisation ;
- aucune recommandation.

---

# Cycle de vie

Le Raw Event apparaît immédiatement après la phase d'extraction.

```
Source

↓

Connector

↓

Extract

↓

Raw Event

↓

Validate

↓

Normalize

↓

Event
```

Toutes les étapes suivantes travaillent à partir de ce modèle.

---

# Conservation

Les Raw Events sont conservés après l'import.

Ils constituent un historique technique des acquisitions.

Cette conservation permet notamment :

- le diagnostic d'un incident ;
- l'amélioration d'un mapper ;
- le rejeu d'un import ;
- l'audit d'un traitement.

La durée de conservation pourra être pilotée par la politique d'archivage de la plateforme.

---

# Mapping

Le passage du Raw Event vers le modèle métier est réalisé exclusivement par la phase de normalisation.

Cette étape :

- harmonise les données ;
- convertit les formats ;
- applique les conventions de la plateforme.

Le connecteur n'intervient jamais dans ce processus.

---

# Responsabilités

## Connecteur

Responsable de produire un Raw Event fidèle.

---

## Pipeline

Responsable de transformer le Raw Event.

---

## Domaine métier

Responsable d'exploiter les données normalisées.

---

# Conséquences

Cette décision implique que :

- les connecteurs restent simples ;
- le domaine métier devient indépendant des fournisseurs ;
- les mappings peuvent évoluer librement ;
- les traitements deviennent entièrement rejouables.

Le Raw Event devient la référence technique de toute acquisition de données externes.

---

# Alternatives étudiées

## Mapping direct vers le modèle métier

Chaque connecteur produit directement un `Event`.

Cette approche simplifie les premiers développements.

Elle entraîne cependant un fort couplage entre les fournisseurs et le domaine métier.

Toute évolution du modèle métier nécessite la modification des connecteurs.

Cette solution est rejetée.

---

## Modèle intermédiaire Raw Event

Tous les connecteurs produisent un modèle brut indépendant du domaine.

Le pipeline se charge ensuite des transformations.

Cette architecture favorise le découplage, la traçabilité et l'évolutivité.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.01-Import.*

03-TSPEC.01-Import.*

03-TSPEC.Connectors.*

99-ADR.*

---

# Documents liés

ADR.12 – Platform Architecture Principles

ADR.13 – Import Connector Framework

ADR.14 – Import Pipeline

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction du modèle intermédiaire Raw Event entre les connecteurs et le domaine métier. |