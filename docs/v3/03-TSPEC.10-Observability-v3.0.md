# Observabilité & supervision — Spécification technique

**Document** : TSPEC.10

**Fichier** : 03-TSPEC.10-Observability-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique de l'observabilité (ADR.23) : instrumentation commune (logs, métriques,
traces, événements opérationnels), propagation du `correlationId`, collecte, et exposition aux écrans de
supervision Operator (`OPE-006`, `OPE-007`). Reste **indépendante des outils** d'infrastructure.

---

# Position

Capacité **transverse** : une **librairie partagée** (`shared/libraries/observability`) fournit les
conventions et helpers ; chaque composant (backend, workers) l'utilise. Les backends d'infrastructure
(collecteurs, stockage, visualisation) sont branchés via des standards ouverts (OpenTelemetry),
**sans dépendance applicative** à un outil précis.

---

# Instrumentation commune

## Logs structurés

- Format JSON : `timestamp` (UTC), `level`, `component`, `correlationId`, `message`, contexte
  (orgId/userId **si nécessaire et non sensible**), `operationalEvent?`.
- **Filtre de rédaction** obligatoire : champs sensibles (clés, tokens, mots de passe) **masqués**
  avant écriture (RG-OBS-03 / RG-SEC-01).

## Métriques

- Nommage conventionné (`ef_<domaine>_<mesure>_<unité>`), type (compteur/jauge/histogramme).
- Exemples : `ef_import_events_total`, `ef_import_stage_duration_ms`, `ef_queue_depth`,
  `ef_notifications_sent_total`, `ef_ai_calls_total`, `ef_http_request_duration_ms`.

## Traces distribuées

- **OpenTelemetry** : un **span** par étape ; le `correlationId` est porté comme attribut/trace-id
  propagé API → BullMQ → workers → appels externes (IA, SMTP) → DB.
- Reconstruit le **parcours complet** d'une opération (ADR.23 §Traces).

## Événements opérationnels

```ts
interface OperationalEvent {
  name: string;            // ImportStarted | ImportCompleted | AIRequestCompleted | NotificationSent | SecretRotationCompleted
  component: string;
  correlationId: string;
  occurredAt: string;      // ISO 8601 UTC
  attributes: Record<string, JsonValue>; // non sensibles
}
```

- Publiés sur un canal dédié (distinct des **événements métier** de l'Event Bus — RG-OBS-04) ;
  alimentent tableaux de bord et alertes.

---

# Propagation du correlationId

- Généré à l'entrée API (ou hérité d'un en-tête entrant), injecté dans un **contexte de requête**
  (AsyncLocalStorage), ajouté à chaque **Job BullMQ**, relu par les workers, attaché à tous les logs,
  spans, métriques (dimension) et événements opérationnels. Prolonge le mécanisme V2.

---

# Collecte & stockage

- **Export OpenTelemetry** (OTLP) vers un collecteur ; de là vers les backends choisis par
  l'infrastructure (Prometheus/Grafana pour métriques, Loki pour logs, Tempo/Jaeger pour traces).
- L'application **n'écrit pas** directement dans ces outils : elle **émet** selon les standards
  (indépendance — RG-OBS-06).
- Les **données fonctionnelles** de supervision persistées par les domaines (`import_job_events`,
  `delivery_logs`, `ai_call_logs`, `secret_access_logs`) restent en base et alimentent les écrans
  Operator (jointes par `correlationId`).

---

# Exposition aux écrans Operator

| Écran | Source |
|-------|--------|
| `OPE-006 Monitoring` | métriques (Prometheus), health checks, profondeur des files (BullMQ), alertes actives |
| `OPE-007 Journaux` | logs (Loki) + événements opérationnels + traces (Tempo/Jaeger) par `correlationId` |

- API Operator de lecture (`/admin/observability/*`) agrège santé et statistiques fonctionnelles ;
  aucune donnée sensible renvoyée (RG-OBS-03).

---

# Alertes

- Règles définies **hors code métier** (config des backends) : taux d'erreur élevé, latence anormale,
  connecteur/IA inaccessible, rotation de secret en échec, file saturée (RG-OBS-05).
- Les événements opérationnels et métriques en sont la source.

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Logs structurés + `correlationId` + health checks | conservés ; unifiés en librairie partagée |
| Tableau de bord de supervision partiel | complété par `OPE-006`/`OPE-007` |
| — | traces OTel, événements opérationnels, alertes hors code métier |

---

# Contraintes

- Conventions communes à tous les composants ; corrélation systématique ; aucune donnée sensible ;
  événements opérationnels distincts du métier ; indépendance vis-à-vis des outils (OTel) ; filtre de
  rédaction des logs. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.23-ObservabilityStrategy · 99-ADR.12/13/14/16/17/21 · 02-FSPEC.10-Observability-v3.0 ·
04-UISPEC.10-Observability-v3.0 · 03-TSPEC.01-Import-v3.0 · 03-TSPEC.04-Notification-v3.0 ·
shared/libraries

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique de l'observabilité (instrumentation commune, corrélation, collecte OTel, écrans Operator). |
