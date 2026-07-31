# Recommendation Engine

**Document** : TSPEC.02

**Fichier** : 03-TSPEC.02-RecommendationEngine-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du moteur de recommandation d'EventFoundry V2.

Le moteur sélectionne les événements les plus pertinents pour un utilisateur en appliquant un ensemble de règles métier déterministes.

Le moteur ne prend jamais de décision probabiliste.

Chaque recommandation est explicable.

---

# Responsabilités

Le Recommendation Engine est responsable de :

- sélectionner des événements ;
- calculer un score de pertinence ;
- produire des recommandations explicables ;
- éviter les doublons ;
- appliquer les préférences utilisateur.

Le moteur n'est pas responsable :

- de la gestion du planning ;
- des notifications ;
- de la recherche ;
- du catalogue ;
- des permissions.

---

# Position dans l'architecture

```text
            Catalog
               │
               ▼
      Recommendation Engine
               │
      ┌────────┴─────────┐
      ▼                  ▼
Notifications        Planning
```

Le moteur consomme les événements du Catalog.

Il produit des recommandations destinées aux autres domaines.

---

# Structure du module

```text
RecommendationEngine

├── Domain
│   ├── Rules
│   ├── Scoring
│   ├── Filters
│   ├── Models
│   └── DomainEvents
│
├── Application
│   ├── Commands
│   ├── Queries
│   ├── UseCases
│   └── DTO
│
├── Infrastructure
│   ├── Catalog
│   ├── Planning
│   ├── Profiles
│   └── Persistence
│
└── API
```

---

# Modèle métier

Le domaine manipule principalement les concepts suivants.

```text
Recommendation
```

Une recommandation contient notamment :

```text
Recommendation

├── User
├── Event
├── Score
├── Reasons
├── Status
└── GeneratedAt
```

Le moteur ne modifie jamais les événements.

---

# Pipeline de recommandation

Chaque recommandation est produite selon une succession d'étapes.

```text
Catalog

↓

Pré-filtrage

↓

Application des règles

↓

Calcul du score

↓

Classement

↓

Suppression des doublons

↓

Production des recommandations
```

Chaque étape est indépendante.

---

# Les règles métier

Les règles sont organisées en familles.

Exemples :

- préférences utilisateur ;
- catégories favorites ;
- distance maximale ;
- disponibilité ;
- événements déjà planifiés ;
- événements déjà refusés.

Chaque règle est :

- indépendante ;
- testable ;
- explicable.

---

# Calcul du score

Le score est calculé à partir des règles appliquées.

Chaque règle apporte une contribution positive ou négative.

Le calcul reste déterministe.

Aucun apprentissage automatique n'est utilisé.

---

# Explicabilité

Chaque recommandation conserve les raisons ayant conduit à sa sélection.

Exemple :

```text
Score : 87

Raisons :

+ catégorie favorite

+ proche du domicile

+ artiste suivi

- conflit horaire mineur
```

L'utilisateur peut comprendre pourquoi une recommandation lui est proposée.

---

# Interfaces publiques (Ports)

Le moteur expose les interfaces suivantes.

## RecommendationQueryService

Permet :

- obtenir les recommandations d'un utilisateur ;
- recalculer les recommandations.

---

## RecommendationCommandService

Permet :

- accepter une recommandation ;
- ignorer une recommandation ;
- refuser une recommandation.

---

## RecommendationRepository

Persistance des recommandations.

---

# Cas d'utilisation

Le moteur implémente notamment :

- Generate Recommendations
- Refresh Recommendations
- Accept Recommendation
- Ignore Recommendation
- Reject Recommendation
- Explain Recommendation

---

# Flux principaux

## Génération

```text
Catalog

↓

Recommendation Engine

↓

Recommendations
```

---

## Acceptation

```text
Recommendation

↓

Planning

↓

Participation
```

---

## Notification

```text
Recommendation

↓

Notifications
```

La notification constitue un canal de diffusion.

Elle ne modifie jamais la recommandation.

---

# Événements du domaine

Le moteur publie notamment :

```text
RecommendationGenerated

RecommendationAccepted

RecommendationRejected

RecommendationExpired
```

Ces événements permettent aux autres domaines de réagir.

---

# Dépendances techniques

Le moteur dépend des contrats publics suivants.

```text
Catalog API

Planning API

Profiles API

ReferenceData API
```

Aucune dépendance directe vers Discovery ou Notifications.

---

# Gestion des données

Le moteur est propriétaire :

- des recommandations ;
- des scores ;
- des explications.

Il ne stocke jamais les événements.

---

# Sécurité

Les recommandations sont toujours calculées dans le contexte d'une identité.

Aucune recommandation n'est accessible à un autre utilisateur.

---

# Performance

Le moteur privilégie :

- la reproductibilité ;
- la stabilité des résultats ;
- des temps de calcul prévisibles.

Le calcul peut être réalisé de manière différée.

---

# Observabilité

Le moteur expose notamment :

- recommandations générées ;
- durée moyenne de calcul ;
- score moyen ;
- recommandations acceptées ;
- recommandations refusées ;
- erreurs de calcul.

---

# Contraintes

Le moteur respecte les principes suivants.

- aucune intelligence artificielle ;
- aucun apprentissage automatique ;
- aucun modèle probabiliste ;
- règles entièrement explicables ;
- calcul reproductible ;
- résultats déterministes.

Toute évolution contraire nécessite un ADR.

---

# Évolutions

Les évolutions futures pourront enrichir les règles métier.

Le principe déterministe demeure inchangé.

L'introduction éventuelle d'un moteur hybride relèvera de la V3.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

02-FSPEC.09-RecommendationEngine-v2.0

02-FSPEC.08-Planning-v2.0

02-FSPEC.11-Notifications-v2.0

99-ADR.09-DeterministicRecommendationEngine-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du Recommendation Engine. |