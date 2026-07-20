# Import — Spécification fonctionnelle

**Document** : FSPEC.Import

**Fichier** : 02-FSPEC.Import-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire la capacité d'**acquisition d'événements externes** de la V3 : un mécanisme unique qui
transforme des données hétérogènes (fichiers, pages, flux, API…) en événements exploitables par le
catalogue, de façon uniforme, traçable et rejouable.

Cette spécification met en œuvre les décisions **ADR.13** (framework de connecteurs), **ADR.14**
(pipeline d'import) et **ADR.15** (modèle Raw Event), dans le respect des principes de l'**ADR.12**.

> **Règle d'or maintenue** : aucune décision métier n'est prise par un connecteur ni par une IA. La
> classification et la validation restent déterministes (ADR.16). Les connecteurs *extraient* ; le
> pipeline *transforme* ; le domaine *décide*.

---

# Acteurs

- **Organizer** — déclenche des imports ponctuels (fichier, copier-coller, URL) pour son organisation.
- **Operator** — configure et supervise les connecteurs planifiés, surveille les imports.
- **Système** — exécute les connecteurs planifiés et les traitements différés.

---

# Canaux d'acquisition (V3)

Tous les canaux produisent des **Raw Events** et alimentent le **même pipeline**. Ils ne diffèrent
que par les phases *Discovery / Fetch / Extract*.

| Canal | Déclenchement | Extraction | IA |
|-------|---------------|------------|-----|
| **Image / PDF** | upload, glisser-déposer, copier-coller | OCR (interne Tesseract, ou IA de l'utilisateur — ADR.16) | optionnelle |
| **CSV / JSON formaté** | upload **ou** copier-coller du contenu | parsing d'un **schéma documenté** | aucune |
| **URL de fournisseur** | saisie d'une URL | capture + extraction (HTML/flux) | possible |
| **API / RSS / ICS / Discord / Tourism…** | connecteur planifié ou manuel (Operator) | selon le connecteur | selon le connecteur |

Le **canal CSV / JSON est 100 % déterministe** (ni OCR ni IA) et constitue le connecteur de
référence. Le schéma d'échange est documenté (FSPEC.Import — annexe *Schéma CSV/JSON*, à compléter).

---

# Le pipeline d'import (vue fonctionnelle)

Chaque import suit exactement les mêmes étapes (ADR.14). Chaque étape a une responsabilité unique et
ignore les suivantes.

1. **Discovery** — identifier la source à traiter (URL, fichier, connecteur planifié, message…).
2. **Fetch** — récupérer les données depuis la source, fidèlement, sans interprétation.
3. **Extract** — produire une collection de **Raw Events** (parsing, OCR, décodage…).
4. **Raw Event** — représentation fidèle et **immuable** des données de la source (ADR.15).
5. **Validate** — vérifier la cohérence minimale (identifiant, titre, structure) ; **rejeter** les
   invalides ; aucune correction.
6. **Normalize** — harmoniser vers le modèle commun (dates, adresses, catégories, médias, URLs…)
   sans interprétation métier.
7. **Deduplicate** — rapprocher d'un événement connu → **création**, **mise à jour** ou **rejet du
   doublon** (mêmes règles pour tous les imports).
8. **Persist** — enregistrer ; **conserver les données brutes** ; historiser l'import ; mettre à jour
   les statistiques.
9. **Publish Events** — publier des événements métier (`ImportCompleted`, `EventCreated`,
   `EventUpdated`, `ImportFailed`) sur l'Event Bus.
10. **Notify** — les notifications sont déclenchées par ces événements (moteur de notifications —
    ADR.17) ; le pipeline ne décide jamais qui/quand/comment notifier.

---

# Règles fonctionnelles

## RG-IMP-01 — Séparation extraction / décision

Un connecteur ne réalise **jamais** validation, normalisation, déduplication, persistance ni
recommandation. Ces traitements appartiennent au pipeline commun.

## RG-IMP-02 — Conservation des données brutes

Toute donnée fournie par la source est conservée dans le Raw Event, même inutilisée aujourd'hui. Un
Raw Event est **immuable** ; les transformations opèrent sur des copies logiques.

## RG-IMP-03 — Rejouabilité

Un import peut être **rejoué à partir des Raw Events conservés**, sans solliciter à nouveau le
fournisseur (utile pour améliorer un mapping ou après correction d'une règle).

## RG-IMP-04 — Traçabilité

Chaque Raw Event reste associé à son fournisseur, son ImportJob, sa date d'acquisition et la version
du connecteur. L'origine de toute donnée métier est explicable.

## RG-IMP-05 — Déterminisme

À données d'entrée identiques, le pipeline produit toujours le même résultat.

## RG-IMP-06 — Résultat d'un import et validation humaine

La déduplication conduit à créer/mettre à jour un événement ou à rejeter un doublon. Le **niveau de
confiance de la source** détermine si le résultat est :
- un **EventCandidate** à valider par l'utilisateur (héritage V2 — sources à faible confiance :
  OCR image, capture URL) ; ou
- un **Event** directement publié (sources structurées et fiables : CSV/JSON, API de confiance).

Ce niveau de confiance est **configurable par connecteur / par source** (paramètre d'administration).
La validation manuelle reste toujours disponible.

## RG-IMP-07 — Isolation des connecteurs

Les connecteurs sont indépendants et n'échangent jamais entre eux. La défaillance d'un fournisseur
n'impacte pas les autres imports.

---

# États d'un import (ImportJob)

Un import est matérialisé par un **ImportJob** qui journalise sa progression dans le pipeline.

```
DISCOVERING → FETCHING → EXTRACTING → VALIDATING → NORMALIZING
           → DEDUPLICATING → PERSISTING → COMPLETED
toute étape → FAILED
```

Chaque transition est historisée (date, durée, volumes, erreurs) — base de la supervision (ADR.23).

---

# Statistiques & supervision

Chaque exécution produit : date, durée, nombre d'objets lus, nombre de Raw Events produits, créés /
mis à jour / doublons / rejetés, erreurs, avertissements. Ces informations alimentent la supervision
Operator (écrans `OPE-006 Monitoring`, `OPE-007 Journaux`) et complètent les statistiques d'import de
la V2.

---

# Parcours

- **Organizer — import ponctuel** : choisir un canal → fournir la source (fichier / coller / URL) →
  suivre l'ImportJob → (si EventCandidates) valider/corriger → événements au catalogue.
- **Operator — connecteur planifié** : configurer le connecteur (source, auth, fréquence, confiance)
  → exécutions automatiques → supervision → rejouer si besoin.

(Détail des écrans : UISPEC.Import.)

---

# Hors périmètre (V3)

- Marketplace de connecteurs / connecteurs tiers en plugins (Backlog V4).
- Synchronisation bidirectionnelle et export (ICS, Google, Outlook) (Backlog V4).

---

# Documents liés

99-ADR.13-ImportConnectorFramework · 99-ADR.14-ImportPipeline · 99-ADR.15-RawEventModel ·
99-ADR.16-AIBoundaries · 99-ADR.17-NotificationFramework · 03-TSPEC.Import-v3.0 · 04-UISPEC.Import-v3.0 ·
01-ARCHI.01-Domain-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de l'import unifié (framework, pipeline, Raw Event). |
