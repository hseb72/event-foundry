# Intelligence artificielle — Spécification d'interface

**Document** : UISPEC.07

**Fichier** : 04-UISPEC.07-AI-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire l'interface de **configuration de l'IA** par profil (Explorer / Organizer / Operator) et son
usage à l'import. Met en œuvre FSPEC.07 / TSPEC.07. Couleur pilotée par des **tokens** selon
l'expérience active (ADR.22). Les clés API se saisissent via la configuration sécurisée (secrets —
UISPEC.08), jamais affichées en clair.

---

# Écran — Configuration IA (AI-01)

**Objectif** : brancher **sa propre IA** (opt-in) et choisir **les cas d'usage** autorisés (chantier §2).

**Contenu** :
- **Activation** (opt-in global du profil) : interrupteur « Utiliser une IA ».
- **Fournisseur** : sélecteur (OpenAI, Anthropic, Gemini, Mistral, Ollama, autre) + **modèle**.
- **Clé API** : champ **masqué** (`sk-…abcd`) géré comme un secret (UISPEC.08) ; bouton **Tester** ;
  statut « configuré / testé ».
- **Cas d'usage** (liste, activables indépendamment) :
  - **OCR / extraction à l'import** (1er cas) ;
  - compréhension de documents · traduction · reformulation · résumé · enrichissement.
  Chaque cas rappelle : *« assistance uniquement — la décision reste déterministe »*.
- **Portée** (Organizer/Operator) : configurer pour **soi** ou pour l'**organisation active**.

**Actions** : activer/désactiver · enregistrer le fournisseur · tester · activer des cas.

**États** : IA désactivée · configurée non testée · testée OK · test échoué · indisponible.

---

# Écran Operator — IA plateforme

**Objectif** : configurer l'**IA par défaut** de la plateforme et l'**interrupteur global** (FSPEC.09 /
OPE Configuration).

**Contenu** : fournisseur/modèle par défaut, clé (secret), cas d'usage plateforme, **désactivation
totale de l'IA** (repli déterministe partout — RG-AI-06). Métriques d'appels (ADR.23).

---

# Intégration à l'import

- À l'import Image/PDF (ORG-IMP-01), si « OCR par IA » est actif, l'extraction utilise l'IA configurée ;
  un **badge « extraction assistée par IA »** apparaît dans le suivi (ORG-IMP-02).
- En cas d'IA indisponible, le suivi indique le **repli sur l'OCR interne** (transparence, RG-AI-06).
- Le résultat reste un **EventCandidate à valider** (la décision est déterministe).

---

# Comportements de sécurité

- La **clé** n'est jamais réaffichée en clair après saisie (masquée) — ADR.21.
- L'écran n'affiche que des **métadonnées** du secret (fournisseur, 4 derniers caractères, statut).
- Aucune donnée sensible d'un import n'est envoyée à l'IA sans autorisation explicite (RG-AI-05).

---

# Composants

Interrupteur d'opt-in · sélecteur fournisseur/modèle · champ secret masqué + test · liste de cas
d'usage activables · sélecteur de portée (soi / organisation) · badge « assisté par IA ».

Tokens de design uniquement (jamais de couleur en dur) ; couleur selon l'expérience active (ADR.22).

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.07-AI-v3.0 · 03-TSPEC.07-AI-v3.0 · 04-UISPEC.08-Secrets-v3.0 · 04-UISPEC.01-Import-v3.0 ·
04-UISPEC.05-Preferences-v3.0 · 99-ADR.16/21/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de la configuration IA (opt-in, fournisseur, cas d'usage, intégration import). |
