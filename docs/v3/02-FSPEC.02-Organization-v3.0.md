# Organization — Spécification fonctionnelle

**Document** : FSPEC.02

**Fichier** : 02-FSPEC.02-Organization-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le domaine **Organization** de la V3 : l'organisation devient une **entité métier de premier
niveau** qui porte les ressources mutualisées (connecteurs, événements, médias, secrets, paramètres,
notifications, adresses, statistiques) et le travail collaboratif de plusieurs membres.

Cette spécification met en œuvre la décision **ADR.18** (Organization Domain Model), dans le respect
des principes de l'**ADR.12** et du modèle d'identité de la V2 (une identité de compte, plusieurs
rôles). Elle intègre le chantier §8 (adresses d'organisation, page de paramètres à la main de
l'organizer).

> **Distinction fondamentale** : `Organization` = **tenant** (structure réelle : boutique, club,
> association, mairie…) qui possède des ressources et des membres. Elle **ne remplace pas** `Organizer`,
> qui reste une **fiche référentielle du catalogue** (données descriptives d'un organisateur, sans
> compte). Une organisation peut *référencer* un Organizer du catalogue, jamais l'inverse.

---

# Acteurs & rôles d'organisation

L'appartenance d'un utilisateur à une organisation est une **relation Many-to-Many enrichie par un
rôle contextuel** (ADR.18). Ce rôle est **local à l'organisation** et distinct des rôles de plateforme
(Explorer / Organizer / Operator) et des permissions RBAC V2.

| Rôle d'organisation | Capacités (résumé) |
|---------------------|--------------------|
| **Owner** | Tout, dont la suppression/l'archivage de l'organisation et le transfert de propriété. Au moins un Owner en permanence. |
| **Administrator** | Gérer membres, paramètres, adresses, connecteurs, secrets, notifications. Ne peut ni supprimer l'organisation ni retirer le dernier Owner. |
| **Editor** | Créer / modifier / publier des événements et médias de l'organisation. Pas d'accès aux membres ni aux secrets. |
| **Contributor** | Créer des brouillons (imports, EventCandidates) ; ne publie pas seul. |
| **Viewer** | Lecture seule (événements, statistiques). |

- Un utilisateur peut appartenir à **plusieurs** organisations, avec un rôle **différent** dans chacune.
- Une organisation compte **au moins un Owner** à tout instant (invariant).
- Le rôle d'organisation **module** les permissions ; il ne les remplace pas : une opération org-scoped
  exige *à la fois* la permission de plateforme (ex. `organization.manage`, `event.publish`) *et* un
  rôle d'organisation suffisant sur l'organisation ciblée.

---

# Contexte d'organisation active

Un utilisateur membre de plusieurs organisations agit **au nom d'une organisation à la fois**
(ADR.18). L'**organisation active** est un contexte explicite :

- sélectionnable dans l'interface (sélecteur d'organisation) ;
- propagé au backend sur chaque opération org-scoped (en-tête / paramètre de contexte) ;
- vérifié : l'utilisateur doit posséder un rôle sur l'organisation ciblée, sinon l'opération est
  rejetée (isolation multi-tenant — RG-ORG-05).

Toute ressource créée pendant ce contexte **appartient à l'organisation active**, jamais à l'utilisateur.

---

# Ressources rattachées à une organisation

Appartiennent à l'organisation (et non à un utilisateur) : **connecteurs**, **événements publiés**,
**médias**, **secrets** (références logiques — ADR.21), **paramètres** (fonctionnels et techniques),
**notifications** (configuration org), **adresses**, **membres**, **statistiques**, **clés d'API**.

Les **données personnelles** de l'utilisateur (identité, préférences, thème, clés IA personnelles)
restent **indépendantes** de toute organisation (FSPEC.05 Preferences, FSPEC.11 Profil).

> Les clés IA peuvent exister **par utilisateur** *et* **par organisation** (ADR.16/ADR.21). Une clé
> d'organisation s'applique aux imports réalisés au nom de l'organisation ; une clé personnelle
> s'applique aux usages personnels. Le détail est porté par FSPEC.07 (AI).

---

# Adresses d'organisation (chantier §8.2)

Une organisation porte **zéro, une ou plusieurs adresses** structurées. Chaque adresse s'appuie sur le
modèle de localisation V3 (**pays + code postal → commune**, région dérivée — FSPEC.03 Localization).

- Champs d'une adresse : **libellé** (ex. « Boutique centre-ville »), **pays**, **code postal**,
  **commune** (résolue), **ligne(s) de rue**, complément optionnel ; **région dérivée** (lecture seule).
