# ADR.12 – Platform Architecture Principles

**Document** : ADR.12

**Fichier** : 99-ADR.12-PlatformArchitecturePrinciples.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

La V2 a permis de construire les fondations fonctionnelles d'EventFoundry.

Au cours de son développement, plusieurs principes d'architecture se sont imposés progressivement :

- séparation stricte des responsabilités ;
- moteur de recommandation déterministe ;
- séparation des expériences utilisateur ;
- architecture modulaire ;
- priorité donnée au planning.

La V3 introduit de nouveaux domaines techniques (framework de connecteurs, pipeline d'import, notifications, observabilité, configuration, IA).

Afin d'assurer leur cohérence, il est nécessaire de formaliser les principes architecturaux communs à l'ensemble de la plateforme.

Le présent ADR constitue la référence des décisions d'architecture de la V3.

---

# Décision

Les développements de la V3 respecteront les principes décrits dans le présent document.

Toute décision future incompatible avec l'un de ces principes devra faire l'objet d'un nouvel ADR.

---

# Principe n°1 — Simplicité

La simplicité constitue un objectif permanent.

Une solution simple sera toujours privilégiée à une solution plus complexe lorsqu'elles répondent au même besoin métier.

La complexité technique ne doit jamais être visible pour l'utilisateur.

---

# Principe n°2 — Responsabilité unique

Chaque composant possède une responsabilité clairement identifiée.

Exemples :

- un connecteur extrait des données ;
- un normaliseur transforme les données ;
- un validateur contrôle les données ;
- un moteur de recommandation produit des recommandations.

Aucun composant ne cumule plusieurs responsabilités majeures.

---

# Principe n°3 — Séparation des couches

La plateforme est organisée en couches indépendantes.

- Présentation
- API
- Services applicatifs
- Domaine métier
- Infrastructure

Chaque couche dépend uniquement des couches inférieures.

Le domaine métier reste indépendant de toute technologie.

---

# Principe n°4 — Déterminisme métier

Toutes les décisions métier doivent être déterministes.

À partir des mêmes données d'entrée, la plateforme doit produire les mêmes résultats.

Les décisions métier doivent pouvoir être expliquées.

---

# Principe n°5 — Architecture événementielle

Les domaines métier communiquent prioritairement au travers d'événements.

Les traitements asynchrones utilisent ces événements comme mécanisme de découplage.

Cette approche limite les dépendances directes entre modules.

---

# Principe n°6 — Extensibilité

L'ajout d'une nouvelle fonctionnalité ne doit pas nécessiter la modification des fonctionnalités existantes.

En particulier :

- un nouveau connecteur ne modifie pas les autres connecteurs ;
- un nouveau canal de notification ne modifie pas les notifications existantes ;
- une nouvelle IA ne modifie pas le domaine métier.

---

# Principe n°7 — Traçabilité

Toute donnée importante doit pouvoir être retracée jusqu'à son origine.

Les traitements doivent être auditables.

Les imports doivent conserver leur historique.

Les décisions doivent pouvoir être expliquées.

---

# Principe n°8 — Observabilité

Les traitements critiques produisent :

- des journaux ;
- des métriques ;
- des événements techniques ;
- des statistiques.

La plateforme doit permettre de comprendre le comportement d'un traitement sans reproduire le problème.

---

# Principe n°9 — Configuration avant développement

Les comportements variables doivent être pilotés par la configuration plutôt que par du code spécifique.

Exemples :

- activation d'un connecteur ;
- fréquence des notifications ;
- fournisseur IA ;
- configuration SMTP.

---

# Principe n°10 — Sécurité par défaut

Les informations sensibles sont protégées dès leur conception.

Les secrets :

- ne sont jamais versionnés ;
- ne sont jamais renvoyés en clair ;
- sont chiffrés au repos ;
- sont externalisés lorsque cela est possible.

---

# Principe n°11 — Indépendance des fournisseurs

La plateforme ne dépend d'aucun fournisseur particulier.

Les services externes sont encapsulés derrière des interfaces.

Cette règle s'applique notamment :

- aux connecteurs ;
- aux fournisseurs IA ;
- aux fournisseurs de messagerie ;
- aux services cartographiques.

---

# Principe n°12 — Évolutivité

L'architecture doit permettre une montée en charge progressive.

Les traitements peuvent être répartis.

Les composants peuvent être répliqués indépendamment.

Les traitements longs sont exécutés de manière asynchrone.

---

# Conséquences

L'ensemble des nouveaux développements de la V3 devront respecter ces principes.

Les ADR suivants préciseront leur application à différents domaines de la plateforme :

- Framework de connecteurs ;
- Pipeline d'import ;
- Modèle Raw Event ;
- IA ;
- Notifications ;
- Observabilité ;
- Gestion des secrets ;
- Préférences utilisateur.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.*

03-TSPEC.*

04-UISPEC.*

99-ADR.*

---

# Documents liés

10-STRAT.01-ProductVision-v3.0

01-ARCHI.01-Domain-v3.0

01-ARCHI.02-Architecture-v3.0

01-ARCHI.03-DataModel-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première formalisation des principes fondateurs de l'architecture de la V3. |