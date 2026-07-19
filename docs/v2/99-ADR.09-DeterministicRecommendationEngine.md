# ADR.09 – Deterministic Recommendation Engine

**Document** : ADR.09

**Fichier** : 99-ADR.09-DeterministicRecommendationEngine.md

**Version** : 2.0

**Statut** : Accepted

---

# Contexte

L'assistant culturel constitue le cœur d'EventFoundry V2.

La plateforme doit proposer des recommandations pertinentes tout en restant maîtrisable et explicable.

---

# Décision

Le moteur de recommandation repose exclusivement sur des règles métier déterministes.

Aucun modèle d'intelligence artificielle générative n'intervient dans le processus de décision.

---

# Sources

Les recommandations peuvent utiliser :

- le planning ;
- les réservations ;
- les participations ;
- les suivis ;
- les préférences ;
- la proximité ;
- les métadonnées des événements.

---

# Principes

Chaque recommandation doit être :

- reproductible ;
- explicable ;
- justifiable ;
- paramétrable.

Deux utilisateurs présentant le même contexte obtiennent les mêmes recommandations.

---

# Explicabilité

Chaque proposition doit pouvoir afficher sa justification.

Exemples :

- organisateur suivi ;
- créneau libre ;
- activité similaire ;
- proximité.

---

# Pourquoi ce choix

Le moteur devient :

- testable ;
- prédictible ;
- simple à maintenir ;
- conforme à la philosophie du produit.

---

# Alternatives étudiées

## LLM

Rejeté.

Impossible de garantir la reproductibilité.

Coût élevé.

Explicabilité insuffisante.

---

## Machine Learning

Rejeté.

Volume de données insuffisant.

Complexité injustifiée.

---

# Conséquences

Le moteur évolue uniquement par ajout de règles métier.

Les règles restent entièrement maîtrisées.

La confiance utilisateur est renforcée.

---

# Documents liés

12-V2.02-RecommendationEngine-v2.0

12-V2.03-Planning-v2.0

11-V2.01-ProductVision-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Adoption d'un moteur déterministe. |