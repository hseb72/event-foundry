# Configuration Operator — Spécification d'interface

**Document** : UISPEC.09

**Fichier** : 04-UISPEC.09-Configuration-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire l'écran `OPE-005 Configuration` (Operator) : onglets **technique**, **mail** et **IA
plateforme**. Met en œuvre FSPEC.09 / TSPEC.09. Réutilise le champ secret masqué (UISPEC.08). Couleur
Operator = violet, via **tokens**, selon l'expérience active (ADR.22).

---

# Écran — Configuration (OPE-005)

Onglets :

## Technique

**Contenu** : paramètres d'exploitation modifiables à chaud (limites d'upload, quotas d'import,
bascules de fonctionnalités, valeurs par défaut système). Chaque paramètre indique sa **valeur
effective** et sa portée.

**Actions** : modifier · enregistrer (historisé).

## Mail

**Contenu** : provider / **SMTP** (hôte, port, sécurité), **identifiants** via champ secret (SEC-01),
**adresse expéditeur**, **bouton Test d'envoi**.

**États** : non configuré · configuré non testé · **testé OK** · échec de test.

**Dépendance affichée** : « le vecteur *email* des notifications nécessite une configuration mail
testée » (lien vers OPE-NOTIF-01).

**Actions** : enregistrer · **tester l'envoi** · remplacer les identifiants (rotation de secret).

## IA plateforme

**Contenu** : **fournisseur + modèle** par défaut, **clé** via champ secret (SEC-01), **cas d'usage**
plateforme, **interrupteur global « Activer l'IA »** (off = repli déterministe partout — RG-AI-06).
Métriques d'appels IA (ADR.23).

**Actions** : enregistrer · **tester** le fournisseur · activer des cas · **couper l'IA globalement**.

---

# Comportements

- Toute clé/identifiant est un **secret** (masqué, jamais réaffiché — UISPEC.08 / RG-CFG-02).
- Un vecteur/fournisseur **non testé** est signalé « à configurer » et n'est pas proposé aux
  utilisateurs (RG-CFG-03).
- Les dépendances entre écrans sont explicites (mail ⇒ email de notification ; IA ⇒ assistance import).
- Les modifications sont **historisées** (bandeau « dernière modification par … le … »).

---

# Composants

Onglets de configuration · champ secret masqué + test (SEC-01) · formulaire SMTP · sélecteur
fournisseur/modèle IA · interrupteur global IA · cartes de métriques · bandeau d'historique.

Tokens de design uniquement (jamais de couleur en dur) ; couleur Operator = violet selon l'expérience
active (ADR.22).

---

# États communs

Chaque onglet prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.09-Configuration-v3.0 · 03-TSPEC.09-Configuration-v3.0 · 04-UISPEC.08-Secrets-v3.0 ·
04-UISPEC.07-AI-v3.0 · 04-UISPEC.04-Notification-v3.0 · 99-ADR.16/17/21/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de la configuration Operator (technique, mail, IA plateforme). |
