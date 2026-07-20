# Modèle de données

**Document** : ARCHI.03

**Fichier** : 01-ARCHI.03-DataModel-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les principaux objets manipulés par la plateforme.

Le présent document ne décrit pas la base de données.

Il décrit les concepts manipulés par le domaine.

---

# Principes

Les objets sont répartis en familles.

Chaque famille possède une responsabilité métier unique.

---

# Identity

Représente une personne utilisant la plateforme.

Principaux objets :

- Identity
- Profile
- Preference
- Role
- Permission
- Session

---

# Organizations

Représente une structure.

Principaux objets :

- Organization
- OrganizationMember
- OrganizationAddress
- OrganizationSettings

---

# Catalogue

Décrit les événements connus.

Principaux objets :

- Event
- Venue
- Organizer
- Activity
- Category
- EventMedia

---

# Planning

Représente la relation entre un Explorer et les événements.

Principaux objets :

- Participation
- PlanningEntry

---

# Discovery

Décrit les informations utilisées pour produire des recommandations.

Principaux objets :

- Follow
- Recommendation
- RecommendationReason

---

# Import

Décrit l'ensemble du pipeline d'acquisition.

Principaux objets :

- ImportConnector
- ImportSource
- ImportJob
- RawEvent
- ImportedEvent
- ValidationResult
- NormalizedEvent

---

# Notifications

Décrit les communications de la plateforme.

Principaux objets :

- Notification
- NotificationPreference
- NotificationChannel
- NotificationTemplate
- NotificationDelivery

---

# Administration

Décrit le fonctionnement interne.

Principaux objets :

- Configuration
- Secret
- AuditLog
- SystemSetting

---

# Observabilité

Décrit les traitements.

Principaux objets :

- ImportStatistics
- EventLog
- Metric
- HealthCheck

---

# Relations majeures

```
Identity

│

├─────────────┐

│             │

Planning      Follow

│             │

└──────┬──────┘

↓

Event

↑

ImportedEvent

↑

NormalizedEvent

↑

RawEvent

↑

ImportJob

↑

ImportConnector

↑

ImportSource
```

---

# Responsabilités

## RawEvent

Conserver fidèlement les données d'origine.

---

## NormalizedEvent

Uniformiser les données.

---

## ImportedEvent

Créer un événement exploitable par la plateforme.

---

## Event

Objet métier central.

---

## Participation

Exprime la relation entre un utilisateur et un événement.

---

## Follow

Exprime un intérêt durable.

---

## Recommendation

Proposition générée par le moteur déterministe.

---

## Notification

Communication destinée à un utilisateur.

---

## ImportJob

Historique complet d'une acquisition.

---

# Évolutivité

L'ajout d'un nouveau fournisseur ne crée jamais de nouvel objet métier.

Seuls :

- RawEvent
- ImportConnector

peuvent être spécialisés.

---

# Documents liés

ARCHI.01

ARCHI.02

TSPEC.*

ADR.*

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première formalisation du modèle conceptuel V3. |