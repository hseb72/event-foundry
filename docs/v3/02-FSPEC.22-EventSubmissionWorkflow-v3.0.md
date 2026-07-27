# Event Submission Workflow

**Document** : FSPEC.22

**Fichier** : 02-FSPEC.22-EventSubmissionWorkflow-v3.0.md

**Version** : 3.0

**Statut** : Validé

---

# 1. Objectif

Cette spécification décrit le processus de soumission d'événements dans EventFoundry.

Ce processus permet aux utilisateurs de transmettre un ou plusieurs événements à partir de différentes sources (image, document, texte ou URL), de les faire analyser automatiquement, de les qualifier puis, selon leur contexte, de les publier ou de les conserver comme événements privés.

Le workflow est commun aux expériences **Explorer** et **Organizer**.

Les différences de comportement n'interviennent qu'après la validation des événements.

---

# 2. Principes généraux

Le processus de soumission repose sur les principes suivants :

- une soumission représente une demande de traitement ;
- une soumission peut produire plusieurs événements ;
- chaque événement est traité indépendamment ;
- un événement peut nécessiter une intervention humaine sans bloquer les autres événements issus de la même soumission ;
- la plateforme privilégie l'automatisation lorsque cela est possible.

---

# 3. Concepts

Le workflow repose sur quatre objets métier distincts.

| Objet | Description |
|--------|-------------|
| Event Submission | Demande de création d'événements. |
| Source Document | Document ou contenu fourni par l'utilisateur. |
| Event Draft | Proposition d'événement issue de l'analyse. |
| Event | Événement validé utilisable par la plateforme. |

---

# 4. Workflow général

```text
Explorer                  Organizer
     │                         │
     └────────────┬────────────┘
                  │
                  ▼
          Event Submission
                  │
                  ▼
        Analyse documentaire
          (OCR / Parsing)
                  │
                  ▼
             Texte brut
                  │
                  ▼
      Extraction des événements
                  │
             0..N Event Draft
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
 Qualification       Ouverture d'une Case
        │                   │
        ▼                   ▼
 Validation          Intervention Operator
        │
        ▼
      Event
        │
        ├── Explorer → événement privé
        │
        └── Organizer → publication
```

---

# 5. Sources d'entrée

Une Event Submission peut être créée à partir de :

- upload d'une image ;
- upload d'un document PDF ;
- glisser-déposer d'une image ;
- glisser-déposer d'un document ;
- glisser-déposer d'un fichier texte ;
- copier/coller de texte ;
- copier/coller d'une image ;
- saisie d'une URL.

Toutes les sources utilisent ensuite le même pipeline de traitement.

---

# 6. Création d'une Event Submission

Une Event Submission est créée dès que l'utilisateur transmet un contenu.

Elle reçoit immédiatement un identifiant unique.

Son traitement est entièrement asynchrone.

Elle possède son propre historique.

---

# 7. États d'une Event Submission

Une Event Submission possède les états suivants.

| Etat | Description |
|-------|-------------|
| En cours d'analyse | Analyse documentaire en cours. |
| Terminée | Tous les Event Draft ont été produits. |
| Échec | Le traitement n'a pas pu être réalisé. |

La Submission n'est jamais publiée.

Elle constitue uniquement le conteneur du traitement.

---

# 8. Analyse documentaire

L'analyse documentaire transforme le contenu fourni en texte brut.

Cette étape peut comprendre :

- OCR ;
- extraction de texte ;
- conversion PDF ;
- nettoyage ;
- normalisation.

Le résultat est un texte brut.

---

# 9. Extraction des événements

Le texte brut est analysé afin d'identifier les événements.

Une Submission peut produire :

- aucun événement ;
- un événement ;
- plusieurs événements.

Exemples :

- planning hebdomadaire ;
- programme de festival ;
- calendrier mensuel ;
- programme d'association.

Chaque événement détecté devient un Event Draft indépendant.

---

# 10. Event Draft

Un Event Draft représente une proposition d'événement.

Il contient notamment :

- titre ;
- description ;
- activité ;
- format ;
- organisateur ;
- lieu ;
- dates ;
- horaires ;
- informations complémentaires.

Chaque Draft possède son propre cycle de vie.

---

# 11. Qualification

Chaque Event Draft est qualifié indépendamment.

