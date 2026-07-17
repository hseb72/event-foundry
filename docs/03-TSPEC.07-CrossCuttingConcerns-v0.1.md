# Cross-Cutting Concerns

**Document** : TSPEC.07
**Fichier** : 03-TSPEC.07-CrossCuttingConcerns-v0.1.md
**Version** : 0.1
**Statut** : Draft

---

# Objectif

Définir les règles techniques transversales applicables à l'ensemble des composants d'EventFoundry.

Ces règles concernent :

- Backend
- Frontend
- OCR Worker
- Expert Classification Worker
- futurs Workers
- services techniques

---

# Principes

L'ensemble de la plateforme applique les principes suivants :

- architecture stateless ;
- responsabilité unique ;
- dépendance aux abstractions ;
- contrats partagés ;
- observabilité complète ;
- sécurité par défaut ;
- configuration externalisée.

---

# Configuration

Toute configuration provient exclusivement :

- variables d'environnement ;
- fichiers de configuration.

Aucune valeur sensible n'est codée en dur.

---

# Secrets

Les secrets comprennent notamment :

- mots de passe ;
- clés API ;
- certificats ;
- JWT Secret ;
- identifiants PostgreSQL ;
- identifiants Redis ;
- identifiants MinIO.

Ils sont injectés par Kubernetes.

Ils ne sont jamais versionnés.

---

# Gestion des erreurs

Les erreurs sont classées en trois catégories.

## Validation

Erreurs liées aux données d'entrée.

Exemples :

- champ obligatoire absent ;
- format invalide ;
- valeur hors limites.

Retour :

HTTP 400

---

## Métier

Violation d'une règle métier.

Exemples :

- activité inconnue ;
- événement déjà existant ;
- participation impossible.

Retour :

HTTP 409

ou

HTTP 422

---

## Technique

Défaillance d'un composant.

Exemples :

- PostgreSQL indisponible ;
- Redis inaccessible ;
- MinIO indisponible ;
- Worker indisponible.

Retour :

HTTP 500

---

# Logging

Tous les composants journalisent :

- démarrage ;
- arrêt ;
- erreurs ;
- traitements ;
- durée.

Chaque entrée contient :

- timestamp UTC ;
- niveau ;
- composant ;
- correlationId.

---

# CorrelationId

Toute requête reçoit un :

```
correlationId
```

Cet identifiant est propagé à travers :

- API ;
- BullMQ ;
- Workers ;
- logs.

Il permet de reconstruire intégralement un traitement.

---

# Monitoring

Chaque composant publie des métriques.

Exemples :

- temps de réponse ;
- temps OCR ;
- temps de classification ;
- nombre de Jobs ;
- nombre de retries ;
- erreurs ;
- files BullMQ.

---

# Health Checks

Chaque composant expose un endpoint de santé.

Vérifications minimales :

- application démarrée ;
- accès PostgreSQL (Backend) ;
- accès Redis ;
- accès MinIO ;
- consommation BullMQ (Workers).

Les sondes Kubernetes utilisent ces endpoints.

---

# Validation

Toutes les données entrantes sont validées.

Backend :

- DTO ;
- ValidationPipe.

Workers :

- validation des contrats reçus.

Aucun composant ne traite une donnée invalide.

---

# Sécurité

Le Backend applique :

- authentification JWT ;
- autorisation basée sur les rôles ;
- validation des entrées ;
- protection CORS ;
- limitation de débit.

Les Workers ne sont jamais exposés publiquement.

---

# Authentification

L'API REST utilise JWT.

Les Workers ne possèdent pas d'authentification utilisateur.

Les communications internes utilisent exclusivement le réseau privé Kubernetes.

---

# Autorisation

Les autorisations sont centralisées.

Les rôles définissent les permissions.

Les Workers ne réalisent aucun contrôle d'autorisation.

---

# API

Toutes les API sont versionnées.

Exemple :

```
/api/v1/events
```

Toute évolution incompatible nécessite une nouvelle version.

---

# Contrats

Tous les échanges inter-composants utilisent exclusivement les contrats présents dans :

```
shared/contracts
```

Aucun composant ne dépend directement des objets internes d'un autre composant.

---

# Persistance

Toutes les opérations de persistance transitent par :

```
Repositories
```

Les Services ne dépendent jamais directement de Prisma.

---

# Transactions

Les transactions sont limitées aux opérations métier nécessitant une cohérence forte.

Les traitements asynchrones sont toujours hors transaction.

---

# Cache

Redis est réservé :

- au cache ;
- à BullMQ.

Il n'est jamais utilisé comme base de données principale.

---

# Files de messages

BullMQ est l'unique système de gestion des traitements asynchrones.

Tous les Workers consomment des Jobs BullMQ.

---

# Stockage objet

Tous les documents sont stockés dans MinIO.

Aucun fichier n'est stocké dans PostgreSQL.

---

# Dates

Toutes les dates utilisent :

UTC

La conversion vers le fuseau utilisateur est réalisée uniquement côté API ou Frontend.

---

# Identifiants

Tous les identifiants techniques utilisent :

UUID

Aucune clé auto-incrémentée n'est utilisée.

---

# Déploiement

Tous les composants sont déployables indépendamment.

Ils sont :

- stateless ;
- répliquables ;
- indépendants.

---

# Observabilité

Chaque composant fournit :

- logs structurés ;
- métriques ;
- correlationId ;
- health checks.

Les incidents doivent pouvoir être diagnostiqués sans accès au code.

---

# Dépendances

Une responsabilité technique correspond à une technologie de référence.

Voir :

ADR — Single Technology per Responsibility

---

# Règles d'architecture

Les composants dépendent :

- des interfaces ;
- des contrats ;
- des abstractions.

Jamais des implémentations.

---

# Critères d'acceptation

CA-001

Tous les composants sont stateless.

---

CA-002

Tous les échanges utilisent des contrats partagés.

---

CA-003

Toutes les requêtes sont traçables grâce au correlationId.

---

CA-004

Tous les composants exposent un Health Check.

---

CA-005

Toutes les configurations sont externalisées.

---

CA-006

Tous les secrets sont injectés par Kubernetes.

---

CA-007

Toutes les API sont versionnées.

---

CA-008

Toutes les opérations de persistance transitent par les Repositories.

---

CA-009

Les Workers ne sont jamais exposés publiquement.

---

CA-010

Les composants dépendent uniquement des abstractions définies par le projet.

---

# Documents liés

TSPEC.01

TSPEC.02

TSPEC.03

TSPEC.04

TSPEC.05

TSPEC.06

ADR — Shared Contracts

ADR — Rule Engine Architecture

ADR — Single Technology per Responsibility

ADR — Messaging & Events (Draft)

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction des règles techniques transversales. |