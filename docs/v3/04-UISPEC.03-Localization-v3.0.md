# Localisation — Spécification d'interface

**Document** : UISPEC.03

**Fichier** : 04-UISPEC.03-Localization-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le **sélecteur de localisation** V3 (pays + code postal, région dérivée) et son intégration
aux formulaires d'adresse, de création d'événement et de recherche. Met en œuvre FSPEC.03 / TSPEC.03.
Composant réutilisé dans les trois expériences ; couleur pilotée par des **tokens** selon l'expérience
active (ADR.22).

---

# Composant — Sélecteur de localisation (LOC-01)

**Objectif** : remplacer la cascade à trois sélecteurs (V2) par une saisie **pays + code postal**.

**Contenu** :
- **Pays** — sélecteur (défaut = pays de l'organisation ou préférence utilisateur).
- **Code postal** — champ de saisie ; résolution au fil de la frappe / à la validation.
- **Commune** — résultat :
  - une seule → sélectionnée automatiquement ;
  - plusieurs → **liste de désambiguïsation** (RG-LOC-03) ;
  - aucune → message « code postal introuvable » (aucune commune inventée).
- **Région** — **affichée en lecture seule** (dérivée de la commune — RG-LOC-02) ; jamais éditable.

**États** : vide · en résolution · commune unique · choix multiple · introuvable · erreur réseau.

---

# Intégrations

## Formulaire d'adresse d'organisation (ORG-SET-02)

Le sélecteur LOC-01 alimente pays / code postal / commune ; l'utilisateur ajoute la/les ligne(s) de
rue et un libellé, puis peut marquer l'adresse **principale**. (Écran détaillé : UISPEC.02.)

## Création manuelle d'un événement

- Les **adresses de l'organisation active** sont **proposées** en premier choix (RG-LOC-05 / RG-ORG-06) :
  liste de raccourcis (libellé + commune).
- Option « autre localisation » → sélecteur LOC-01.
- La région dérivée est rappelée en lecture seule.

## Recherche & filtres (Explorer)

Le filtre géographique passe à **pays + code postal** : saisie d'un code postal → événements des
communes correspondantes. Le libellé de région peut être affiché à titre indicatif (dérivé), jamais
comme filtre.

---

# Migration d'interface (depuis la V2)

- Les écrans utilisant la **cascade pays / région / ville** adoptent LOC-01.
- Aucun changement du contrat de données (la commune reste l'entité sélectionnée) : la bascule est
  purement d'interface.

---

# Composants

Sélecteur de pays · champ code postal avec résolution · liste de désambiguïsation de commune · étiquette
de région en lecture seule · liste de raccourcis « adresses de l'organisation ».

Tokens de design uniquement (jamais de couleur en dur) ; la couleur suit l'expérience active (ADR.22).

---

# États communs

Chaque intégration prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.03-Localization-v3.0 · 03-TSPEC.03-Localization-v3.0 · 04-UISPEC.02-Organization-v3.0 ·
99-ADR.18/22 · (V2) 04-UISPEC.* formulaires événement / recherche

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de la localisation par pays + code postal (sélecteur, désambiguïsation, intégrations). |
