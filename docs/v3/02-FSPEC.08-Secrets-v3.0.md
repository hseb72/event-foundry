# Gestion des secrets — Spécification fonctionnelle

**Document** : FSPEC.08

**Fichier** : 02-FSPEC.08-Secrets-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire la stratégie unifiée de **gestion des secrets** de la V3 : clés API, identifiants SMTP, jetons
OAuth, certificats, clés de fournisseurs IA… Le domaine métier ne manipule **jamais** une valeur
secrète — uniquement des **références logiques**. Les secrets sont chiffrés au repos, jamais versionnés,
jamais renvoyés en clair.

Met en œuvre **ADR.21** (Secrets Management), en lien avec **ADR.13** (connecteurs), **ADR.16** (IA),
**ADR.18** (organisation) et **ADR.23** (observabilité). Intègre la règle d'or §10 (secrets injectés,
jamais versionnés) et le chantier §2.

---

# Types de secrets (ADR.21)

API Keys · Client Secret OAuth · jetons d'accès · certificats TLS · clés privées · comptes SMTP ·
identifiants de bases de données · secrets de connecteurs · **clés des fournisseurs IA**. Liste
**extensible**.

---

# Principe fondamental

```
Domaine → Référence de secret → Secrets Provider → Infrastructure → Valeur du secret
```

Le domaine métier connaît **uniquement l'existence** d'un secret (sa référence + des métadonnées). La
**valeur** n'est résolue **qu'au moment de son utilisation**, par le Secrets Provider (ADR.21).

---

# Règles fonctionnelles

## RG-SEC-01 — Jamais exposé

Un secret ne doit **jamais** : apparaître dans les logs, être exposé dans une API, être affiché dans
une interface, être stocké dans un objet métier, être versionné dans Git (ADR.21 §Sécurité).

## RG-SEC-02 — Référence logique

Le domaine manipule une **référence** (identifiant logique), jamais la valeur. La résolution est
tardive (au point d'usage).

## RG-SEC-03 — Masquage

Les interfaces d'administration n'affichent que des **métadonnées** : type, fournisseur, **4 derniers
caractères** (`sk-…abcd`), portée, statut (« configuré / testé »), date. Jamais la valeur.

## RG-SEC-04 — Chiffrement au repos

Tout secret est **chiffré au repos**. L'application ne conserve qu'un **pointeur** + un statut ; la
valeur vit dans une infrastructure dédiée (K8s Secret / vault) selon l'environnement.

## RG-SEC-05 — Rotation transparente

Un secret peut être **renouvelé** sans recompilation, sans modification du domaine, sans migration
fonctionnelle (ADR.21 §Rotation).

## RG-SEC-06 — Portée (multi-organisation)

Un secret peut être rattaché à la **plateforme**, à une **organisation**, ou **exceptionnellement à un
utilisateur** lorsque cela est justifié (clé IA personnelle — chantier §2). Le contexte d'utilisation
définit la portée ; les organisations ne partagent pas leurs secrets (isolation — RG-ORG-05).

## RG-SEC-07 — Journalisation sans valeur

Chaque **accès** à un secret est journalisé : date, composant consommateur, type de secret, résultat —
**jamais** la valeur (ADR.21 §Journalisation).

## RG-SEC-08 — Portabilité

La plateforme fonctionne avec différents gestionnaires (K8s Secrets, Vault, AWS/Azure/GCP, variables
sécurisées). Le choix est une **décision d'infrastructure**, sans impact fonctionnel.

---

# Consommateurs

- **Connecteurs d'import** (ADR.13) : auth des sources (clé/token) via référence de secret (TSPEC.01).
- **Fournisseurs IA** (ADR.16) : clé API par portée (`AiConfig.secretRef` — TSPEC.07).
- **Configuration mail** (FSPEC.09) : identifiants SMTP / provider.
- **OAuth / API tierces** : client secrets, jetons.

---

# Parcours

- **Configurer un secret** : depuis une page de configuration (IA, mail, connecteur) → saisir la valeur
  → stockée chiffrée, référence créée → l'interface n'affiche plus que les métadonnées masquées →
  **tester**.
- **Utiliser un secret** : un composant demande la résolution par référence, au moment de l'appel
  externe uniquement.
- **Faire tourner un secret** : remplacer la valeur → la référence reste identique → aucun changement
  applicatif.

(Détail des écrans : UISPEC.08 Secrets — intégré aux pages de configuration.)

---

# Statut & métadonnées d'un secret

Un secret expose : **type**, **fournisseur**, **portée** (plateforme/organisation/utilisateur), **4
derniers caractères**, **statut** (configuré / testé / échec / expiré), **dates** (création, dernière
rotation, expiration éventuelle). Ces métadonnées **ne sont pas** sensibles et peuvent être affichées.

---

# Correspondance avec la V2

- La V2 externalise déjà la configuration et **injecte les secrets par Kubernetes** (règle d'or §10),
  sans composant applicatif dédié. La V3 **formalise** un Secrets Provider (référence logique, portées,
  rotation, journalisation, masquage) et l'ouvre aux **secrets utilisateurs/organisations** (clés IA).

---

# Hors périmètre (V3)

- Coffre-fort self-service exposé aux utilisateurs finaux (Backlog V4).
- Gestion de certificats à grande échelle / PKI interne (exploitation, hors spec fonctionnelle).

---

# Documents liés

99-ADR.21-SecretsManagement · 99-ADR.13/16/18/23 · 03-TSPEC.08-Secrets-v3.0 ·
04-UISPEC.08-Secrets-v3.0 · 02-FSPEC.07-AI-v3.0 · 02-FSPEC.09-Configuration-v3.0 ·
02-FSPEC.01-Import-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de la gestion des secrets (références logiques, portées, masquage, rotation, journalisation). |
