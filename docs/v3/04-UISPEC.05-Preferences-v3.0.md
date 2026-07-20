# Préférences utilisateur — Spécification d'interface

**Document** : UISPEC.05

**Fichier** : 04-UISPEC.05-Preferences-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire l'interface de gestion des **préférences personnelles**, intégrée au **menu profil** (FSPEC.11 /
UISPEC.11). Met en œuvre FSPEC.05 / TSPEC.05. Écran commun à toutes les expériences ; couleur pilotée
par des **tokens** selon l'expérience active (ADR.22).

---

# Écran — Préférences (PREF-01)

**Objectif** : régler ses préférences par **catégorie** (ADR.20), depuis un point d'entrée unique.

**Contenu** — sections repliables ou onglets :

## Général
- **Langue**, **fuseau horaire**, **format de date/heure**, **unités**.

## Interface
- **Thème** : clair / obscur / **système** (chantier §5) — aperçu immédiat.
- **Densité d'affichage**, **page d'accueil** par défaut.

## Notifications
- Renvoie à la grille **fréquence × vecteur** (EXP-NOTIF-02) — même source (User Preferences).

## Découverte
- **Rayon** (pays + code postal — FSPEC.03), **activités / lieux favoris**, niveau de personnalisation.

## Intelligence artificielle
- **Fournisseur préféré**, **opt-in**, **cas d'usage autorisés** (détail : UISPEC.07 AI).
- La **clé API** n'est **pas** ici : elle est saisie/masquée via la configuration sécurisée (secrets —
  UISPEC.08).

## Confidentialité
- **Visibilité du profil**, **partage d'activités**, **statistiques anonymisées**.

**Actions** : enregistrer par section ; réinitialiser aux valeurs par défaut.

**États** : chargement · enregistré · erreur de validation (message précis) · valeur héritée (indication
« valeur par défaut »).

---

# Comportements

- **Thème** appliqué immédiatement (sans rechargement).
- Chaque préférence affiche sa **valeur effective** ; une valeur non personnalisée est signalée comme
  **héritée** (défaut système / organisation — RG-PREF-03).
- Aucune saisie de secret dans cet écran (RG-PREF-05) ; renvoi explicite vers la configuration sécurisée.

---

# Composants

Sélecteurs (langue, fuseau, thème) · bascule d'opt-in · liste de favoris · indicateur « valeur héritée »
· lien vers la configuration sécurisée (secrets).

Tokens de design uniquement (jamais de couleur en dur) ; couleur selon l'expérience active (ADR.22).

---

# États communs

Chaque section prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.05-Preferences-v3.0 · 03-TSPEC.05-Preferences-v3.0 · 04-UISPEC.11-Profile-v3.0 ·
04-UISPEC.04-Notification-v3.0 · 04-UISPEC.07-AI-v3.0 · 04-UISPEC.08-Secrets-v3.0 · 99-ADR.20/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface des préférences utilisateur (catégories, thème, intégration menu profil). |
