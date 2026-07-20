# ADR.13 – Import Connector Framework

**Document** : ADR.13

**Fichier** : 99-ADR.13-ImportConnectorFramework.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

La vocation d'EventFoundry est de centraliser des événements provenant d'une grande diversité de fournisseurs.

Ces fournisseurs peuvent proposer leurs données sous des formes très différentes :

- API REST ;
- pages HTML ;
- flux RSS ou ICS ;
- fichiers CSV ;
- fichiers JSON ;
- images ;
- documents PDF ;
- contenus copiés/collés ;
- futures sources non encore identifiées.

La V2 a démontré que cette diversité n'est pas un problème fonctionnel mais un problème d'architecture.

Chaque nouveau fournisseur ne doit pas entraîner la création d'un nouveau mécanisme d'import.

La plateforme doit être capable d'intégrer un nouveau fournisseur sans remettre en cause les traitements existants.

---

# Problème

Les fournisseurs présentent des caractéristiques très hétérogènes.

Ils diffèrent notamment par :

- leur mode d'accès ;
- leur format ;
- leur fréquence de mise à disposition ;
- leur qualité de données ;
- leur mécanisme d'authentification ;
- leur stabilité.

Sans architecture commune, chaque nouveau fournisseur conduirait à développer :

- un nouveau pipeline ;
- de nouvelles règles de validation ;
- de nouveaux mécanismes de supervision ;
- un comportement spécifique.

Cette approche augmenterait rapidement le coût de maintenance de la plateforme.

---

# Décision

Tous les fournisseurs d'événements seront intégrés au travers d'un framework unique de connecteurs.

Chaque fournisseur sera implémenté sous la forme d'un connecteur indépendant.

Le connecteur constitue la seule partie de la plateforme connaissant les spécificités techniques d'un fournisseur.

Le reste de la plateforme manipule exclusivement des modèles génériques.

---

# Objectifs

Le framework poursuit plusieurs objectifs.

## Uniformiser les imports

Quel que soit le fournisseur, le comportement général reste identique.

Les différences sont confinées dans le connecteur.

---

## Limiter les dépendances

Le domaine métier ne dépend jamais d'un fournisseur particulier.

L'ajout ou le retrait d'un connecteur ne modifie pas le reste de la plateforme.

---

## Favoriser l'extensibilité

Le framework doit permettre d'ajouter facilement de nouveaux fournisseurs.

Le développement d'un connecteur ne nécessite aucune modification des autres connecteurs.

---

## Mutualiser les traitements

Les traitements transverses restent communs :

- validation ;
- normalisation ;
- déduplication ;
- persistance ;
- statistiques ;
- observabilité.

Ces traitements ne sont jamais implémentés dans les connecteurs.

---

# Responsabilités d'un connecteur

Un connecteur est responsable de :

- accéder à une source ;
- récupérer les données disponibles ;
- interpréter le format du fournisseur ;
- produire une collection de Raw Events.

Le connecteur ne prend jamais de décision métier.

Il ne réalise notamment jamais :

- de validation métier ;
- de normalisation ;
- de déduplication ;
- de recommandation ;
- de persistance.

Ces responsabilités appartiennent au pipeline d'import.

---

# Architecture générale

Le framework constitue la première étape du pipeline d'import.

```
              Fournisseur

                    │

            Import Connector

                    │

             Collection de
               Raw Events

                    │

         Pipeline d'import V3

                    │

              EventFoundry
```

Le connecteur ne connaît pas les étapes suivantes.

Il se contente de fournir une représentation fidèle des données disponibles.

---

# Interface commune

Tous les connecteurs implémentent une interface commune.

Cette interface garantit notamment la capacité de :

- identifier le fournisseur ;
- vérifier la disponibilité de la source ;
- lancer un import ;
- retourner les données extraites ;
- produire des statistiques.

Les détails techniques de cette interface sont définis dans les TSPEC.

---

# Types de connecteurs

Le framework ne dépend d'aucun mode d'acquisition particulier.

Il doit permettre d'intégrer notamment :

- API REST ;
- HTML ;
- RSS ;
- ICS ;
- CSV ;
- JSON ;
- Discord ;
- Tourism System ;
- Image ;
- PDF.

De nouveaux types pourront être ajoutés sans modification de l'architecture.

---

# Configuration

Chaque connecteur possède sa propre configuration.

Exemples :

- URL ;
- authentification ;
- timeout ;
- fréquence d'exécution ;
- paramètres spécifiques.

La configuration est séparée du code.

Elle peut être modifiée sans redéploiement de la plateforme.

---

# Isolation

Les connecteurs sont totalement indépendants.

Ils ne communiquent jamais directement entre eux.

Ils ne partagent aucune logique métier.

Ils ne connaissent jamais les traitements réalisés après l'extraction.

Cette isolation garantit que la défaillance d'un fournisseur n'impacte pas les autres.

---

# Observabilité

Chaque exécution produit des informations techniques.

Par exemple :

- date d'exécution ;
- durée ;
- nombre d'objets lus ;
- nombre de Raw Events produits ;
- erreurs rencontrées ;
- avertissements.

Ces informations alimentent les outils de supervision de la plateforme.

---

# Évolutivité

Le framework est conçu pour évoluer.

Il doit permettre :

- l'ajout de nouveaux fournisseurs ;
- l'évolution d'un fournisseur existant ;
- le remplacement d'un fournisseur ;
- le retrait d'un connecteur obsolète.

Ces évolutions ne doivent jamais remettre en cause le domaine métier.

---

# Conséquences

Cette décision implique que :

- tous les imports utilisent désormais le même framework ;
- les traitements métier deviennent indépendants des fournisseurs ;
- les connecteurs restent de petite taille ;
- les règles métier sont centralisées dans le pipeline d'import.

Le framework devient le point d'entrée unique de toute acquisition de données externes.

---

# Alternatives étudiées

## Pipeline spécifique par fournisseur

Cette approche offre une grande liberté d'implémentation.

Elle conduit cependant rapidement à des traitements hétérogènes, difficiles à maintenir et à superviser.

Cette solution est rejetée.

---

## Framework unique

Tous les fournisseurs suivent les mêmes règles d'intégration.

Les différences sont limitées à la phase d'acquisition.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.01-Import.*

03-TSPEC.01-Import.*

03-TSPEC.Connectors.*

04-UISPEC.Operator.*

99-ADR.*

---

# Documents liés

ADR.12 – Platform Architecture Principles

ADR.14 – Import Pipeline

ADR.15 – Raw Event Model

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction du framework unifié des connecteurs d'import. |