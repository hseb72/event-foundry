# Backend Orchestration

**Document** : TSPEC.06
**Fichier** : 03-TSPEC.06-BackendOrchestration-v1.0.md
**Version** : 1.0
**Statut** : Validé

---

# Objectif

Définir le rôle du Backend dans l'architecture EventFoundry.

Le Backend est responsable de l'orchestration des composants. Il ne réalise ni OCR ni classification.

---

# Responsabilités

Le Backend :

- expose l'API REST ;
- authentifie les utilisateurs ;
- applique les règles métier de haut niveau ;
- orchestre les traitements asynchrones ;
- persiste les données ;
- publie les Jobs ;
- agrège les résultats.

Il ne réalise jamais :

- OCR ;
- traitement d'image ;
- classification experte.

---

# Architecture

```text
REST API
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ├── Repositories
    ├── BullMQ
    └── MinIO
```

Chaque couche possède une responsabilité unique.

---

# Controllers

Les Controllers :

- valident les requêtes ;
- convertissent les DTO ;
- délèguent aux Services.

Ils ne contiennent aucune logique métier.

---

# Services

Les Services orchestrent les cas d'usage.

Ils peuvent :

- appeler plusieurs Repositories ;
- publier des Jobs BullMQ ;
- appeler MinIO ;
- ouvrir une transaction.

Ils ne connaissent pas Prisma directement.

---

# Repositories

Les Repositories encapsulent entièrement Prisma.

Ils sont les seuls autorisés à accéder à PostgreSQL.

Tous héritent de `BaseRepository`.

---

# Orchestration du pipeline

Pour une acquisition :

1. création de `Attachment` ;
2. stockage du document dans MinIO ;
3. création d'`ImportJob` ;
4. publication d'un `ImportRequest` dans `OCR_QUEUE` ;
5. retour immédiat au client.

Le Backend ne bloque jamais en attendant la fin du traitement.

---

# Validation des EventCandidates

Lorsqu'un utilisateur valide un `EventCandidate`, le Backend :

1. ouvre une transaction ;
2. crée ou met à jour l'`Event` ;
3. crée les relations nécessaires ;
4. met à jour le statut du `EventCandidate` ;
5. valide la transaction.

---

# Transactions

Les transactions sont réservées aux opérations nécessitant une cohérence forte.

Les traitements asynchrones ne sont jamais inclus dans une transaction.

---

# Gestion des erreurs

Le Backend distingue :

- erreurs de validation ;
- erreurs métier ;
- erreurs techniques.

Les erreurs sont centralisées via des filtres d'exception.

---

# Sécurité

Le Backend applique :

- authentification ;
- autorisation ;
- validation des entrées ;
- limitation de débit (rate limiting) ;
- journalisation des actions sensibles.

---

# Logging

Chaque requête reçoit un `correlationId`.

Toutes les opérations sont journalisées avec ce même identifiant.

---

# Monitoring

Le Backend expose des métriques sur :

- temps de réponse ;
- taux d'erreur ;
- nombre de requêtes ;
- nombre de Jobs publiés ;
- durée des transactions.

---

# Scalabilité

Le Backend est totalement stateless.

Il peut être répliqué horizontalement sans synchronisation entre instances.

---

# Dépendances interdites

Le Backend ne dépend jamais :

- de Tesseract ;
- d'OpenCV ;
- des règles de classification.

---

# Critères d'acceptation

CA-001

Le Backend orchestre les traitements sans les exécuter.

---

CA-002

Aucun Service n'accède directement à Prisma.

---

CA-003

Toutes les opérations asynchrones transitent par BullMQ.

---

CA-004

Le Backend reste stateless.

---

CA-005

Chaque requête est traçable via un `correlationId`.

---

# Documents liés

TSPEC.01

TSPEC.02

TSPEC.03

TSPEC.04

TSPEC.05

ADR — Shared Contracts

ADR — Rule Engine Architecture

ADR — Single Technology per Responsibility

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 1.0 | Spécification validée pour la V1. |
