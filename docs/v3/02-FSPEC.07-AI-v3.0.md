# Intelligence artificielle — Spécification fonctionnelle

**Document** : FSPEC.07

**Fichier** : 02-FSPEC.07-AI-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire l'usage de l'**intelligence artificielle** dans la V3 : un **service d'assistance** encapsulé,
configurable **par profil** (Explorer / Organizer / Operator), **opt-in**, activable **par cas
d'usage**. L'IA extrait / enrichit / propose ; elle **ne décide jamais** — les décisions métier
restent déterministes.

Met en œuvre **ADR.16** (AI Boundaries), en lien avec **ADR.21** (secrets, pour les clés API),
**ADR.20** (préférences) et **ADR.14/15** (pipeline d'import). Intègre le chantier §2.

> **Règle d'or n°1 maintenue** : aucune décision métier par une IA. Le 1er cas d'usage (IA en
> **remplacement de l'OCR**) alimente le **classifier déterministe**, seul juge des champs métier.

---

# Frontière IA (ADR.16)

## Cas d'usage autorisés (assistance)

- **OCR** : extraction de texte depuis une image / un document.
- **Compréhension de documents** : extraction d'informations structurées depuis un contenu non
  structuré (proposition, jamais décision).
- **Traduction**, **reformulation**, **résumé**, **enrichissement fiable** de descriptions.

## Cas d'usage interdits (décision métier — ADR.16)

L'IA ne peut **jamais** : décider qu'un événement est valide ; créer un événement sans le pipeline ;
déterminer l'identité d'une organisation ; décider d'un doublon ; attribuer une catégorie métier
définitive ; modifier des préférences ; planifier un événement dans un agenda ; décider d'envoyer une
notification ; modifier une donnée métier sans contrôle des règles.

> La **sortie de l'IA est toujours vérifiable** : contrôlable, corrigible, rejetable. La plateforme
> explique toujours la **décision finale** (déterministe).

---

# Configuration par profil (chantier §2)

Chaque profil peut **brancher sa propre IA** (fournisseur + clé API), de façon **opt-in** :

| Profil | Usage type | Exemple de cas |
|--------|-----------|----------------|
| **Organizer** | assister ses imports | remplacer l'OCR interne à l'extraction |
| **Operator** | IA plateforme (défaut) | OCR par défaut, traductions plateforme |
| **Explorer** | confort de lecture | traduction / résumé d'une description |

- Une IA peut aussi être configurée **au niveau d'une organisation** (TSPEC.02) : elle s'applique aux
  imports réalisés **au nom de l'organisation**.
- **Résolution** : cas d'usage → clé de l'organisation active si définie, sinon clé personnelle du
  profil, sinon IA plateforme (Operator), sinon **repli déterministe** (ex. OCR Tesseract interne).

---

# Activation par cas d'usage

Si un profil active l'IA, il choisit **dans quelles circonstances** elle peut être sollicitée (page
listant les cas possibles). Chaque cas est **indépendant** : activer « OCR par IA » n'active pas
« traduction par IA ». Un cas non activé utilise le **repli déterministe** ou n'est pas proposé.

---

# Fournisseurs (ADR.16)

Fournisseur **entièrement configurable** : OpenAI, Anthropic, Google Gemini, Mistral AI, Ollama, ou
toute solution compatible. Le domaine métier **n'accède jamais** directement à une API d'IA — toujours
via une **interface d'assistance** encapsulée (indépendance vis-à-vis des fournisseurs).

---

# Règles fonctionnelles

## RG-AI-01 — Assistance, jamais décision

L'IA propose / extrait / enrichit. Toute décision métier reste déterministe (classifier, validation,
déduplication). Une sortie IA n'est jamais l'unique base d'une décision fonctionnelle.

## RG-AI-02 — Opt-in par profil et par cas