L'utilisateur peut :

- corriger les informations extraites ;
- compléter les informations manquantes ;
- supprimer un Draft ;
- confirmer le Draft.

La qualification d'un Draft n'a aucun impact sur les autres Drafts de la même Submission.

---

# 12. Validation

Une fois qualifié, chaque Draft est validé individuellement.

La validation transforme le Draft en Event.

Cette transformation peut être :

- automatique ;
- assistée ;
- soumise à modération.

---

# 13. Modération

Avant la validation définitive, les contrôles automatiques sont exécutés.

Ils peuvent notamment détecter :

- contenu interdit ;
- activité illicite ;
- fraude ;
- spam ;
- informations incohérentes ;
- doublons.

Si aucune anomalie n'est détectée, le Draft poursuit automatiquement son traitement.

Dans le cas contraire, une Case est créée.

---

# 14. Intervention des Operators

Les Operators n'interviennent jamais dans le workflow nominal.

Ils sont sollicités uniquement lorsqu'une Case est ouverte.

Une Case peut être créée :

- par les contrôles automatiques ;
- par un signalement utilisateur après publication.

Chaque Case est indépendante des autres Event Draft issus de la même Submission.

---

# 15. Comportement Explorer

Après validation :

l'Event devient un événement privé.

Il est visible uniquement par son créateur.

L'Explorer peut immédiatement :

- le marquer comme intéressé ;
- le réserver ;
- l'indiquer comme payé ;
- l'ajouter à son planning.

L'événement n'est pas publié dans le catalogue public.

## Origine durable (privé vs organisation)

Un événement **retient son origine** de façon durable :

- **événement privé personnel** (validation Explorer) : `visibility = PRIVATE`, `organizationId = null` ;
- **événement d'une organisation** (création / validation par un Organizer avec organisation active) :
  `visibility = PUBLIC`, `organizationId` renseigné ;
- **organisateur autonome** (sans organisation) : `visibility = PUBLIC`, `organizationId = null`.

Conséquence UX (expérience Explorer) : une **seule** entrée de menu « Mes événements privés » regroupe
la soumission (box « Nouvelle soumission » repliable), les soumissions en cours, la qualification des
brouillons et la **liste des événements privés**. Une fois qualifiés, les événements privés
apparaissent **ici**, jamais dans l'expérience Organizer (`organizationId` reste `null`).

Symétriquement (expérience Organizer) : une **seule** entrée « Nos événements » regroupe la soumission
(onglets Documents, Texte, URL, Fichiers structurés, Création), les soumissions en cours d'analyse, la
validation des brouillons et le **tableau des événements de l'organisation** (tri, pagination, bascule
de publication, archivage). Les événements y sont rattachés à l'organisation active (`organizationId`
renseigné).

### Origine « organisation » d'une soumission

L'origine est figée dès la soumission : un import (document, texte, URL, fichier structuré) réalisé
**depuis l'expérience Organizer** porte l'organisation active (`ImportJob.organizationId` renseigné) ;
un import réalisé en Explorer reste **personnel** (`organizationId = null`), même si l'utilisateur
appartient par ailleurs à une organisation. L'origine de l'`ImportJob` détermine dans quel inventaire
la soumission — puis le brouillon qui en découle — apparaît.

### Vue partagée d'équipe

Tous les agents disposant d'un rôle de gestion des événements dans une organisation partagent la
**même vue** sur les événements en cours de cette organisation, de l'analyse à l'archivage, et peuvent
**agir dessus** (valider, corriger, rejeter, publier, archiver) — y compris sur l'élément d'un
collègue absent ou parti. En conséquence, dans l'expérience Organizer, chaque inventaire (Soumissions,
Validation, Nos événements) affiche le **pseudo de l'auteur** (`createdByName`) pour permettre à chacun
de juger s'il est opportun d'agir sur l'événement d'un autre agent. La garde de propriété est élargie :
un agent peut agir sur tout brouillon issu d'une soumission **de sa propre organisation active** ; un
brouillon personnel (sans organisation) reste réservé à son auteur.

Cette information n'est **pas** exposée dans l'expérience Explorer (espace personnel) ni en découverte
publique : le pseudo de l'auteur n'apparaît que dans la vue d'organisation.

