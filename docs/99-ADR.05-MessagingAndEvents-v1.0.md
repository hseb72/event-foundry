# ADR.05 — Messaging & Events

**Statut** : Draft

**Version** : 1.0

---

# Contexte

Le pipeline repose aujourd'hui sur BullMQ et des contrats de données.

À mesure que le système évoluera, des intégrations externes et des traitements additionnels pourront être ajoutés.

---

# Décision

Distinguer :

- les contrats de données ;
- les événements métier.

Exemple :

OCRCompleted

↓

OCRResult

ou

ClassificationCompleted

↓

ClassificationResult

Les événements déclenchent les traitements.

Les contrats transportent les données.

---

# Alternatives considérées

Utiliser uniquement les contrats.

Conservée pour la V1.

---

# Conséquences

Avantages :

- meilleure extensibilité ;
- intégration facilitée ;
- architecture orientée événements.

Inconvénients :

- complexité supplémentaire.

Cette ADR reste en statut Draft jusqu'à son adoption.

---

# Documents impactés

- TSPEC.03
- TSPEC.07