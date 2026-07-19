# ADR.01 — Architecture Style

**Statut** : Accepted

**Version** : 1.0

---

# Contexte

EventFoundry est une application composée de plusieurs responsabilités distinctes :

- API REST
- Persistance
- Acquisition
- OCR
- Classification experte
- Validation utilisateur

Ces responsabilités présentent des contraintes de charge, de scalabilité et de maintenance différentes.

Une architecture monolithique traditionnelle conduirait à un couplage important entre ces traitements.

---

# Décision

Adopter une architecture modulaire orientée services.

Les traitements spécialisés sont externalisés dans des Workers indépendants.

Chaque composant possède une responsabilité unique.

Le Backend orchestre les traitements sans réaliser les opérations spécialisées (OCR, classification).

---

# Alternatives considérées

## Monolithe

Rejeté.

Couplage important et faible évolutivité.

---

## Microservices complets

Rejeté.

Complexité disproportionnée pour la V1.

---

# Conséquences

Avantages :

- découplage fort ;
- scalabilité horizontale ;
- testabilité ;
- déploiement indépendant.

Inconvénients :

- orchestration plus complexe ;
- communication asynchrone.

---

# Documents impactés

- TSPEC.01
- TSPEC.03
- TSPEC.04
- TSPEC.05
- TSPEC.06