# ADR.15 – AI Boundaries

**Document** : ADR.15

**Fichier** : 99-ADR.15-AIBoundaries.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

La V3 introduit la possibilité d'utiliser des services d'intelligence artificielle afin d'améliorer certaines fonctionnalités de la plateforme.

Ces services peuvent intervenir lors de différentes opérations, notamment :

- extraction d'informations depuis une image ;
- OCR de documents ;
- transcription de contenu ;
- génération ou amélioration de descriptions ;
- traduction ;
- classification assistée.

L'intégration de ces capacités constitue une évolution importante de la plateforme.

Cependant, l'utilisation d'une intelligence artificielle introduit un niveau d'incertitude incompatible avec certaines décisions métier.

Une frontière claire doit donc être définie entre les responsabilités de l'IA et celles du domaine métier.

---

# Problème

Les modèles d'intelligence artificielle sont probabilistes.

Ils peuvent :

- produire des réponses différentes pour une même question ;
- évoluer au fil des mises à jour du fournisseur ;
- générer des erreurs ;
- inventer des informations absentes de la source.

Ces caractéristiques sont acceptables pour assister un utilisateur.

Elles sont en revanche incompatibles avec les exigences de reproductibilité et de traçabilité des traitements métier.

Sans règle explicite, le risque est de voir progressivement des décisions fonctionnelles être déléguées à l'IA.

Cette situation rendrait les comportements de la plateforme difficilement explicables et impossibles à reproduire de manière déterministe.

---

# Décision

L'intelligence artificielle est considérée comme un **service d'assistance**.

Elle peut proposer, enrichir ou extraire de l'information.

Elle ne prend jamais de décision métier.

Toutes les décisions ayant un impact fonctionnel restent déterministes et sont implémentées par les règles métier de la plateforme.

---

# Principes

L'utilisation de l'IA repose sur les principes suivants.

## Assistance

L'IA fournit une aide.

Elle ne remplace jamais les règles métier.

---

## Déterminisme

Une décision métier doit toujours produire le même résultat pour une même entrée.

Une réponse générée par une IA ne peut donc jamais constituer la seule base d'une décision fonctionnelle.

---

## Vérifiabilité

Les résultats produits par une IA doivent pouvoir être :

- contrôlés ;
- corrigés ;
- rejetés.

La plateforme doit toujours être capable d'expliquer la décision finale.

---

## Indépendance

Le domaine métier ne dépend d'aucun fournisseur d'intelligence artificielle.

Le remplacement d'un fournisseur ne doit entraîner aucune modification des règles fonctionnelles.

---

# Cas d'usage autorisés

L'IA peut être utilisée pour assister les traitements suivants.

## OCR

Extraction de texte à partir d'une image ou d'un document.

---

## Compréhension de documents

Extraction d'informations structurées depuis un contenu non structuré.

---

## Traduction

Traduction de descriptions ou d'informations textuelles.

---

## Reformulation

Amélioration de la qualité rédactionnelle d'un texte.

---

## Résumé

Production d'un résumé destiné à faciliter la lecture d'un contenu.

---

## Enrichissement

Compléter certaines informations lorsqu'elles peuvent être déduites de manière fiable à partir du contenu fourni.

---

# Cas d'usage interdits

L'IA ne peut jamais :

- décider qu'un événement est valide ;
- créer un événement sans validation du pipeline ;
- déterminer l'identité d'une organisation ;
- décider qu'un événement est un doublon ;
- attribuer automatiquement une catégorie métier définitive ;
- modifier les préférences d'un utilisateur ;
- planifier un événement dans l'agenda d'un utilisateur ;
- décider qu'une notification doit être envoyée ;
- modifier une donnée métier existante sans contrôle des règles métier.

Ces responsabilités appartiennent exclusivement au domaine fonctionnel.

---

# Intégration dans l'architecture

Les services d'IA sont considérés comme des fournisseurs externes.

Ils sont consommés au travers d'interfaces dédiées.

Le domaine métier n'accède jamais directement à une API d'intelligence artificielle.

Cette abstraction garantit l'indépendance de la plateforme vis-à-vis des fournisseurs.

---

# Configuration

Le choix du fournisseur d'IA est entièrement configurable.

La plateforme peut utiliser, selon le contexte :

- OpenAI ;
- Anthropic ;
- Google Gemini ;
- Mistral AI ;
- Ollama ;
- toute autre solution compatible.

L'architecture ne dépend d'aucun fournisseur particulier.

---

# Traçabilité

Chaque appel à une IA doit pouvoir être retracé.

Les informations suivantes sont conservées :

- fournisseur utilisé ;
- modèle utilisé ;
- date d'exécution ;
- version du prompt ;
- résultat obtenu ;
- durée d'exécution.

Cette traçabilité facilite les audits et le diagnostic des traitements.

---

# Confidentialité

Les données transmises à une IA doivent respecter la politique de sécurité de la plateforme.

Les informations sensibles ne sont envoyées que si cela est explicitement autorisé par la configuration.

La plateforme doit permettre de désactiver totalement l'utilisation de services d'IA.

---

# Conséquences

Cette décision implique que :

- les traitements métier restent entièrement déterministes ;
- les fournisseurs d'IA peuvent être remplacés sans impact fonctionnel ;
- les utilisateurs conservent la maîtrise des décisions importantes ;
- les résultats générés par une IA restent explicables et auditables.

L'intelligence artificielle devient un composant d'assistance de la plateforme, sans jamais constituer une source de vérité métier.

---

# Alternatives étudiées

## IA décisionnelle

Confier certaines décisions métier directement à un modèle d'intelligence artificielle.

Cette approche simplifie certains développements mais rend les traitements non déterministes, difficilement auditables et dépendants d'un fournisseur externe.

Cette solution est rejetée.

---

## IA d'assistance

Utiliser l'IA uniquement pour enrichir ou préparer les données avant leur traitement par le domaine métier.

Les décisions fonctionnelles restent implémentées par les règles de la plateforme.

Cette solution garantit la reproductibilité des traitements tout en bénéficiant des capacités offertes par les modèles d'intelligence artificielle.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.Import.*

02-FSPEC.AI.*

03-TSPEC.AI.*

03-TSPEC.Import.*

99-ADR.*

---

# Documents liés

ADR.11 – Platform Architecture Principles

ADR.12 – Import Connector Framework

ADR.13 – Import Pipeline

ADR.14 – Raw Event Model

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Définition des principes de gouvernance et des limites d'utilisation de l'intelligence artificielle au sein de la plateforme. |