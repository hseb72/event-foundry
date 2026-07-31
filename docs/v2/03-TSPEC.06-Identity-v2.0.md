# Identity

**Document** : TSPEC.06

**Fichier** : 03-TSPEC.06-Identity-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Identity**.

Identity est responsable de l'identité des utilisateurs, de leurs rôles, de leurs permissions, de leurs expériences actives et de leurs abonnements.

Il constitue le point d'entrée de toutes les opérations nécessitant une authentification ou une autorisation.

---

# Responsabilités

Le domaine Identity est responsable de :

- gérer les identités ;
- authentifier les utilisateurs ;
- gérer les rôles ;
- gérer les permissions ;
- gérer l'expérience active ;
- gérer les abonnements ;
- exposer les informations d'identité aux autres domaines.

Identity n'est pas responsable :

- des événements ;
- des publications ;
- des recommandations ;
- du planning ;
- des notifications.

---

# Position dans l'architecture

```text
                    Identity
                  ┌────┼────┐
                  ▼    ▼    ▼
              Explorer Organizer Operator
                  │
                  ▼
          Tous les domaines métier
```

Tous les domaines utilisent Identity.

Identity ne dépend d'aucun domaine métier.

---

# Structure du module

```text
Identity

├── Domain
│   ├── Aggregates
│   ├── Entities
│   ├── ValueObjects
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
│   ├── Authentication
│   ├── Authorization
│   ├── Persistence
│   └── Messaging
│
└── API
```

---

# Modèle métier

Le domaine est construit autour de l'agrégat :

```text
Identity
```

```text
Identity

├── Profile
├── Roles
├── Permissions
├── ActiveExperience
├── Subscriptions
└── Preferences
```

Les responsabilités sont clairement séparées.

---

# Concepts fondamentaux

## Identity

Représente une personne utilisant la plateforme.

Une identité est unique.

---

## Role

Détermine les responsabilités de l'utilisateur.

Exemples :

- Explorer
- Organizer
- Operator

Une identité peut posséder plusieurs rôles.

---

## Permission

Autorisation d'exécuter une action.

Les permissions sont accordées par les rôles.

Aucun domaine ne définit ses propres permissions.

---

## Experience

Détermine l'interface actuellement utilisée.

Une seule expérience est active à un instant donné.

Le changement d'expérience :

- ne modifie pas les permissions ;
- ne modifie pas les rôles ;
- ne nécessite pas de nouvelle authentification.

---

## Subscription

Détermine les fonctionnalités accessibles selon l'offre souscrite.

Un abonnement ne modifie jamais les rôles.

---

# Interfaces publiques (Ports)

## IdentityQueryService

Permet notamment :

- obtenir une identité ;
- obtenir les rôles ;
- obtenir les permissions ;
- obtenir l'expérience active ;
- obtenir les abonnements.

---

## IdentityCommandService

Permet notamment :

- modifier le profil ;
- changer l'expérience active ;
- gérer les abonnements ;
- gérer les rôles.

---

## AuthenticationService

Responsable de :

- authentifier ;
- ouvrir une session ;
- fermer une session.

---

## AuthorizationService

Responsable de :

- vérifier les permissions ;
- contrôler les accès.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Authenticate User
- Logout User
- Get Profile
- Update Profile
- Change Active Experience
- Assign Role
- Revoke Role
- Check Permission
- Get Active Subscription

---

# Flux principaux

## Authentification

```text
Utilisateur

↓

Authentication

↓

Identity

↓

Session ouverte
```

---

## Changement d'expérience

```text
Utilisateur

↓

Identity

↓

ExperienceChanged

↓

Nouvelle navigation
```

Aucune ré-authentification n'est réalisée.

---

## Contrôle d'accès

```text
Application

↓

Authorization

↓

Permission Granted
```

ou

```text
Permission Denied
```

---

# Événements du domaine

Le domaine publie notamment :

```text
IdentityCreated

ProfileUpdated

RoleAssigned

RoleRevoked

ExperienceChanged

SubscriptionChanged
```

---

# Dépendances techniques

Le domaine dépend uniquement de :

```text
Authentication Provider

Persistence

Messaging
```

Aucune dépendance vers un domaine métier.

Identity constitue une fondation de la plateforme.

---

# Gestion des données

Identity est propriétaire :

- des profils ;
- des rôles ;
- des permissions ;
- des expériences ;
- des abonnements.

Les autres domaines consomment ces informations via les interfaces publiques.

---

# Sécurité

Le domaine applique les principes suivants.

- authentification centralisée ;
- autorisation centralisée ;
- contrôle systématique des permissions ;
- traçabilité des changements de rôles ;
- traçabilité des changements d'abonnement.

---

# Performance

Le domaine est optimisé pour :

- les lectures fréquentes ;
- les contrôles d'autorisation ;
- les changements d'expérience rapides.

Les contrôles d'accès doivent avoir un impact minimal sur les performances globales.

---

# Observabilité

Le domaine expose notamment :

- connexions ;
- déconnexions ;
- changements d'expérience ;
- changements de rôles ;
- erreurs d'authentification ;
- refus d'autorisation.

Toutes les opérations sensibles sont journalisées.

---

# Contraintes

Identity respecte les principes suivants.

- une identité est unique ;
- les rôles sont indépendants des expériences ;
- les permissions sont accordées par les rôles ;
- une seule expérience est active ;
- un abonnement ne modifie jamais les permissions ;
- les domaines métier restent indépendants du mécanisme d'authentification.

Toute évolution de ces principes nécessite un ADR.

---

# Évolutions

La V3 pourra intégrer :

- fédération d'identité ;
- authentification sans mot de passe ;
- authentification multifacteur ;
- délégation d'administration ;
- gestion avancée des organisations.

Ces évolutions ne remettent pas en cause le modèle fondamental Identity → Roles → Permissions → Experiences → Subscriptions.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

02-FSPEC.10-ProfilesAndPermissions-v2.0

99-ADR.08-RoleBasedAccessControl-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

99-ADR.11-IdentityRolesExperiencesSubscriptions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Identity. |