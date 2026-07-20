# ADR.16 – Notification Framework

**Document** : ADR.16

**Fichier** : 99-ADR.16-NotificationFramework.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

La plateforme EventFoundry génère de nombreux événements métier susceptibles d'intéresser les utilisateurs.

Par exemple :

- un import est terminé ;
- un nouvel événement correspondant aux centres d'intérêt est découvert ;
- une inscription est confirmée ;
- une activité est annulée ;
- un organisateur publie un nouvel événement.

Ces informations peuvent être communiquées selon différents canaux.

La plateforme doit disposer d'un mécanisme unique, cohérent et extensible pour gérer l'ensemble des notifications.

---

# Problème

Les besoins de notification sont nombreux et évolutifs.

Ils dépendent notamment :

- du type d'utilisateur ;
- du contexte ;
- des préférences personnelles ;
- du canal de communication ;
- de la criticité de l'information.

Si chaque module envoie directement ses propres notifications :

- les traitements deviennent fortement couplés ;
- les règles sont dupliquées ;
- les préférences utilisateurs sont difficiles à respecter ;
- l'ajout d'un nouveau canal nécessite de modifier plusieurs composants.

Une architecture centralisée est nécessaire.

---

# Décision

Toutes les notifications transitent par un **Notification Framework** unique.

Le domaine métier ne communique jamais directement avec un canal de diffusion.

Il publie uniquement un événement métier.

Le Notification Framework décide ensuite :

- s'il convient de notifier ;
- quels utilisateurs sont concernés ;
- quels canaux doivent être utilisés ;
- à quel moment envoyer la notification.

---

# Architecture

Le mécanisme repose sur une architecture orientée événements.

```
Domain Event

↓

Notification Framework

↓

Notification Policy

↓

Channel Router

↓

Delivery Provider

↓

Utilisateur
```

Chaque composant possède une responsabilité clairement définie.

---

# Domain Events

Les composants métier publient uniquement des événements.

Exemples :

- EventCreated
- EventUpdated
- RegistrationConfirmed
- ImportCompleted
- ImportFailed
- RecommendationGenerated

Ils ne connaissent jamais les mécanismes de diffusion.

---

# Notification Policy

Cette étape applique les règles métier.

Elle détermine notamment :

- si une notification est nécessaire ;
- les destinataires concernés ;
- le niveau de priorité ;
- le type de message.

Cette décision reste entièrement déterministe.

---

# Channel Router

Le routeur sélectionne les canaux adaptés.

Cette sélection dépend :

- des préférences utilisateur ;
- des capacités de la plateforme ;
- des règles d'organisation ;
- de la criticité de la notification.

---

# Delivery Providers

Chaque canal est implémenté indépendamment.

Le framework doit permettre d'utiliser notamment :

- In-App ;
- Email ;
- Push Mobile ;
- Web Push ;
- SMS (future évolution) ;
- Webhook (future évolution).

L'ajout d'un nouveau canal ne modifie pas le domaine métier.

---

# Préférences utilisateur

Chaque utilisateur peut définir ses préférences.

Par exemple :

- canal préféré ;
- fréquence ;
- catégories souhaitées ;
- notifications silencieuses ;
- désactivation de certains événements.

Ces préférences sont centralisées dans le modèle User Preferences.

---

# Priorité

Chaque notification possède un niveau de priorité.

Par exemple :

## Information

Simple information.

Peut être différée.

---

## Important

Action recommandée.

Envoi rapide.

---

## Critique

Information nécessitant une diffusion immédiate.

---

# Regroupement

Le framework peut regrouper plusieurs notifications similaires.

Exemples :

- cinq nouveaux événements découverts ;
- plusieurs imports terminés ;
- plusieurs recommandations générées.

Ce regroupement améliore l'expérience utilisateur.

---

# Historisation

Toutes les notifications produites sont historisées.

Cette historisation permet :

- l'audit ;
- le rejeu éventuel ;
- la consultation de l'historique utilisateur ;
- les statistiques d'utilisation.

---

# Observabilité

Chaque notification produit des métriques.

Par exemple :

- génération ;
- routage ;
- envoi ;
- délai ;
- succès ;
- échec.

Ces informations alimentent les outils d'observabilité de la plateforme.

---

# Principes

Le Notification Framework respecte les principes suivants.

## Découplage

Le domaine métier ignore totalement les mécanismes de diffusion.

---

## Extensibilité

Un nouveau canal peut être ajouté sans modifier les traitements métier.

---

## Déterminisme

La décision de notifier repose uniquement sur les règles métier et les préférences configurées.

---

## Personnalisation

Chaque utilisateur maîtrise la manière dont il souhaite être informé.

---

## Traçabilité

Toute notification est traçable depuis son événement métier d'origine.

---

# Conséquences

Cette décision implique que :

- les notifications deviennent un composant transverse de la plateforme ;
- les modules métier restent indépendants des canaux de communication ;
- les préférences utilisateur sont appliquées de manière uniforme ;
- l'ajout de nouveaux canaux devient une évolution purement technique.

Le Notification Framework devient le point d'entrée unique pour toute communication sortante vers les utilisateurs.

---

# Alternatives étudiées

## Notifications directement dans chaque module

Chaque module décide quand et comment notifier.

Cette approche paraît simple au départ mais conduit rapidement à une duplication des règles, à un fort couplage et à une évolution difficile.

Cette solution est rejetée.

---

## Framework centralisé

Les modules publient uniquement des événements métier.

Le Notification Framework applique les politiques de diffusion et gère les différents canaux.

Cette solution garantit la cohérence, l'extensibilité et le respect des préférences utilisateur.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.Notification.*

02-FSPEC.User.*

03-TSPEC.Notification.*

03-TSPEC.Communication.*

04-UISPEC.*

99-ADR.*

---

# Documents liés

ADR.11 – Platform Architecture Principles

ADR.15 – AI Boundaries

ADR.20 – User Preferences

ADR.22 – Observability Strategy

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction d'un framework unifié de gestion des notifications et des canaux de diffusion. |