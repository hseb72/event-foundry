# Observabilité & supervision — Spécification d'interface

**Document** : UISPEC.10

**Fichier** : 04-UISPEC.10-Observability-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les écrans de supervision Operator `OPE-006 Monitoring` et `OPE-007 Journaux`. Met en œuvre
FSPEC.10 / TSPEC.10. Couleur Operator = violet, via **tokens**, selon l'expérience active (ADR.22).
Aucune donnée sensible n'est affichée (ADR.23 / ADR.21).

---

# Écran — OPE-006 Monitoring

**Objectif** : suivre la **santé** et les débits de la plateforme en continu.

**Contenu** :
- **Santé des composants** : API, workers (OCR/classifier/pipeline), connecteurs, IA, mail — vert /
  dégradé / rouge (health checks).
- **Métriques clés** : débit d'imports, temps de traitement par étape, taux d'erreur, latence API,
  notifications envoyées, appels IA.
- **Files** (BullMQ) : profondeur, en attente / en cours / échoués.
- **Alertes actives** : liste (gravité, composant, depuis quand), lien vers le diagnostic.

**Actions** : filtrer par période / composant · ouvrir une alerte · rebondir vers les journaux
(`OPE-007`) par `correlationId`.

**États** : sain · dégradé · incident · chargement · erreur.

---

# Écran — OPE-007 Journaux

**Objectif** : consulter journaux, événements opérationnels et traces, et **remonter le parcours** d'une
opération.

**Contenu** :
- **Recherche / filtres** : composant, gravité, période, **correlationId**, organisation, utilisateur.
- **Liste de journaux** structurés (horodatage UTC, niveau, composant, message) — champs sensibles
  **masqués**.
- **Événements opérationnels** (`ImportStarted`, `NotificationSent`…).
- **Trace** : parcours de bout en bout d'un `correlationId` (API → pipeline → connecteur → IA →
  normalizer → DB → notifications), en cascade.

**Actions** : filtrer · ouvrir une trace · copier un `correlationId` · exporter une sélection (sans
données sensibles).

**États** : résultats · vide · chargement · erreur.

---

# Statistiques fonctionnelles (intégrées)

Cartes de statistiques réutilisables : imports (créés/màj/doublons/rejetés, durées par étape),
notifications par canal, appels IA par cas/fournisseur, suivis (anonymisé) — alimentées par les données
de domaine (jointes par `correlationId`).

---

# Composants

Cartes de santé · graphiques de métriques · jauges de files · liste d'alertes · recherche de journaux ·
visionneuse de trace en cascade · cartes de statistiques.

Tokens de design uniquement (jamais de couleur en dur) ; couleur Operator = violet selon l'expérience
active (ADR.22).

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.10-Observability-v3.0 · 03-TSPEC.10-Observability-v3.0 · 04-UISPEC.01-Import-v3.0 ·
04-UISPEC.04-Notification-v3.0 · 99-ADR.23/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de la supervision Operator (Monitoring, Journaux, traces, statistiques). |