- Une adresse peut être marquée **principale** (une seule par organisation).
- **Création manuelle d'un événement** : les adresses de l'organisation active sont **proposées** comme
  choix de localisation (parcours naturel de l'organizer). L'utilisateur peut toujours saisir une autre
  localisation (RG-ORG-06).

> **[à trancher — porté en FSPEC.03/TSPEC.02]** Relation adresse d'organisation ↔ entité `Venue`
> (référentiel) ↔ localisation de l'`Event` : une adresse alimente-t-elle un `Venue`, ou l'`Event`
> référence-t-il l'adresse ? Recommandation : l'adresse d'organisation **propose** une localisation
> (pays/cp/commune) et **peut** matérialiser un `Venue` réutilisable, sans couplage forcé.

---

# Cycle de vie d'une organisation (ADR.18)

```
Created → Active → Suspended → Archived → Deleted
                 ↘ (réactivation) ↗
```

- **Created** : organisation initialisée (au moins un Owner), non encore opérationnelle.
- **Active** : pleinement opérationnelle.
- **Suspended** : accès gelé (décision Operator / non-conformité) ; ressources conservées, opérations
  bloquées ; réactivable.
- **Archived** : mise hors service à l'initiative de l'organisation ; lecture seule ; réactivable.
- **Deleted** : suppression logique ; conservation selon la politique d'archivage.

Chaque changement d'état est **historisé** (qui, quand, pourquoi) — base d'audit et de statistiques.

---

# Règles fonctionnelles

## RG-ORG-01 — Organisation propriétaire des ressources

Les ressources métier mutualisées appartiennent à l'organisation, jamais à un utilisateur. Le départ
d'un membre ne retire aucune ressource à l'organisation.

## RG-ORG-02 — Rôle contextuel

Le rôle d'un utilisateur est **local** à chaque organisation. Un même utilisateur peut être Owner ici
et Viewer ailleurs. Le rôle module — et ne remplace pas — les permissions de plateforme.

## RG-ORG-03 — Invariant Owner

Une organisation possède **au moins un Owner** à tout instant. Retirer/rétrograder le dernier Owner
est refusé (il faut d'abord promouvoir un autre Owner).

## RG-ORG-04 — Agir au nom d'une organisation

Toute opération org-scoped est réalisée dans le **contexte d'une organisation active** explicite ;
la ressource produite appartient à cette organisation.

## RG-ORG-05 — Isolation multi-tenant

Un utilisateur n'accède qu'aux organisations pour lesquelles il détient un rôle. Toute tentative
d'accès à une organisation tierce est rejetée (ni lecture, ni écriture, ni énumération).

## RG-ORG-06 — Adresses proposées, jamais imposées

Les adresses de l'organisation sont **proposées** à la création d'un événement ; l'utilisateur peut
choisir une autre localisation. Aucune adresse n'est déduite automatiquement.

## RG-ORG-07 — Gouvernance de la page de paramètres (chantier §8.3)

La page de paramètres d'organisation est **gérée par l'organizer** (permission `organization.manage`
+ rôle Owner/Administrator sur l'organisation). L'**admin plateforme (Operator) n'y intervient qu'à la
demande** de l'organisation (support / correction). **[à trancher — porté en TSPEC.02]** restriction
**dure** (l'Operator ne peut pas écrire les paramètres) **vs** convention **support-only** (accès
conservé mais **tracé et audité**). Recommandation : support-only tracé.

## RG-ORG-08 — Traçabilité du cycle de vie & des membres

Chaque changement d'état de l'organisation et chaque changement d'appartenance/rôle est historisé
(audit). Aucune modification silencieuse.

---

# Parcours

- **Créer une organisation** : un utilisateur crée une organisation → il en devient **Owner** →
  l'organisation passe `Created` puis `Active` → il configure identité, adresses, membres.
- **Inviter / gérer un membre** : un Owner/Administrator invite un utilisateur → attribue un rôle
  d'organisation → le membre y accède avec le rôle attribué.
- **Basculer d'organisation** : l'utilisateur change d'organisation active → le contexte des
  opérations et des ressources visibles change en conséquence.
- **Renseigner une adresse** : Owner/Administrator ajoute une adresse (pays + code postal → commune) →
  disponible comme localisation proposée pour les événements.

(Détail des écrans : UISPEC.02 Organization.)

---

# Correspondance avec la V2 implémentée

- La V2 possède déjà une notion de **tenant / organisation** (Identity V2) et la permission
  `organization.manage` détenue par le rôle Organizer. La V3 **élève** cette notion en entité de premier
  niveau avec ressources rattachées, rôles contextuels et adresses.
- Les rôles de **plateforme** (Explorer/Organizer/Operator) et le **RBAC atomique** (ADR.08) sont
  conservés ; le rôle d'organisation s'y **ajoute** comme dimension contextuelle.
- `Organizer` (fiche catalogue) reste **inchangé** et distinct de `Organization` (tenant).

---

# Hors périmètre (V3)

- Multi-équipes / multi-établissements / multi-marques au sein d'une organisation (préparés par le
  modèle — ADR.18 — mais **non implémentés** en V3 ; Backlog V4).
- Facturation / plans par organisation (Backlog V4).
- Fédération inter-organisations (Backlog V4).

---

# Documents liés

99-ADR.18-OrganizationDomainModel · 99-ADR.12-PlatformArchitecturePrinciples ·
99-ADR.21-SecretsManagement · 03-TSPEC.02-Organization-v3.0 · 04-UISPEC.02-Organization-v3.0 ·
02-FSPEC.03-Localization-v3.0 · 02-FSPEC.05-Preferences-v3.0 · 02-FSPEC.07-AI-v3.0 ·
01-ARCHI.01-Domain-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle du domaine Organization (entité de premier niveau, rôles contextuels, ressources rattachées, adresses, cycle de vie). |
