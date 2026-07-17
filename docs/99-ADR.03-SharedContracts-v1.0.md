# ADR.03 — Shared Contracts

**Statut** : Accepted

**Version** : 1.0

---

# Contexte

Les composants communiquent de manière asynchrone.

Le partage de modèles internes créerait un couplage fort.

---

# Décision

Tous les échanges utilisent exclusivement les contrats définis dans :

shared/contracts

Les contrats constituent les frontières officielles du système.

Chaque composant dépend uniquement de ces contrats.

---

# Alternatives considérées

Partager les modèles métiers.

Rejeté.

Le couplage devient trop important.

---

# Conséquences

Avantages :

- découplage ;
- versionnement ;
- compatibilité ;
- remplacement simple d'un composant.

Inconvénients :

- maintenance d'une bibliothèque supplémentaire.

---

# Documents impactés

- TSPEC.01
- TSPEC.03
- TSPEC.04
- TSPEC.05
- TSPEC.07