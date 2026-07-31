# Observabilité & supervision — Spécification fonctionnelle

**Document** : FSPEC.10

**Fichier** : 02-FSPEC.10-Observability-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire la capacité d'**observabilité** de la plateforme et les écrans de **supervision Operator** :
une stratégie commune (logs, métriques, traces, événements opérationnels) permettant de diagnostiquer,
superviser, comprendre, mesurer et anticiper. Complète le tableau de bord de supervision V2.

Met en œuvre **ADR.23** (Observability Strategy), en lien avec l'ensemble des domaines (import, IA,
notifications, secrets…). Répond au chantier §1/§2 (écrans `OPE-006 Monitoring`, `OPE-007 Journaux`).

> **Sécurité** : les données d'observabilité ne contiennent **jamais** de secrets, mots de passe,
> jetons ni données personnelles non nécessaires (ADR.23 §Sécurité, cohérent avec ADR.21).

---

# Quatre piliers (ADR.23)

| Pilier | Rôle | Exemples |
|--------|------|----------|
| **Logs** | historique détaillé, structuré, corrélable | opérations, erreurs, avertissements |
| **Métriques** | état de santé continu | événements importés, temps de traitement, taux d'erreur, files, notifications envoyées, appels IA/API |
| **Traces distribuées** | parcours d'une opération de bout en bout | API → pipeline → connecteur → IA → normalizer → DB → notifications |
| **Événements opérationnels** | activité des composants (distincts des événements métier) | `ImportStarted`, `ImportCompleted`, `AIRequestCompleted`, `NotificationSent`, `SecretRotationCompleted` |

---

# Corrélation

Chaque opération importante possède un **identifiant de corrélation** unique, **propagé** entre les
composants (API → BullMQ → workers → logs), reliant logs, métriques, traces et événements. C'est le
**fondement** de l'observabilité distribuée (déjà amorcé en V2 : `correlationId`).

---

# Écrans de supervision Operator

## OPE-006 — Monitoring

Vue d'ensemble de la **santé** : santé des composants (API, workers, connecteurs, IA, mail), métriques
clés (débits, latences, taux d'erreur), état des **files** (BullMQ), volumétrie d'imports et de
notifications, alertes actives.

## OPE-007 — Journaux

Consultation des **journaux structurés** et des **événements opérationnels**, filtrables par composant,
gravité, période, **correlationId**, organisation, utilisateur — sans exposer d'information sensible.
Accès au **parcours complet** (trace) d'une opération à partir d'un `correlationId`.

---

# Règles fonctionnelles

## RG-OBS-01 — Conventions communes

Tous les composants appliquent les **mêmes conventions** : format de logs, noms de métriques,
identifiants de corrélation, niveaux de gravité, événements opérationnels (ADR.23 §Standards).

## RG-OBS-02 — Corrélation systématique

Toute opération importante porte un `correlationId` propagé de bout en bout ; logs/métriques/traces/
événements sont reliables par cet identifiant.

## RG-OBS-03 — Aucune donnée sensible

Les données d'observabilité ne contiennent jamais de secret ni de donnée personnelle non nécessaire.
Un filtre de rédaction s'applique (défense en profondeur, cohérent RG-SEC-01).

## RG-OBS-04 — Événements opérationnels distincts du métier

Les événements opérationnels (`ImportStarted`…) sont **distincts** des événements métier (`EventCreated`
…) ; ils alimentent tableaux de bord et alertes, sans se substituer aux événements de domaine.

## RG-OBS-05 — Alertes indépendantes du code métier

Les règles d'alerte (taux d'erreur, latence, connecteur/IA indisponible, rotation de secret en échec,
file saturée) sont définies **hors du code métier** (ADR.23 §Alertes).

## RG-OBS-06 — Indépendance technologique

L'architecture reste indépendante des outils (OpenTelemetry, Prometheus, Grafana, Loki, Tempo,
Jaeger…) — choix d'infrastructure (ADR.23 §Technologies).

---

# Statistiques fonctionnelles

Au-delà de la technique, la supervision agrège des **statistiques** : imports (volumes, créés/màj/
doublons/rejetés, durées par étape — FSPEC.01), notifications envoyées par canal (FSPEC.04), appels IA
par cas/fournisseur (FSPEC.07), suivis (FSPEC.06, anonymisé). Ces statistiques éclairent l'exploitation
et les décisions produit.

---

# Correspondance avec la V2

- La V2 fournit déjà des **logs structurés**, un **`correlationId`**, des **health checks** et un
  **tableau de bord de supervision** partiel. La V3 **unifie** la stratégie (4 piliers, conventions
  communes, événements opérationnels) et **ajoute** les écrans `OPE-006`/`OPE-007`.

---

# Parcours

- **Diagnostiquer un incident** : Operator part d'une alerte ou d'un `correlationId` → journaux/trace →
  identifie composant, organisation, opération, fournisseur impliqué.
- **Superviser** : Operator suit la santé et les débits en continu (OPE-006).

(Détail des écrans : UISPEC.10 Observability.)

---

# Hors périmètre (V3)

- APM commercial / profils de performance avancés (exploitation, Backlog V4).
- Détection d'anomalies par IA (règle d'or n°1 — hors décision métier ; Backlog V4 si assistance).

---

# Documents liés

99-ADR.23-ObservabilityStrategy · 99-ADR.12/13/14/16/17/21 · 03-TSPEC.10-Observability-v3.0 ·
04-UISPEC.10-Observability-v3.0 · 02-FSPEC.01-Import-v3.0 · 02-FSPEC.04-Notification-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de l'observabilité et de la supervision Operator (4 piliers, corrélation, écrans OPE-006/007). |
