# Import — Spécification technique

**Document** : TSPEC.01

**Fichier** : 03-TSPEC.01-Import-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique de l'import unifié : **framework de connecteurs** (ADR.13),
**pipeline** (ADR.14) et **modèle Raw Event** (ADR.15). Prolonge l'implémentation V2 (BullMQ,
`ImportJob`, `EventCandidate`, MinIO, classifier déterministe) sans la renier.

---

# Position & modules

Domaine `import` (module NestJS), Prisma confiné aux Repositories (ADR.02). Découplage via l'Event
Bus (ADR.12 §5). Les traitements longs s'exécutent sur des workers BullMQ stateless et répliquables.

```
import/
  connectors/        implémentations par fournisseur (petites, sans logique métier)
  pipeline/          étapes (Validate, Normalize, Deduplicate, Persist)
  repositories/      RawEvent, ImportJob, ImportSource (Prisma)
  services/          orchestration du pipeline, publication d'événements
  controllers/       API import (Organizer / Operator)
  dto/ · mappers/ · interfaces/
```

---

# Interface connecteur (port)

Tous les connecteurs implémentent la même interface. Un nouveau fournisseur = **un nouveau provider**,
aucune modification du cœur (ADR.13).

```ts
interface ImportConnector {
  readonly providerId: string;                 // identifiant unique du fournisseur
  readonly version: string;                     // version du connecteur (traçabilité Raw Event)
  describe(): ConnectorDescriptor;              // capacités, paramètres de config attendus
  checkAvailability(cfg: ConnectorConfig): Promise<AvailabilityResult>;
  discover(cfg: ConnectorConfig): Promise<SourceRef[]>;   // Discovery
  fetch(source: SourceRef, cfg: ConnectorConfig): Promise<FetchedPayload>; // Fetch
  extract(payload: FetchedPayload): Promise<RawEvent[]>;  // Extract → Raw Events
}
```

