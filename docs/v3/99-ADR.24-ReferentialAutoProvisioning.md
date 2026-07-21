# ADR.24 – Auto-provisioning des référentiels (import)

**Document** : ADR.24

**Fichier** : 99-ADR.24-ReferentialAutoProvisioning.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

Le pipeline d'import (ADR.14) résout les libellés extraits (activité, type, format, organisateur,
lieu) vers les référentiels de la plateforme. Les référentiels sont curés et constituent une source
de vérité déterministe (règle d'or : aucune liste métier codée en dur ; PostgreSQL source de vérité).

En pratique, exiger que **tous** les référentiels soient peuplés **avant** l'import rend l'outil
inintéressant : chaque libellé inconnu (une nouvelle activité TCG, un lieu, un organisateur) impose un
aller-retour manuel vers l'administration avant de pouvoir intégrer l'événement. L'objectif produit
— automatiser au maximum l'intégration — est contredit par ce prérequis.

L'ADR.16 (§Frontière) a déjà clarifié que l'IA *extrait des libellés bruts* et que le domaine *décide*
de façon déterministe. Le Levier 1 (reconnaissance des libellés non résolus) et le Levier 2 (création /
association à la volée pendant la validation) suppriment l'aller-retour pour un opérateur qui valide.
Il reste à traiter le cas « zéro friction » : intégrer sans intervention humaine sur les référentiels.

---

# Problème

Comment autoriser la création automatique des référentiels manquants lors d'un import, **sans**
transformer l'IA/le moteur en décideur métier (règle d'or n°1), et **sans** dégrader la qualité du
référentiel (prolifération, doublons, entrées parasites) ?

---

# Décision

La plateforme introduit un **auto-provisioning opt-in** des référentiels lors de l'import.

Quand il est activé, un libellé extrait qui ne se résout vers **aucun** référentiel (ni par nom, ni
par alias) **matérialise** le référentiel correspondant dans un état **provisoire** (`provisional`),
immédiatement utilisable, et déposé dans une **file de curation** pour revue par un administrateur.

Cette décision ne viole pas la règle d'or n°1 :

- l'IA / le connecteur ne fait qu'**extraire un libellé** ; il ne choisit aucun référentiel ;
- la **matérialisation** est une opération **déterministe** (le libellé brut devient une entrée de
  référentiel), pas une décision de validité métier prise par une IA ;
- l'**autorisation** de matérialiser vient d'une **configuration explicite** (opt-in d'un
  administrateur), pas du contenu ni du modèle ;
- la **curation** reste humaine et déterministe (confirmer, renommer, fusionner, supprimer).

---

# Principes

## Opt-in explicite

L'auto-provisioning est **désactivé par défaut**. Il est activé par un administrateur (V3 : réglage
plateforme, écran de configuration Operator ; une granularité par organisation pourra suivre).

## État provisoire

Un référentiel auto-créé porte `provisional = true`. Il est **actif** (les événements peuvent le
référencer immédiatement) mais **signalé** pour revue. Confirmer lève le drapeau ; le référentiel
devient un référentiel curé ordinaire.

## Anti-doublon

La résolution **exacte** (nom + alias) est toujours tentée **avant** toute création : on ne crée
jamais un doublon d'un référentiel existant. Les **quasi-doublons** (proximité orthographique) ne sont
**jamais fusionnés automatiquement** : ils sont **suggérés** à la curation.

## Hiérarchie respectée

- Une **Activity** auto-créée exige un **Domaine** (hiérarchie Domain → Activity). L'auto-provisioning
  utilise un **domaine par défaut** configuré. En son absence, si le domaine est ambigu, l'activité
  n'est **pas** auto-créée (repli sur la proposition de validation — Levier 2).
- Un **EventType / EventFormat** auto-créé est rattaché à l'**Activity** résolue (créée ou existante).
- **Organisateur / Lieu** sont créés au libellé (indépendants).

## Traçabilité

Un référentiel provisoire conserve son origine (créé via import). L'appel n'est jamais une décision
d'IA : aucune trace « décision IA » n'est produite pour la matérialisation (contrairement aux appels
d'extraction, tracés eux — ADR.16).

## Réversibilité et intégrité

La curation peut **supprimer** ou **fusionner** un référentiel provisoire. Les relations métier restant
en `RESTRICT`, une suppression n'est possible que si aucun événement ne le référence ; une **fusion**
réaffecte les événements vers le référentiel cible avant retrait du doublon.

---

# Portée des types auto-provisionnables

Activity (avec domaine par défaut), EventType, EventFormat, Organizer, Venue.

**Hors périmètre** : Domain, Country, Region, Municipality, Category (non extraits ou structurants),
Tag. Ces référentiels restent purement administrés.

---

# Interaction avec les autres décisions

- **RG-IMP-06 (confiance de la source)** : indépendante. L'auto-provisioning remplit les référentiels ;
  la sortie du pipeline (EventCandidate à valider vs Event publié) reste gouvernée par la confiance de
  la source. Un import peut donc être *entièrement* automatisé (source fiable + auto-provisioning) tout
  en laissant une trace curable.
- **ADR.16 (frontière IA)** : inchangée. L'IA extrait ; la matérialisation et la décision restent
  déterministes.
- **Leviers 1 & 2** : l'auto-provisioning ne les remplace pas. Désactivé, le comportement reste la
  reconnaissance + proposition en validation. Activé, les libellés se résolvent seuls (les entrées
  provisoires existent) et la validation ne présente plus de proposition pour ces champs.

---

# Conséquences

- Les référentiels se peuplent **à partir des imports réels**, plus en prérequis manuel.
- Un **coût de curation** apparaît (revue des entrées provisoires, fusion des doublons) — borné par la
  file de curation et l'anti-doublon.
- Le référentiel peut contenir transitoirement des entrées imparfaites (signalées), assumé comme
  compromis en faveur de l'automatisation.

---

# Alternatives étudiées

## Statu quo (peuplement manuel préalable)

Qualité maximale du référentiel, mais prérequis bloquant qui rend l'intégration lente et l'outil peu
intéressant. Rejeté comme mode par défaut ; conservé comme comportement *opt-out*.

## Création directe et définitive (sans état provisoire)

Simplicité, mais aucune distinction entre référentiel curé et référentiel issu d'un import → dérive de
qualité invisible et non maîtrisée. Rejeté.

## Auto-provisioning provisoire + curation (retenu)

Automatise l'intégration tout en conservant un point de contrôle humain *a posteriori* et l'intégrité
du référentiel. Retenu, en opt-in.

---

# Documents impactés

01-ARCHI.03 (modèle : drapeau `provisional`) · 02-FSPEC.01-Import · 03-TSPEC.01-Import ·
02-FSPEC.09-Configuration (réglage) · 04-UISPEC.09/10 (file de curation) · 99-ADR.13/14/16.

---

# Documents liés

ADR.13 – Import Connector Framework · ADR.14 – Import Pipeline · ADR.15 – Raw Event Model ·
ADR.16 – AI Boundaries

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction de l'auto-provisioning opt-in des référentiels (état provisoire + curation) lors de l'import. |
