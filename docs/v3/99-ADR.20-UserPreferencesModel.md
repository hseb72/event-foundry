# ADR.20 – User Preferences Model

**Document** : ADR.20

**Fichier** : 99-ADR.20-UserPreferencesModel.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

Chaque utilisateur possède des préférences personnelles influençant son expérience au sein de la plateforme.

Ces préférences ne relèvent pas du métier proprement dit.

Elles permettent d'adapter le comportement de la plateforme sans modifier les règles fonctionnelles.

La V3 introduit de nombreuses possibilités de personnalisation.

Une architecture cohérente est nécessaire afin d'éviter la dispersion des paramètres dans l'ensemble du domaine.

---

# Problème

Les préférences utilisateur concernent de nombreux domaines.

Par exemple :

- notifications ;
- langues ;
- fuseau horaire ;
- unités ;
- affichage ;
- confidentialité ;
- recommandations ;
- intelligence artificielle.

Stocker ces paramètres directement dans chaque module conduirait à :

- une duplication des informations ;
- des incohérences ;
- une maintenance complexe ;
- une faible évolutivité.

Une approche centralisée est préférable.

---

# Décision

Toutes les préférences personnelles sont regroupées dans un modèle métier unique nommé **User Preferences**.

Ce modèle constitue la référence officielle des préférences d'un utilisateur.

Les autres composants consultent ce modèle mais n'en deviennent jamais propriétaires.

---

# Objectifs

Le modèle poursuit plusieurs objectifs.

## Centraliser

Toutes les préférences sont regroupées dans un même périmètre fonctionnel.

---

## Personnaliser

Chaque utilisateur adapte la plateforme selon ses besoins.

Les préférences n'ont aucun impact sur les autres utilisateurs.

---

## Découpler

Les modules métier restent indépendants des mécanismes de personnalisation.

Ils consultent uniquement les préférences nécessaires à leur fonctionnement.

---

## Préparer les évolutions

De nouvelles préférences peuvent être ajoutées sans remettre en cause l'architecture existante.

---

# Catégories de préférences

Les préférences sont organisées par domaine fonctionnel.

---

## Général

Exemples :

- langue ;
- fuseau horaire ;
- format de date ;
- format d'heure ;
- unités.

---

## Interface

Exemples :

- thème ;
- densité d'affichage ;
- préférences visuelles ;
- page d'accueil.

---

## Notifications

Exemples :

- canaux autorisés ;
- fréquence ;
- catégories ;
- mode silencieux.

Le détail du fonctionnement est défini dans l'ADR.17.

---

## Découverte

Exemples :

- rayon de recherche ;
- activités favorites ;
- lieux favoris ;
- niveau de personnalisation.

---

## Intelligence artificielle

Exemples :

- fournisseur préféré ;
- autorisation d'utilisation ;
- paramètres de confidentialité.

Ces préférences complètent les principes définis dans l'ADR.16.

---

## Confidentialité

Exemples :

- visibilité du profil ;
- partage des activités ;
- autorisation des statistiques anonymisées.

---

# Responsabilités

Le modèle User Preferences est responsable :

- de conserver les préférences personnelles ;
- de fournir une configuration cohérente aux différents modules ;
- d'assurer la persistance de ces préférences.

Il ne prend aucune décision métier.

---

# Héritage

Les préférences sont résolues selon une hiérarchie.

Ordre de priorité :

1. Valeurs système.
2. Valeurs de l'organisation.
3. Préférences personnelles.

Chaque niveau surcharge le précédent.

Cette hiérarchie garantit un comportement cohérent tout en permettant la personnalisation.

---

# Évolution

Les nouvelles préférences doivent respecter les principes suivants :

- indépendance des autres domaines ;
- valeur par défaut explicite ;
- rétrocompatibilité ;
- documentation.

---

# Sécurité

Les préférences ne contiennent pas :

- de secrets ;
- de mots de passe ;
- de jetons d'accès.

Ces informations relèvent du modèle de gestion des secrets.

---

# Conséquences

Cette décision implique que :

- les préférences utilisateur sont centralisées ;
- les modules métier restent indépendants des mécanismes de personnalisation ;
- les nouvelles préférences peuvent être ajoutées progressivement ;
- les règles métier demeurent inchangées quelles que soient les préférences choisies.

Le modèle User Preferences devient le point d'entrée unique de toute personnalisation individuelle.

---

# Alternatives étudiées

## Préférences réparties dans chaque module

Chaque composant gère ses propres paramètres.

Cette approche paraît simple mais entraîne rapidement des incohérences et une duplication des informations.

Cette solution est rejetée.

---

## Modèle centralisé

Toutes les préférences sont regroupées dans un modèle unique.

Les modules consultent uniquement les paramètres dont ils ont besoin.

Cette solution garantit la cohérence, la simplicité d'évolution et une meilleure maintenabilité.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.User.*

02-FSPEC.Notification.*

02-FSPEC.Discovery.*

03-TSPEC.User.*

03-TSPEC.Settings.*

04-UISPEC.*

99-ADR.*

---

# Documents liés

ADR.16 – AI Boundaries

ADR.17 – Notification Framework

ADR.18 – Organization Domain Model

ADR.19 – Follow Domain Model

ADR.21 – Secrets Management

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction du modèle centralisé de gestion des préférences utilisateur. |