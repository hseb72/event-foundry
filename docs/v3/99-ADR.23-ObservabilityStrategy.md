# ADR.23 – Observability Strategy

**Document** : ADR.23

**Fichier** : 99-ADR.23-ObservabilityStrategy.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

EventFoundry est une plateforme distribuée composée de nombreux composants collaborant entre eux.

Parmi eux :

- API ;
- connecteurs d'import ;
- pipeline d'import ;
- fournisseurs IA ;
- moteur de notifications ;
- moteur de recommandations ;
- traitements asynchrones.

Le bon fonctionnement de la plateforme nécessite une vision globale de son état.

La plateforme doit être observable sans dépendre des journaux applicatifs.

---

# Problème

Lorsqu'un incident survient, plusieurs questions doivent pouvoir être résolues rapidement.

Par exemple :

- Que s'est-il passé ?
- Quel composant est concerné ?
- Depuis quand ?
- Quel utilisateur est impacté ?
- Quelle organisation est concernée ?
- Quelle opération a échoué ?
- Quel fournisseur externe est impliqué ?

Sans stratégie commune, chaque module produirait ses propres informations avec des formats différents.

Le diagnostic deviendrait complexe et coûteux.

---

# Décision

Tous les composants produisent des informations d'observabilité selon une stratégie commune.

Cette stratégie repose sur quatre piliers :

- logs ;
- métriques ;
- traces distribuées ;
- événements opérationnels.

Chaque composant applique les mêmes conventions.

---

# Objectifs

La stratégie poursuit plusieurs objectifs.

## Diagnostiquer

Identifier rapidement l'origine d'un dysfonctionnement.

---

## Superviser

Mesurer l'état de santé de la plateforme.

---

## Comprendre

Visualiser le parcours complet d'une opération à travers plusieurs composants.

---

## Mesurer

Suivre les performances et la qualité de service.

---

## Anticiper

Détecter les anomalies avant qu'elles n'affectent les utilisateurs.

---

# Logs

Les journaux doivent fournir un historique détaillé des opérations.

Ils doivent être :

- structurés ;
- horodatés ;
- corrélables ;
- exploitables automatiquement.

Les informations sensibles ne sont jamais enregistrées.

---

# Métriques

Chaque composant publie des métriques techniques et fonctionnelles.

Exemples :

- nombre d'événements importés ;
- temps moyen de traitement ;
- taux d'erreur ;
- files d'attente ;
- notifications envoyées ;
- appels IA ;
- appels API.

Les métriques servent au suivi continu de la plateforme.

---

# Traces distribuées

Les traitements traversant plusieurs composants utilisent un identifiant de corrélation commun.

Une même opération peut ainsi être suivie de bout en bout.

Exemple :

```
API

↓

Import Pipeline

↓

Connector

↓

AI Provider

↓

Normalizer

↓

Database

↓

Notification Framework
```

Cette traçabilité facilite l'analyse des traitements complexes.

---

# Événements opérationnels

Les composants publient des événements représentant leur activité.

Par exemple :

- ImportStarted ;
- ImportCompleted ;
- AIRequestCompleted ;
- NotificationSent ;
- SecretRotationCompleted.

Ces événements peuvent alimenter des tableaux de bord ou déclencher des alertes.

Ils restent distincts des événements métier.

---

# Corrélation

Chaque opération importante possède un identifiant unique.

Cet identifiant est propagé entre les composants afin de relier :

- les logs ;
- les métriques ;
- les traces ;
- les événements.

La corrélation constitue le fondement de l'observabilité distribuée.

---

# Alertes

Les alertes sont définies à partir des métriques et des événements.

Quelques exemples :

- taux d'erreur élevé ;
- temps de réponse anormal ;
- connecteur indisponible ;
- fournisseur IA inaccessible ;
- rotation de secret en échec ;
- saturation d'une file d'attente.

Les règles d'alerte sont indépendantes du code métier.

---

# Standards

Les composants adoptent des conventions communes concernant :

- les formats de logs ;
- les noms des métriques ;
- les identifiants de corrélation ;
- les niveaux de gravité ;
- les événements opérationnels.

Cette homogénéité facilite l'exploitation de la plateforme.

---

# Technologies

L'architecture reste indépendante des outils utilisés.

Elle doit pouvoir s'intégrer avec des solutions telles que :

- OpenTelemetry ;
- Prometheus ;
- Grafana ;
- Loki ;
- Tempo ;
- Jaeger.

Le choix des technologies relève de l'infrastructure.

---

# Sécurité

Les données d'observabilité ne doivent jamais contenir :

- secrets ;
- mots de passe ;
- jetons ;
- données personnelles non nécessaires.

Les informations collectées respectent les règles de confidentialité de la plateforme.

---

# Conséquences

Cette décision implique que :

- tous les composants appliquent les mêmes conventions d'observabilité ;
- les incidents sont plus faciles à diagnostiquer ;
- les traitements distribués deviennent traçables ;
- les tableaux de bord et alertes reposent sur un modèle commun.

L'observabilité devient une capacité native de la plateforme.

---

# Alternatives étudiées

## Observabilité propre à chaque module

Chaque composant produit ses propres logs et métriques.

Cette approche entraîne une forte hétérogénéité et complique les diagnostics.

Cette solution est rejetée.

---

## Stratégie unifiée

Tous les composants appliquent les mêmes conventions et publient des données compatibles.

Cette approche facilite la supervision, le diagnostic et les évolutions futures.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

03-TSPEC.Infrastructure.*

03-TSPEC.Logging.*

03-TSPEC.Monitoring.*

03-TSPEC.Connectors.*

03-TSPEC.Notification.*

99-ADR.*

---

# Documents liés

ADR.12 – Platform Architecture Principles

ADR.13 – Import Connector Framework

ADR.14 – Import Pipeline

ADR.16 – AI Boundaries

ADR.17 – Notification Framework

ADR.21 – Secrets Management

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Définition de la stratégie d'observabilité unifiée de la plateforme. |