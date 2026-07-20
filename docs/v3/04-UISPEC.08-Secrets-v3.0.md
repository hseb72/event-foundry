# Gestion des secrets — Spécification d'interface

**Document** : UISPEC.08

**Fichier** : 04-UISPEC.08-Secrets-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les composants d'interface de saisie et de gestion des **secrets** (clés API, SMTP, tokens…),
réutilisés dans toutes les pages de configuration (IA, mail, connecteurs). Met en œuvre FSPEC.08 /
TSPEC.08. **Aucune valeur secrète n'est jamais réaffichée** : seules des **métadonnées masquées** sont
présentées (ADR.21). Couleur pilotée par des **tokens** selon l'expérience active (ADR.22).

---

# Composant — Champ secret (SEC-01)

**Objectif** : saisir ou remplacer une valeur secrète, sans jamais la réafficher.

**Contenu / comportement** :
- À la **saisie initiale** : champ masqué (type password) + option de révélation **temporaire pendant
  la frappe uniquement**.
- Une fois **enregistré** : le champ affiche uniquement `type · fournisseur · sk-…abcd · statut`
  (RG-SEC-03) ; la valeur n'est plus récupérable.
- Boutons : **Tester** (statut « testé / échec »), **Remplacer** (nouvelle valeur → rotation),
  **Révoquer**.

**États** : vide (non configuré) · configuré (non testé) · testé OK · échec de test · expiré · révoqué.

---

# Composant — Liste des secrets (SEC-02)

**Objectif** : vue d'administration des secrets d'une **portée** (plateforme / organisation).

**Contenu** : tableau (type, fournisseur, `sk-…abcd`, portée, statut, dernière rotation, expiration).
Filtres par type / statut. **Jamais** de colonne « valeur ».

**Actions** : ajouter · tester · **faire tourner** (remplacer) · révoquer · consulter le **journal
d'accès** (dates, consommateur, résultat — sans valeur).

---

# Intégrations

- **Configuration IA** (UISPEC.07) : le champ « Clé API » **est** un SEC-01.
- **Configuration mail** (UISPEC.09) : identifiants SMTP via SEC-01.
- **Connecteurs** (UISPEC.01, OPE-CONN-01) : authentification de la source via référence de secret.

---

# Comportements de sécurité (rappels)

- Une valeur saisie n'est **jamais** renvoyée par l'API ni réaffichée (RG-SEC-01/03).
- L'interface ne présente que des **métadonnées** (RG-SEC-03).
- Le **journal d'accès** est consultable mais ne contient **aucune** valeur (RG-SEC-07).
- La **portée** (plateforme / organisation / utilisateur) est explicite ; un secret d'organisation
  n'est visible que par ses membres autorisés (isolation — RG-SEC-06).

---

# Composants

Champ secret masqué (saisie/rotation/test) · table des secrets avec métadonnées masquées · visionneuse
de journal d'accès · badge de statut (configuré/testé/expiré).

Tokens de design uniquement (jamais de couleur en dur) ; couleur selon l'expérience active (ADR.22).

---

# États communs

Chaque composant prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.08-Secrets-v3.0 · 03-TSPEC.08-Secrets-v3.0 · 04-UISPEC.07-AI-v3.0 ·
04-UISPEC.09-Configuration-v3.0 · 04-UISPEC.01-Import-v3.0 · 99-ADR.21/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de la gestion des secrets (champ masqué, liste, journal d'accès, intégrations). |
