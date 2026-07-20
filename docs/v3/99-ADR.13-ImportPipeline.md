# ADR.13 – Import Pipeline

**Document** : ADR.13

**Fichier** : 99-ADR.13-ImportPipeline.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

L'ADR.12 introduit un framework de connecteurs permettant d'intégrer tout type de fournisseur de données.

Cependant, l'extraction de données ne constitue que la première étape d'un import.

Une fois les informations récupérées, la plateforme doit appliquer une succession de traitements permettant de transformer des données hétérogènes en événements exploitables par le domaine métier.

Ces traitements sont indépendants du fournisseur.

Ils doivent donc être mutualisés au sein d'un pipeline unique.

---

# Problème

Les fournisseurs retournent des données très différentes.

Les différences peuvent concerner :

- le format ;
- la qualité ;
- la richesse des informations ;
- la présence ou l'absence de médias ;
- les coordonnées géographiques ;
- les catégories ;
- les dates.

Sans pipeline commun, chaque connecteur serait amené à implémenter ses propres traitements.

Cette approche conduirait rapidement à :

- une duplication du code ;
- des règles de validation incohérentes ;
- des comportements différents selon le fournisseur ;
- une difficulté à superviser les imports.

---

# Décision

Tous les imports exécutés par EventFoundry suivent un pipeline unique.

Chaque étape possède une responsabilité unique.

Chaque étape reçoit un résultat provenant de l'étape précédente.

Elle ne connaît jamais les traitements qui suivent.

Cette séparation garantit :

- la lisibilité ;
- la testabilité ;
- l'extensibilité ;
- l'observabilité.

---

# Pipeline

Le pipeline V3 est composé des étapes suivantes.

```
            Discovery
                 │
                 ▼
              Fetch
                 │
                 ▼
             Extract
                 │
                 ▼
             Raw Event
                 │
                 ▼
             Validate
                 │
                 ▼
            Normalize
                 │
                 ▼
           Deduplicate
                 │
                 ▼
             Persist
                 │
                 ▼
          Publish Events
                 │
                 ▼
              Notify
```

Chaque étape est indépendante.

---

# Discovery

La phase de découverte identifie la source à traiter.

Exemples :

- URL fournie par un utilisateur ;
- connecteur planifié ;
- fichier importé ;
- message Discord ;
- flux RSS.

Cette étape ne lit aucune donnée métier.

Elle prépare uniquement l'acquisition.

---

# Fetch

La phase de récupération obtient les données depuis la source.

Selon le fournisseur, il peut s'agir :

- d'un téléchargement HTTP ;
- d'un appel API ;
- de la lecture d'un fichier ;
- de la récupération d'un message ;
- d'une capture de contenu.

Le résultat reste fidèle à la source.

Aucune interprétation métier n'est réalisée.

---

# Extract

L'extraction transforme le document obtenu en une collection d'objets manipulables.

Cette étape dépend du fournisseur.

Elle peut par exemple :

- parser du HTML ;
- lire un JSON ;
- interpréter un CSV ;
- exécuter un OCR ;
- décoder un PDF.

Elle produit exclusivement des objets `RawEvent`.

---

# Raw Event

Le Raw Event représente fidèlement les données produites par le fournisseur.

Toutes les informations sont conservées.

Aucune normalisation n'est appliquée.

Le Raw Event constitue le contrat entre le connecteur et le reste de la plateforme.

Sa définition est décrite dans l'ADR.14.

---

# Validate

Cette étape vérifie la cohérence minimale des données.

Exemples :

- identifiant présent ;
- titre présent ;
- structure valide ;
- données obligatoires renseignées.

Les événements invalides sont rejetés avant toute transformation.

La validation ne réalise aucune correction.

---

# Normalize

La normalisation transforme les données spécifiques au fournisseur vers le modèle commun utilisé par EventFoundry.

Exemples :

- coordonnées GPS ;
- dates ;
- adresses ;
- catégories ;
- téléphones ;
- URLs ;
- médias.

Cette étape n'interprète jamais le métier.

Elle harmonise uniquement les données.

---

# Deduplicate

La plateforme recherche l'existence d'un événement déjà connu.

Cette étape est indépendante du fournisseur.

Les mêmes règles de rapprochement sont utilisées pour tous les imports.

Le résultat peut conduire :

- à la création d'un nouvel événement ;
- à la mise à jour d'un événement existant ;
- au rejet d'un doublon.

---

# Persist

Les événements sont enregistrés dans le catalogue.

Les données brutes sont conservées.

L'historique complet de l'import est enregistré.

Les statistiques sont mises à jour.

---

# Publish Events

Une fois l'import terminé, des événements métier sont publiés.

Exemples :

- ImportCompleted
- EventCreated
- EventUpdated
- ImportFailed

Le pipeline ne connaît pas les consommateurs de ces événements.

---

# Notify

Les notifications sont déclenchées par les événements métier.

Le pipeline ne décide jamais :

- qui notifier ;
- comment notifier ;
- quand notifier.

Ces décisions relèvent du moteur de notifications (ADR.16).

---

# Principes

Le pipeline respecte les principes suivants.

## Responsabilité unique

Chaque étape réalise une seule fonction.

---

## Déterminisme

À données identiques, le pipeline produit toujours le même résultat.

---

## Traçabilité

Chaque étape peut être auditée.

Les traitements sont historisés.

---

## Observabilité

Chaque étape produit :

- des journaux ;
- des métriques ;
- des statistiques.

Les erreurs sont localisées précisément.

---

## Rejouabilité

Un import peut être rejoué à partir des Raw Events.

Le fournisseur n'a pas besoin d'être sollicité une seconde fois.

---

## Extensibilité

Une nouvelle étape peut être ajoutée sans modifier les autres.

Cette propriété garantit l'évolutivité du pipeline.

---

# Conséquences

Cette décision implique que :

- tous les connecteurs utilisent le même pipeline ;
- les traitements métier deviennent totalement indépendants des fournisseurs ;
- les responsabilités sont clairement réparties ;
- la supervision est homogène sur l'ensemble des imports.

Le pipeline devient le mécanisme central de transformation des données au sein de la plateforme.

---

# Alternatives étudiées

## Pipeline spécifique à chaque fournisseur

Chaque connecteur implémente librement ses traitements.

Cette approche offre une grande souplesse.

Elle conduit cependant à une forte duplication des traitements et à une maintenance complexe.

Cette solution est rejetée.

---

## Pipeline commun

Tous les fournisseurs suivent exactement les mêmes étapes.

Les différences sont limitées aux phases Discovery, Fetch et Extract.

Cette solution garantit une architecture homogène.

Elle est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.Import.*

03-TSPEC.Import.*

03-TSPEC.Connectors.*

04-UISPEC.Operator.*

99-ADR.*

---

# Documents liés

ADR.11 – Platform Architecture Principles

ADR.12 – Import Connector Framework

ADR.14 – Raw Event Model

ADR.16 – Notification Strategy

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Standardisation du pipeline d'import de la plateforme. |