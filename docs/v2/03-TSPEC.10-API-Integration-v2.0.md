# API & Integration

**Document** : TSPEC.10

**Fichier** : 03-TSPEC.10-API-Integration-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir les principes techniques d'intégration entre les domaines de la plateforme EventFoundry.

Ce document décrit les règles de communication, les contrats d'échange, les principes de découplage et les mécanismes de synchronisation entre les composants.

Il ne spécifie pas une technologie particulière.

---

# Principes d'architecture

L'intégration repose sur les principes suivants :

- chaque domaine est autonome ;
- chaque domaine expose des contrats publics ;
- les dépendances sont unidirectionnelles ;
- les échanges sont explicites ;
- les données restent propriétaires de leur domaine d'origine.

Aucun domaine n'accède directement aux données internes d'un autre domaine.

---

# Architecture générale

```text
                 +----------------------+
                 |      Identity        |
                 +----------+-----------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        ▼                   ▼                   ▼
+---------------+   +---------------+   +---------------+
| Publishing    |   | Discovery     |   | Recommendation|
+-------+-------+   +-------+-------+   +-------+-------+
        |                   |                   |
        +---------+---------+-------------------+
                  |
                  ▼
             +---------+
             | Catalog |
             +---------+
                  |
                  ▼
             +---------+
             | Search  |
             +---------+

Reference Data fournit des données communes à l'ensemble des domaines.

Notifications consomme les événements produits par les autres domaines.
```

---

# Types d'interactions

La plateforme distingue deux modes d'intégration.

## Communication synchrone

Utilisée lorsqu'une réponse immédiate est nécessaire.

Exemples :

- consulter un événement ;
- vérifier une permission ;
- obtenir une référence.

Les échanges utilisent les interfaces publiques des domaines.

---

## Communication asynchrone

Utilisée lorsqu'une action déclenche un traitement différé.

Exemples :

- publication d'un événement ;
- génération d'une notification ;
- indexation ;
- recalcul des recommandations.

Les échanges utilisent des événements métier.

---

# Contrats publics

Chaque domaine expose exclusivement des interfaces publiques.

Exemples :

```text
Catalog API

Planning API

Identity API

Publishing API

Search API

ReferenceData API
```

Les implémentations internes restent privées.

---

# Ports et adaptateurs

Chaque domaine applique le principe Ports & Adapters.

```text
Application

↓

Port

↓

Adapter

↓

Infrastructure
```

Les domaines métier ne dépendent jamais directement d'une technologie.

---

# Événements métier

Les événements représentent des faits métier.

Exemples :

```text
EventPublished

PlanningEntryCreated

RecommendationGenerated

ExperienceChanged

NotificationSent
```

Un événement :

- est immuable ;
- possède un identifiant unique ;
- contient le minimum d'informations nécessaires ;
- ne transporte pas de logique métier.

---

# Synchronisation

Les domaines restent synchronisés grâce aux événements.

Exemple :

```text
Publishing

↓

EventPublished

↓

Catalog

↓

Search

↓

Notifications
```

Chaque domaine décide librement de la manière dont il traite un événement reçu.

---

# Gestion des erreurs

Les erreurs sont isolées.

Principes :

- un domaine ne propage pas ses exceptions internes ;
- les erreurs techniques sont traduites ;
- les erreurs métier sont explicites ;
- les traitements asynchrones sont rejouables.

---

# Idempotence

Toutes les opérations pouvant être rejouées doivent être idempotentes.

Cela concerne notamment :

- publication d'événements ;
- indexation ;
- notifications ;
- synchronisations.

Le retraitement d'un même message ne doit pas produire d'effet de bord.

---

# Versionnement

Les contrats publics sont versionnés.

Principes :

- compatibilité ascendante privilégiée ;
- suppression progressive des versions obsolètes ;
- documentation des changements.

Les domaines évoluent indépendamment.

---

# Sécurité

Les communications respectent les principes suivants :

- authentification centralisée par Identity ;
- autorisation via les permissions ;
- chiffrement des échanges ;
- validation des entrées ;
- journalisation des opérations sensibles.

Les domaines consommateurs ne contournent jamais Identity.

---

# Observabilité

Chaque domaine expose des métriques standardisées.

Exemples :

- nombre d'appels ;
- temps de réponse ;
- taux d'erreur ;
- nombre d'événements produits ;
- nombre d'événements consommés ;
- files d'attente.

Les journaux sont corrélables grâce à un identifiant de trace partagé.

---

# Résilience

Les communications doivent être résilientes.

Principes :

- reprise après erreur ;
- délais d'attente maîtrisés ;
- tentatives de réexécution limitées ;
- gestion des indisponibilités temporaires.

Les domaines restent fonctionnels autant que possible en cas de défaillance d'un service non critique.

---

# Contraintes

La plateforme respecte les principes suivants.

- un domaine est propriétaire de ses données ;
- aucun accès direct aux bases de données d'un autre domaine ;
- les dépendances sont orientées vers les contrats publics ;
- les événements sont immuables ;
- les interfaces publiques sont documentées et versionnées.

Toute évolution de ces principes nécessite un ADR.

---

# Cartographie des domaines

| Domaine | Nature | Responsabilité principale |
|----------|--------|---------------------------|
| Identity | Foundation Service | Authentification, autorisation, identité |
| Reference Data | Foundation Service | Référentiels partagés |
| Catalog | System of Record | Patrimoine culturel |
| Planning | System of Record | Décisions utilisateur |
| Publishing | Workflow Service | Cycle de publication |
| Recommendation Engine | Decision Service | Recommandations déterministes |
| Discovery | Orchestration Service | Exploration du patrimoine |
| Notifications | Orchestration Service | Diffusion des informations |
| Search | Infrastructure Service | Recherche et indexation |

---

# Évolutions

La V3 pourra intégrer :

- API Gateway ;
- GraphQL ;
- Event Streaming avancé ;
- Webhooks ;
- API publiques partenaires ;
- intégrations temps réel.

Ces évolutions ne remettent pas en cause les principes fondamentaux d'intégration.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

03-TSPEC.02-RecommendationEngine-v2.0

03-TSPEC.03-Planning-v2.0

03-TSPEC.04-Discovery-v2.0

03-TSPEC.05-Publishing-v2.0

03-TSPEC.06-Identity-v2.0

03-TSPEC.07-Notifications-v2.0

03-TSPEC.08-ReferenceData-v2.0

03-TSPEC.09-Search-v2.0

99-ADR.08-RoleBasedAccessControl-v2.0

99-ADR.09-DeterministicRecommendationEngine-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

99-ADR.11-IdentityRolesExperiencesSubscriptions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique des principes d'intégration de la plateforme. |