- Le connecteur ne produit **que** des Raw Events ; il n'accède jamais au domaine métier.
- Enregistrement via un **registry** (token d'injection `IMPORT_CONNECTORS`) ; résolution par
  `providerId`.
- La **configuration** (URL, auth, timeout, fréquence, paramètres, niveau de confiance) est stockée en
  base (`ImportSource`) et **séparée du code** (modifiable sans redéploiement — ADR.13). Les secrets
  (clés, tokens) sont des **références logiques** résolues par le Secrets Management (ADR.21) ; jamais
  en clair en base.

---

# Contrat Raw Event (shared/contracts)

Le Raw Event est le **contrat officiel** connecteur ↔ pipeline (ADR.15). Immuable, conservé, tracé.

```ts
interface RawEvent {
  id: string;                    // UUID plateforme
  importJobId: string;
  providerId: string;
  providerKey: string | null;    // identifiant natif chez le fournisseur (clé de rapprochement)
  connectorVersion: string;
  acquiredAt: string;            // ISO 8601 UTC
  payload: JsonValue;            // représentation FIDÈLE des données source (aucune normalisation)
  mediaRefs: string[];           // clés MinIO des médias/documents source
  correlationId: string;
}
```

- **Immutabilité** : jamais modifié après création (RG-IMP-02). Les étapes suivantes travaillent sur
  des projections.
- **Persistance** : table `raw_events` (JSONB `payload`), index `(providerId, providerKey)` pour le
  rapprochement et le rejeu ; fichiers source dans **MinIO** (référencés, jamais en base).

---

# Pipeline

Le pipeline orchestre des étapes à responsabilité unique (ADR.14). Répartition :

| Étape | Exécution | Nature |
|-------|-----------|--------|
| Discovery / Fetch / Extract | **worker BullMQ** (par connecteur) | I/O, potentiellement long (HTTP, OCR, IA) |
| Validate / Normalize / Deduplicate / Persist | **backend** (orchestration) | déterministe, en base |
| Publish Events / Notify | Event Bus → Notifications (ADR.17) | asynchrone |

- **Orchestration** : le backend historise chaque transition d'`ImportJob` (comme en V2) et publie le
  travail d'extraction sur une file ; le worker renvoie les Raw Events ; le backend enchaîne les
  étapes déterministes.
- **Étapes** : chaque étape implémente `PipelineStage { run(ctx): Promise<StageResult> }`, activable /
  réordonnable sans modifier les autres (ADR.14 extensibilité) — même esprit que la chaîne de règles du
  classifier (ADR.06).
- **Normalize** : seul point de passage Raw Event → modèle commun ; réutilise le **classifier
  déterministe** existant (règles + référentiels) pour les champs métier (activité/type/catégorie).
- **Deduplicate** : rapprochement par `(providerId, providerKey)` puis par signature métier (titre +
  date + lieu) ; règles communes à tous les imports.

## Canaux assistés par IA — l'IA remplit le Raw Event (ADR.16 §Frontière)

Pour les canaux dont la phase **Extract** utilise l'IA (image/PDF, page non structurée), l'IA
**produit directement un Raw Event structuré** contre un **schéma pivot d'extraction** (libellés
bruts : titre, dates en texte, libellés activité/type/lieu/prix *tels qu'écrits*, description). Elle
ne résout **jamais** un référentiel ni ne décide d'un Event.

- **Efficacité** : un seul appel IA fait `document → Raw Event structuré` ; on évite le double
  traitement « IA→texte plat, puis re-extraction déterministe ». Deux implémentations d'`Extract`
  convergent vers le **même** pipeline commun (Validate → Normalize → Deduplicate → Persist) :
  - connecteur **OCR déterministe** (Tesseract) : Extract = OCR → Raw Event `{ rawText, moteur }` ;
  - connecteur **extraction IA** : Extract = appel IA (schéma pivot) → Raw Event `{ libellés bruts }`.
- **Rejouabilité / coût** : le Raw Event (sortie IA) est conservé et tracé (version de connecteur,
  version de prompt). Le **rejeu** ré-exécute Normalize→Persist **sans rappeler l'IA** (RG-IMP-03).
- **Déterminisme** : la résolution libellé → référentiel (Normalize, classifier) et la déduplication
  restent déterministes ; un libellé non reconnu part en validation humaine, jamais inventé.

---

# Persistance

- `import_sources` — un fournisseur configuré (providerId, config, niveau de confiance, actif).
- `import_jobs` — une exécution : source, statut (états FSPEC), volumes, horodatages ; **généralise**
  l'`ImportJob` V2.
- `import_job_events` — journal des transitions (audit, stats) — réutilisé de la V2.
- `raw_events` — Raw Events conservés (rejeu, diagnostic, audit) ; durée pilotée par la politique
  d'archivage.
- Sortie du pipeline : `EventCandidate` (validation humaine) **ou** `Event` publié, selon le niveau de
  confiance de la source (RG-IMP-06). Les entités V2 (`EventCandidate`, `Event`) sont réutilisées.

---

# Rejeu & idempotence

- **Rejeu** : re-exécuter Validate→Persist à partir des `raw_events` stockés d'un `ImportJob`, sans
  Fetch/Extract (RG-IMP-03).
- **Idempotence** : le rapprochement `(providerId, providerKey)` garantit qu'un même objet source ne
  crée pas de doublon entre deux exécutions.

---

# Observabilité

Chaque étape émet logs structurés, métriques et un `ImportJobEvent` ; `correlationId` propagé
API → BullMQ → workers → logs (ADR.23). Métriques : volumes lus/produits/créés/màj/doublons/rejetés,
durées par étape, taux d'erreur par connecteur.

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Pipeline OCR + classification figé | Cas particulier du framework : connecteur **Image/PDF** (Extract = OCR) + Normalize (classifier) |
| `ImportJob` (statuts OCR_*) | `ImportJob` généralisé (statuts pipeline) |
| `Attachment` (fichier source) | `mediaRefs` du Raw Event (MinIO) |
| `EventCandidate` | conservé (validation humaine, sources à faible confiance) |
| Files `OCR_QUEUE` / `CLASSIFICATION_QUEUE` | files par connecteur / par étape longue |

---

# Contraintes

- Connecteurs sans logique métier ; pipeline unique ; Raw Event immuable et conservé ; imports
  rejouables ; déterminisme des étapes de décision. Toute exception = nouvel ADR.

---

# Documents liés

99-ADR.13/14/15/16/21/23 · 02-FSPEC.01-Import-v3.0 · 04-UISPEC.01-Import-v3.0 · 01-ARCHI.02/03/04-v3.0 ·
(V2) 03-TSPEC.03-ImportPipeline · shared/contracts

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique du framework d'import, du pipeline et du Raw Event. |
