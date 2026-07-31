# Architecture

**Document** : ARCHI  
**Fichier** : 01-Architecture-v1.0.md  
**Version** : 1.0  
**Statut** : Validé

---

# Objectif

La collection **ARCHI** constitue la référence architecturale d'EventFoundry.

Elle décrit l'architecture fonctionnelle et technique du produit, indépendamment de son implémentation.

Les documents de cette collection sont considérés comme les fondations du projet. Ils évoluent rarement et uniquement lorsqu'une décision d'architecture le justifie.

---

# Périmètre

La collection couvre :

- l'architecture générale de la plateforme ;
- le modèle métier ;
- le modèle de persistance ;
- le contrat d'API.

Les choix d'implémentation détaillés ne font pas partie de cette collection et seront documentés dans les **TSPEC**.

---

# Organisation

| ID | Document | Version | Statut |
|----|----------|---------|--------|
| ARCHI.01 | System Architecture | 1.0 | ✅ Validé |
| ARCHI.02 | Domain Model | 1.0 | ✅ Validé |
| ARCHI.03 | Database Model | 1.0 | ✅ Validé |
| ARCHI.04 | REST API | 1.0 | ✅ Validé |

---

# Relations avec les autres collections

## VISION

La vision décrit :

> Pourquoi le produit existe.

---

## ARCHI

Décrit :

> Comment le produit est conçu.

---

## FSPEC

Décrit :

> Ce que doit faire le produit.

---

## TSPEC

Décrit :

> Comment chaque fonctionnalité est implémentée.

---

## ADR

Explique :

> Pourquoi certaines décisions d'architecture ont été prises.

---

## BACKLOG

Centralise toutes les évolutions hors périmètre V1.

---

# Gouvernance

Les documents ARCHI sont considérés comme contractuels.

Une fois validés :

- ils ne sont plus modifiés au fil des développements ;
- toute évolution significative doit être justifiée dans un ADR ;
- les FSPEC et TSPEC doivent rester compatibles avec eux.

---

# Convention documentaire

Chaque document ARCHI possède :

- un identifiant unique (`ARCHI.xx`) ;
- une version ;
- un statut ;
- un historique.

Les références entre documents utilisent les identifiants (`ARCHI.01`, `FSPEC.03`, `TSPEC.02`, etc.) et non les noms de fichiers.

---

# Historique

| Version | Description |
|----------|-------------|
| 1.0 | Création de la collection ARCHI. |