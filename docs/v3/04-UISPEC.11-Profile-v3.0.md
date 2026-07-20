# Profil & identité utilisateur — Spécification d'interface

**Document** : UISPEC.11

**Fichier** : 04-UISPEC.11-Profile-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le **menu profil unifié** (pastille avatar + nickname, toujours visible) et l'écran de gestion
du profil en sections. Met en œuvre FSPEC.11 / TSPEC.11. Résout le problème V2 du bloc profil hors
viewport. Couleur pilotée par des **tokens** selon l'expérience active (ADR.22).

---

# Composant — Pastille profil (PRO-01)

**Objectif** : point d'entrée unique et **toujours visible** vers la gestion du profil.

**Contenu** : **avatar** (initiales générées par défaut — TSPEC.11) + **nickname**, ancré **en bas à
gauche** de la sidebar (**sticky**, hauteur viewport, scroll interne). Indique discrètement le **rôle
actif** (repère visuel — ADR.22).

**Actions** : ouvrir le menu / l'écran de gestion du profil.

**États** : normal · menu ouvert.

---

# Écran — Gestion du profil (PRO-02)

Sections (onglets ou volet) :

## Données personnelles
- **Avatar** (initiales ; upload en évolution).
- **Nickname** — modifiable.
- **Mail de login** — **rappel, non modifiable** (RG-PRO-02).

## Rôles & permissions
- Rôles attribués (Explorer / Organizer / Operator) et permissions — **lecture seule** (RG-PRO-06).

## Organisations
- Liste des organisations + **rôle d'organisation** (FSPEC.02) ; accès à la gestion (si autorisé).

## Configurations personnelles
- **IA** : renvoi vers AI-01 (fournisseur, opt-in, cas) ; clé **masquée** (UISPEC.08).
- Autres réglages techniques personnels.

## Autres préférences
- **Thème** : clair / obscur / **système** (aperçu immédiat) ; langue, densité… (renvoi PREF-01).

## Session
- Mode de souscription · **[Se déconnecter]**.

**Actions** : enregistrer par section ; se déconnecter.

**États** : chargement · enregistré · erreur de validation · secret masqué.

---

# Comportements

- La **pastille profil reste visible** en permanence (sidebar sticky) — correctif V2 livré (RG-PRO-01).
- Le **thème** s'applique immédiatement.
- Aucun secret réaffiché (clé IA masquée — RG-PRO-04).
- Le **repère de rôle actif** et la couleur suivent l'expérience active (ADR.22).

---

# Points à trancher (rappel FSPEC.11)

- **Avatar** : initiales (recommandé V3) vs upload MinIO.
- **Sélecteur d'expérience / organisation active** : en haut de la sidebar (recommandé) vs dans le menu
  profil.

---

# Composants

Pastille avatar + nickname (sticky) · menu profil · onglets de sections · champ nickname · rappel mail
non modifiable · sélecteur de thème · renvois vers IA (AI-01) et préférences (PREF-01) · bouton de
déconnexion.

Tokens de design uniquement (jamais de couleur en dur) ; couleur selon l'expérience active (ADR.22).

---

# États communs

Chaque section prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.11-Profile-v3.0 · 03-TSPEC.11-Profile-v3.0 · 04-UISPEC.05-Preferences-v3.0 ·
04-UISPEC.07-AI-v3.0 · 04-UISPEC.02-Organization-v3.0 · 04-UISPEC.13-VisualIdentity-v3.0 · 99-ADR.20/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface du menu profil unifié (pastille sticky, sections, thème, avatar). |
