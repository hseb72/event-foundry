# Organization — Spécification d'interface

**Document** : UISPEC.02

**Fichier** : 04-UISPEC.02-Organization-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les écrans du domaine **Organization** : sélection de l'organisation active, paramètres,
membres et adresses côté **Organizer** ; supervision des organisations côté **Operator**. Met en œuvre
FSPEC.02 / TSPEC.02 et l'identité visuelle par rôle (ADR.22 : Organizer = vert, Operator = violet ;
les composants utilisent des **tokens de design**, la couleur suit l'expérience active).

---

# Sélecteur d'organisation active

**Objectif** : permettre à un membre de plusieurs organisations d'**agir au nom de l'une d'elles**.

**Contenu** : sélecteur (logo/initiales + nom de l'organisation) accessible dans la barre latérale de
l'expérience Organizer ; rôle du membre affiché (Owner/Administrator/…). Le choix fixe le **contexte
actif** (en-tête `X-Organization-Id`) et met à jour la liste des ressources visibles.

**États** : une seule organisation (sélecteur informatif) · plusieurs · aucune (invite à en créer une).

> **[à trancher — chantier §5]** Le sélecteur d'organisation active rejoint-il le **menu profil**
> (FSPEC.11) ou reste-t-il en haut de la sidebar ? Recommandation : contexte d'organisation dans la
> sidebar Organizer, données de compte dans le menu profil.

---

# Écrans Organizer

## ORG-SET-01 — Paramètres d'organisation

**Objectif** : gérer l'identité et les paramètres de l'organisation (permission `organization.manage`
+ rôle Owner/Administrator — RG-ORG-07).

**Contenu** — onglets :
- **Identité** : nom, slug, logo, **visibilité** (privée/publique), description.
- **Adresses** : cf. ORG-SET-02.
- **Membres** : cf. ORG-SET-03.
- **Paramètres fonctionnels** (par ex. valeurs par défaut d'import/publication) et **techniques**
  (non secrets ; les secrets — clés IA/SMTP — vivent dans la configuration dédiée, ADR.21).
- **Cycle de vie** (Owner) : archiver / suspendre / réactiver, avec confirmation et **motif** (historisé).

**Actions** : enregistrer · gérer le cycle de vie.

**Gouvernance** : un bandeau signale, le cas échéant, une **intervention support Operator** en cours
(option support-only tracé — RG-ORG-07) ; l'Operator ne modifie qu'à la demande.

---

## ORG-SET-02 — Adresses

**Objectif** : gérer les **adresses** de l'organisation (chantier §8.2), réutilisées comme
localisations proposées à la création d'événements.

**Contenu** : liste des adresses (libellé, ville, code postal, badge « principale »). Formulaire
d'ajout/édition fondé sur la **localisation V3** : **pays** + **code postal** → résolution de la/des
**commune(s)** ; **région affichée en lecture seule** (dérivée, jamais saisie — FSPEC.03) ;
ligne(s) de rue ; marquer **principale**.

**Actions** : ajouter · éditer · supprimer · définir comme principale.

**États** : aucune adresse · code postal ambigu (choix de commune) · code postal introuvable.

---

## ORG-SET-03 — Membres

**Objectif** : gérer les membres et leurs **rôles d'organisation** (Owner/Administrator/Editor/
Contributor/Viewer — RG-ORG-02).

**Contenu** : liste des membres (avatar, nickname, rôle, date d'arrivée). Invitation par e-mail/compte ;
changement de rôle ; retrait.

**Garde-fous UI** : impossible de retirer/rétrograder le **dernier Owner** (RG-ORG-03) — action
désactivée avec explication. Confirmations sur retrait et changement de rôle.

**Actions** : inviter · changer de rôle · retirer.

---

# Écrans Operator

## OPE-ORG-01 — Supervision des organisations

**Objectif** : vue plateforme des organisations (isolation respectée : lecture de supervision, pas
d'usurpation de tenant).

**Contenu** : liste des organisations (nom, statut, nombre de membres, volumétrie d'événements/imports,
dernière activité) ; filtres par statut. Détail d'une organisation : identité, statut, historique du
cycle de vie (`organization_events`).

**Actions** : **suspendre / réactiver** (conformité) avec motif historisé ; ouvrir l'historique ;
(selon RG-ORG-07) **intervention support tracée** sur les paramètres, à la demande.

**États** : active · suspendue · archivée · supprimée.

---

# Composants

Sélecteur d'organisation active · onglets de paramètres · éditeur d'adresse (pays + code postal,
région en lecture seule) · table des membres avec sélecteur de rôle · bandeau d'intervention support ·
frise d'historique de cycle de vie.

Tous n'utilisent que des **tokens de design** (jamais de couleur en dur) : Organizer = vert,
Operator = violet, selon l'expérience active (ADR.22).

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur · **accès refusé** (organisation hors
périmètre du membre — RG-ORG-05), comportements UISPEC.06 V2.

---

# Documents liés

02-FSPEC.02-Organization-v3.0 · 03-TSPEC.02-Organization-v3.0 · 02-FSPEC.03-Localization-v3.0 ·
99-ADR.18/22 · 04-UISPEC.11-Profile-v3.0 · (V2) 04-UISPEC.02-OrganizerExperience ·
04-UISPEC.03-OperatorExperience

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface du domaine Organization (contexte actif, paramètres, adresses, membres, supervision). |
