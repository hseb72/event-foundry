# Configuration Operator — Spécification fonctionnelle

**Document** : FSPEC.09

**Fichier** : 02-FSPEC.09-Configuration-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les **pages d'administration de la plateforme** gérées par l'**Operator** : configuration
**technique** (exploitation), **mail** (SMTP / provider, test d'envoi) et **IA** (fournisseur par
défaut, interrupteur global). Ces écrans étaient **prévus mais non construits** en V2 (`OPE-005`).

Met en œuvre le chantier §2, en s'appuyant sur **ADR.21** (secrets), **ADR.16** (IA), **ADR.17**
(mail = vecteur de notification) et **ADR.12** (principes/config externalisée).

> Les **secrets** manipulés ici (identifiants SMTP, clés IA) suivent strictement l'ADR.21 : jamais
> versionnés, jamais renvoyés en clair (masqués), chiffrés au repos — la base ne garde qu'une
> **référence** + un statut « configuré / testé » (FSPEC.08).

---

# Périmètre

| Bloc | Contenu | Dépendances |
|------|---------|-------------|
| **Technique** | paramètres d'exploitation (limites, quotas, fonctionnalités activables) | ADR.12, config externalisée |
| **Mail** | provider / SMTP, expéditeur, **test d'envoi** | Secrets (ADR.21), Notifications (ADR.17) |
| **IA plateforme** | fournisseur + modèle par défaut, cas d'usage, **interrupteur global** | AI (ADR.16), Secrets (ADR.21) |

---

# Configuration technique

- Paramètres d'exploitation de la plateforme : limites (tailles d'upload, quotas d'import), bascules de
  fonctionnalités, valeurs par défaut système (consommées par User Preferences — héritage, FSPEC.05).
- **Config externalisée** (env / fichiers) — ADR.12 ; l'écran expose les paramètres **modifiables à
  chaud**, les autres restant du ressort de l'infrastructure.

---

# Configuration mail

- **Provider / SMTP** : hôte, port, sécurité, **identifiants** (secret — ADR.21), **adresse
  expéditeur**.
- **Test d'envoi** : envoyer un message de test → statut « testé OK / échec » (met à jour le statut du
  secret associé).
- **Dépendance** : le vecteur **email** des notifications (FSPEC.04) n'est proposé que si le mail est
  **configuré et testé** ; sinon il est signalé « à configurer » (OPE-NOTIF-01).

---

# Configuration IA plateforme

- **Fournisseur + modèle par défaut** de la plateforme (repli quand aucune IA d'organisation/profil).
- **Cas d'usage** activés au niveau plateforme.
- **Interrupteur global** : **désactiver totalement** l'IA sur la plateforme → tous les cas retombent
  sur le déterminisme (RG-AI-06). (Détail : FSPEC.07 AI.)

---

# Règles fonctionnelles

## RG-CFG-01 — Réservé à l'Operator

Ces configurations sont accessibles au seul **Operator** (permissions dédiées, ex. `platform.configure`,
`mail.configure`). Aucun autre profil n'y accède.

## RG-CFG-02 — Secrets conformes ADR.21

Tout identifiant/clé saisi ici est un **secret** : masqué, chiffré, référencé, testable. La valeur
n'est jamais réaffichée ni renvoyée en clair (RG-SEC-01/03).

## RG-CFG-03 — Test avant activation

Un vecteur (mail) ou un fournisseur (IA) doit être **testé** avant d'être proposé aux utilisateurs ;
un statut « à configurer » est affiché tant que le test n'est pas concluant.

## RG-CFG-04 — Dépendances explicites

Les fonctionnalités dépendantes indiquent leur prérequis : email de notification ⇐ configuration mail ;
IA d'assistance ⇐ configuration IA (ou repli déterministe).

## RG-CFG-05 — Traçabilité

Toute modification de configuration est **historisée** (qui, quand, quoi — hors valeurs secrètes) —
audit et observabilité (ADR.23).

---

# Correspondance avec la V2

- L'écran **`OPE-005 Configuration`** était **prévu mais non construit** en V2. La V3 le concrétise
  (technique / mail / IA), branché sur le Secrets Management (FSPEC.08) et le framework de notifications
  (FSPEC.04).
- La V2 a des canaux mail/push **stubbés** ; la configuration mail les rend **opérationnels**.

---

# Parcours

- **Configurer le mail** : Operator saisit le SMTP (secret) → teste → email disponible comme vecteur.
- **Configurer l'IA plateforme** : Operator choisit fournisseur/modèle par défaut → clé (secret) →
  active des cas → ou coupe l'IA globalement.
- **Ajuster la technique** : Operator modifie des paramètres d'exploitation à chaud.

(Détail des écrans : UISPEC.09 Configuration.)

---

# Hors périmètre (V3)

- Configuration par organisation des paramètres **plateforme** (les organisations gèrent leurs propres
  settings — FSPEC.02).
- Éditeur de feature flags avancé / segmentation (Backlog V4).

---

# Documents liés

99-ADR.21-SecretsManagement · 99-ADR.16-AIBoundaries · 99-ADR.17-NotificationFramework · 99-ADR.12 ·
03-TSPEC.09-Configuration-v3.0 · 04-UISPEC.09-Configuration-v3.0 · 02-FSPEC.04-Notification-v3.0 ·
02-FSPEC.07-AI-v3.0 · 02-FSPEC.08-Secrets-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de la configuration Operator (technique, mail, IA plateforme). |