### Pagination côté serveur (tableau « Nos événements »)

Le tableau des événements de l'organisation est **paginé côté serveur** (`skip`/`take`, `total`
retourné) avec **tri directionnel** (`sortBy` ∈ {`startsAt`, `title`, `status`}, `sortDir` ∈
{`asc`, `desc`}) : une organisation active peut accumuler un grand nombre d'événements, au-delà de ce
qu'une pagination purement cliente peut charger.

---

# 16. Notification d'un Organizer

Si le Draft mentionne un Organizer déjà enregistré sur la plateforme, l'Explorer peut notifier cet Organizer.

Cette notification lui permet de constater qu'un événement le concernant existe déjà sous forme privée.

L'Organizer peut alors décider de :

- ignorer la notification ;
- créer son propre événement officiel ;
- publier une version officielle.

Cette notification ne transfère jamais la propriété de l'événement privé.

---

# 17. Comportement Organizer

Après validation :

l'Organizer peut publier immédiatement l'événement.

La publication rend l'événement disponible :

- dans les recherches ;
- dans les recommandations ;
- dans le calendrier ;
- dans les abonnements.

---

# 18. Historique

Les éléments suivants sont historisés :

- création de la Submission ;
- analyse documentaire ;
- texte extrait ;
- création des Event Draft ;
- qualification ;
- validation ;
- publication ;
- ouverture d'une Case ;
- décisions de modération.

---

# 19. Règles de gestion

| Identifiant | Règle |
|--------------|--------|
| ESUB-001 | Une Event Submission représente une demande de création d'événements. |
| ESUB-002 | Une Submission peut produire de 0 à N Event Draft. |
| ESUB-003 | Chaque Event Draft est traité indépendamment. |
| ESUB-004 | Une anomalie sur un Draft ne bloque pas les autres Drafts de la même Submission. |
| ESUB-005 | Chaque Draft possède son propre cycle de qualification. |
| ESUB-006 | Chaque Draft peut ouvrir une Case indépendamment. |
| ESUB-007 | Les Operators interviennent uniquement via une Case. |
| ESUB-008 | Un Event est créé uniquement après validation du Draft. |
| ESUB-009 | Les événements privés d'un Explorer ne sont pas publiés. |
| ESUB-010 | Les événements publiés par un Organizer deviennent accessibles au catalogue public. |
| ESUB-011 | Une notification à un Organizer ne transfère jamais la propriété d'un événement privé. |
| ESUB-012 | Toutes les étapes du workflow sont historisées. |
| ESUB-013 | L'origine d'une soumission est figée à la création : Organizer → organisation active ; Explorer → personnelle (`null`). |
| ESUB-014 | Tout agent d'une organisation peut agir sur les soumissions, brouillons et événements issus de cette organisation ; un brouillon personnel reste réservé à son auteur. |
| ESUB-015 | Dans l'expérience Organizer, chaque inventaire affiche le pseudo de l'auteur ; cette information n'est jamais exposée en Explorer ni en découverte publique. |

---

# 20. Critères d'acceptation

## AC-ESUB-001

Une Submission peut être créée depuis une image, un PDF, un texte ou une URL.

---

## AC-ESUB-002

Le traitement documentaire est asynchrone.

---

## AC-ESUB-003

Une Submission peut produire plusieurs Event Draft.

---

## AC-ESUB-004

Chaque Event Draft peut être qualifié indépendamment.

---

## AC-ESUB-005

Chaque Event Draft peut être validé ou rejeté sans impacter les autres.

---

## AC-ESUB-006

Une anomalie détectée sur un Draft ouvre une Case sans bloquer les autres Drafts.

---

## AC-ESUB-007

Les Operators n'interviennent que lorsqu'une Case est ouverte.

---

## AC-ESUB-008

Les événements validés par un Explorer restent privés.

---

## AC-ESUB-009

Les événements validés par un Organizer peuvent être publiés.

---

## AC-ESUB-010

L'ensemble du workflow est historisé.

---

# 21. Documents associés

- FSPEC.03 – Event Management
- FSPEC.10 – Explorer Experience
- FSPEC.11 – Organizer Experience
- FSPEC.20 – Platform Moderation
- FSPEC.21 – Case Management
- ADR – Artificial Intelligence
- ADR – Asynchronous Processing