L'IA est désactivée par défaut. Un profil l'active explicitement, puis active **chaque cas d'usage**
séparément. La plateforme permet de **désactiver totalement** l'IA (ADR.16).

## RG-AI-03 — Clé = secret

La clé API / les identifiants d'un fournisseur sont des **secrets** (ADR.21) : jamais versionnés,
jamais renvoyés en clair (masqués `sk-…abcd`), chiffrés au repos. Les **préférences** ne stockent
qu'un **choix de fournisseur + opt-in + cas**, jamais la clé (RG-PREF-05).

## RG-AI-04 — Traçabilité des appels

Chaque appel IA est retraçable : fournisseur, modèle, date, **version du prompt**, résultat, durée
(ADR.16). Base d'audit et de diagnostic.

## RG-AI-05 — Confidentialité

Les données transmises à une IA respectent la politique de sécurité ; les informations sensibles ne
sont envoyées que si **explicitement autorisé** par la configuration.

## RG-AI-06 — Repli déterministe

Si l'IA est indisponible, non configurée ou en échec, le traitement **retombe** sur le mécanisme
déterministe (ex. OCR interne) ou s'interrompt proprement — jamais de blocage silencieux.

## RG-AI-07 — Vérifiabilité de la sortie

Toute sortie IA passe par le pipeline / la validation : elle peut être corrigée ou rejetée par
l'utilisateur ou par les règles. L'origine « assistée par IA » d'une donnée est traçable.

---

# 1er cas d'usage — IA en remplacement de l'OCR (chantier §2)

- À l'import Image/PDF (FSPEC.01), la phase **Extract** peut appeler l'IA de l'utilisateur/organisation
  **au lieu** de l'OCR interne (aujourd'hui médiocre), pour produire le **texte / champs bruts**.
- La sortie alimente ensuite le **classifier déterministe** (Normalize), **seul juge** des champs
  métier. La décision reste déterministe (RG-AI-01).
- Sélectionnable par cas d'usage (RG-AI-02) ; repli sur Tesseract si indisponible (RG-AI-06).

---

# Décision de gouvernance (chantier §2, « ADR requis »)

**Tranché (ADR.16)** : **IA = extraction / assistance ; déterminisme = décision.** L'option « l'IA
produit directement l'EventCandidate / décide des champs » **réécrirait la règle d'or n°1** et est
**rejetée** (ADR.16 — cas interdits). Toute évolution de cette frontière exige un **nouvel ADR assumé**.

---

# Parcours

- **Configurer son IA** : profil → activer l'IA → choisir un fournisseur → saisir la clé (stockée en
  secret, masquée) → activer les cas d'usage souhaités → tester.
- **Import assisté par IA** : Organizer importe une image → si « OCR par IA » actif, l'extraction
  utilise l'IA → classifier déterministe → EventCandidate à valider.

(Détail des écrans : UISPEC.07 AI.)

---

# Correspondance avec la V2

- La V2 réalise l'OCR avec **Tesseract interne** (classifier déterministe existant). La V3 **ajoute**
  la possibilité d'une IA externe **en amont** de ce classifier, sans changer le principe : la décision
  reste déterministe. L'OCR interne devient le **repli** (RG-AI-06).

---

# Hors périmètre (V3)

- IA décisionnelle (rejetée — ADR.16).
- Fine-tuning / modèles hébergés par la plateforme (Backlog V4).
- Génération d'événements de bout en bout par IA (interdit — ADR.16).

---

# Documents liés

99-ADR.16-AIBoundaries · 99-ADR.21-SecretsManagement · 99-ADR.20-UserPreferencesModel ·
99-ADR.14/15 · 03-TSPEC.07-AI-v3.0 · 04-UISPEC.07-AI-v3.0 · 02-FSPEC.01-Import-v3.0 ·
02-FSPEC.08-Secrets-v3.0 · 02-FSPEC.05-Preferences-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de l'IA d'assistance (frontière, config par profil, opt-in par cas, 1er cas = OCR). |
