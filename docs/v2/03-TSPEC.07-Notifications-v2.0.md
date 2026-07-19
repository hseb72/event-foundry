# Notifications

**Document** : TSPEC.07

**Fichier** : 03-TSPEC.07-Notifications-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Notifications**.

Le domaine Notifications est responsable de la diffusion des informations destinées aux utilisateurs.

Il transforme des événements métier provenant d'autres domaines en messages distribués selon les préférences de chaque utilisateur.

Notifications ne produit aucune décision métier.

---

# Responsabilités

Le domaine Notifications est responsable de :

- recevoir des événements métier ;
- appliquer les préférences utilisateur ;
- construire les notifications ;
- choisir les canaux de diffusion ;
- assurer la distribution ;
- tracer les notifications envoyées.

Notifications n'est pas responsable :

- des recommandations ;
- du planning ;
- des publications ;
- des événements du Catalog ;
- des permissions.

---

# Position dans l'architecture

```text
Recommendation
        │
Planning│
Publishing
Catalog
        │
        ▼
 Notifications
        │
        ▼
 Utilisateur
```

Notifications est un domaine d'orchestration.

Il diffuse des informations sans modifier les domaines producteurs.

---

# Structure du module

```text
Notifications

├── Domain
│   ├── Models
│   ├── Channels
│   ├── Templates
│   ├── Policies
│   └── DomainEvents
│
├── Application
│   ├── Commands
│   ├── Queries
│   ├── UseCases
│   └── DTO
│
├── Infrastructure
│   ├── Email
│   ├── Push
│   ├── Messaging
│   ├── Persistence
│   └── Identity
│
└── API
```

---

# Modèle métier

Le domaine manipule principalement le concept suivant.

```text
Notification
```

```text
Notification

├── Recipient
├── Channel
├── Type
├── Content
├── Status
└── SentAt
```

Une notification représente un message à transmettre.

Elle ne représente jamais une décision métier.

---

# Sources

Les notifications peuvent être produites notamment par :

```text
Recommendation

Planning

Publishing

Catalog

Identity
```

Chaque domaine reste propriétaire de ses événements.

---

# Interfaces publiques (Ports)

## NotificationCommandService

Permet :

- créer une notification ;
- envoyer une notification ;
- annuler une notification ;
- rejouer une notification.

---

## NotificationQueryService

Permet :

- consulter les notifications ;
- consulter leur état ;
- consulter leur historique.

---

## NotificationRepository

Responsable de la persistance des notifications.

---

## NotificationDispatcher

Responsable de la diffusion sur les différents canaux.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Create Notification
- Send Notification
- Retry Notification
- Cancel Notification
- Get Notification
- Get Notification History

---

# Canaux

La V2 prévoit plusieurs canaux de diffusion.

Exemples :

- notification interne ;
- courrier électronique ;
- notification Push.

Chaque canal constitue une implémentation indépendante.

---

# Flux principaux

## Recommandation

```text
RecommendationGenerated

↓

Notifications

↓

Utilisateur
```

La recommandation demeure propriétaire de sa logique métier.

---

## Planning

```text
PlanningEntryUpdated

↓

Notifications

↓

Utilisateur
```

---

## Publication

```text
EventPublished

↓

Notifications

↓

Utilisateur
```

---

# Politique de diffusion

Avant toute diffusion, le domaine vérifie notamment :

- les préférences utilisateur ;
- les abonnements ;
- le canal disponible.

Le domaine ne décide jamais si une information est pertinente.

Cette décision appartient au domaine émetteur.

---

# Événements du domaine

Notifications publie notamment :

```text
NotificationCreated

NotificationSent

NotificationDelivered

NotificationFailed

NotificationCancelled
```

---

# Dépendances techniques

Le domaine dépend des contrats publics suivants.

```text
Identity API

Messaging

Email Provider

Push Provider
```

Le domaine ne dépend pas directement :

- du Catalog ;
- du Planning ;
- du Recommendation Engine.

Il consomme uniquement leurs événements.

---

# Gestion des données

Notifications est propriétaire :

- des notifications ;
- de leur historique ;
- de leur état de distribution.

Il ne stocke jamais :

- les recommandations ;
- les événements ;
- le planning.

---

# Sécurité

Les notifications sont toujours envoyées dans le contexte d'une identité.

Les préférences utilisateur sont respectées avant toute diffusion.

Les contenus sensibles sont protégés.

---

# Performance

Le domaine privilégie :

- le traitement asynchrone ;
- la résilience ;
- la reprise automatique après erreur.

Les délais de diffusion doivent rester faibles sans bloquer les domaines producteurs.

---

# Observabilité

Le domaine expose notamment :

- notifications créées ;
- notifications envoyées ;
- notifications délivrées ;
- notifications en erreur ;
- délai moyen de diffusion ;
- taux de réussite par canal.

Toutes les erreurs de diffusion sont journalisées.

---

# Contraintes

Notifications respecte les principes suivants.

- une notification est un canal de communication ;
- une notification n'est jamais un objet métier ;
- le domaine ne prend aucune décision métier ;
- le domaine ne modifie jamais les données des domaines producteurs ;
- la diffusion est découplée de la production des événements.

Toute évolution de ces principes nécessite un ADR.

---

# Évolutions

La V3 pourra intégrer :

- priorisation intelligente ;
- regroupement de notifications ;
- diffusion contextuelle ;
- planification intelligente des envois ;
- nouveaux canaux de diffusion.

Ces évolutions ne modifieront pas le rôle fondamental du domaine.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.02-RecommendationEngine-v2.0

03-TSPEC.03-Planning-v2.0

03-TSPEC.06-Identity-v2.0

02-FSPEC.11-Notifications-v2.0

99-ADR.11-IdentityRolesExperiencesSubscriptions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Notifications. |