# Import — Spécification d'interface

**Document** : UISPEC.Import

**Fichier** : 04-UISPEC.Import-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les écrans d'import : acquisition et suivi côté **Organizer**, configuration et supervision des
connecteurs côté **Operator**. Met en œuvre FSPEC.Import et l'identité visuelle par rôle (ADR.22 :
Organizer = vert, Operator = violet ; les composants utilisent des **tokens**, la couleur suit
l'expérience active).

---

# Écrans Organizer

## ORG-IMP-01 — Acquisition

**Objectif** : fournir une source à importer, quel que soit le canal, depuis un écran unique.

**Contenu** — un sélecteur de canal, puis la zone adaptée :
- **Image / PDF** : zone de **glisser-déposer** + bouton **parcourir** + **copier-coller** (Ctrl+V
  d'une image/capture) ; multi-fichiers ; aperçu des vignettes ; taille/format contrôlés.
- **CSV / JSON** : **upload** d'un fichier **ou** **zone de collage** du contenu ; rappel du **schéma
  attendu** (lien vers la doc) ; contrôle de format immédiat (colonnes/clés obligatoires).
- **URL** : champ URL + bouton **« Capter »**.

**Actions** : lancer l'import → redirige vers le suivi (ORG-IMP-02).

**États** : vide · fichiers en attente · en envoi · erreur de format (message précis).

---

## ORG-IMP-02 — Suivi d'import

**Objectif** : suivre la progression d'un ImportJob et agir dessus.

**Contenu** :
- **Progression par étape** (Discovery → Fetch → Extract → Validate → Normalize → Deduplicate →
  Persist), avec l'étape courante et l'état (`DISCOVERING…COMPLETED / FAILED`).
- **Volumes** : objets lus, Raw Events, créés / mis à jour / doublons / rejetés.
- **Erreurs / avertissements** localisés par étape.
- Selon le résultat : lien vers la **validation** des EventCandidates produits, ou vers les Events créés.

**Actions** : **rejouer** l'import (depuis les Raw Events) ; ouvrir la validation ; revenir à la liste.

---

## ORG-IMP-03 — Mes imports

**Objectif** : historique des imports de l'organisation.

**Contenu** : liste (date, canal/source, statut, volumes) ; filtres par statut / période / canal.
**Actions** : ouvrir un import (ORG-IMP-02).

> La **validation / correction des EventCandidates** réutilise l'écran de validation existant (V2),
> désormais alimenté par tous les canaux d'import.

---

# Écrans Operator

## OPE-CONN-01 — Connecteurs

**Objectif** : administrer les connecteurs planifiés (ADR.13).

**Contenu** : liste des connecteurs (fournisseur, état actif/inactif, dernière exécution, dernier
statut). Par connecteur : **configuration** (URL, authentification via référence de secret, timeout,
**fréquence**, **niveau de confiance** → EventCandidate vs Event), **test de disponibilité**.

**Actions** : activer / désactiver · configurer · **exécuter maintenant** · consulter les exécutions.

**États** : disponible · indisponible (test échoué) · désactivé.

## OPE-IMP-01 — Supervision des imports

**Objectif** : vision transverse des imports (complète la supervision V2 ; détaillée dans V3-13 /
ADR.23 — écrans `OPE-006 Monitoring`, `OPE-007 Journaux`).

**Contenu** : volumes et durées par étape, taux d'erreur par connecteur, imports en échec (alerte),
accès au détail d'un ImportJob (ORG-IMP-02, en lecture).

---

# Composants

Dropzone multi-source · zone de collage avec rappel de schéma · frise de progression d'ImportJob ·
cartes de statistiques · panneau de validation (partagé) · formulaire de configuration de connecteur.

Tous n'utilisent que des **tokens de design** (jamais de couleur en dur) : Organizer = vert,
Operator = violet, selon l'expérience active (ADR.22).

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.Import-v3.0 · 03-TSPEC.Import-v3.0 · 99-ADR.13/14/16/22/23 · 01-ARCHI.02-v3.0 ·
(V2) 04-UISPEC.02-OrganizerExperience · 04-UISPEC.03-OperatorExperience

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de l'import (acquisition, suivi, connecteurs). |
