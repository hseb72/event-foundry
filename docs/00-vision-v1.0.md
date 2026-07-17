# EventFoundry

**Document** : VISION  
**Fichier** : 00-Vision-v1.0.md  
**Version** : 1.0  
**Statut** : Validé

---

# Objectif

Construire une plateforme permettant de transformer des annonces d'événements publiées sous forme
d'image ou de texte en événements structurés, consultables et exploitables dans un calendrier.

Le produit est orienté dans un premier temps vers les communautés TCG, tout en restant
générique afin de pouvoir accueillir d'autres domaines (musique, sport, culture, jeux de société…).

Le produit ne cherche pas à remplacer Google Calendar ou Outlook.

Sa vocation est de découvrir, organiser et suivre des événements communautaires.

---

# Public cible V1

La première version cible les communautés TCG :

- Magic: The Gathering
- Pokémon
- Star Wars Unlimited
- Lorcana
- Flesh and Blood
- Riftbound
- One Piece

L'architecture devra permettre l'ajout d'autres domaines sans évolution du modèle métier.

---

# Les trois fonctions du produit

## 1. Import

L'utilisateur importe :

- une image
- ou un texte

---

## 2. Structuration

Le système :

- exécute un OCR (Tesseract) ;
- applique un moteur expert ;
- construit un ou plusieurs candidats d'événements.

L'utilisateur valide ou corrige les informations proposées.

---

## 3. Consultation

Deux vues principales :

- Découverte des événements
- Mon calendrier

---

# Fonctionnalités V1

La V1 comprend exclusivement :

1. Import d'image
2. Import de texte
3. OCR
4. Classification par moteur expert
5. Validation / correction
6. Création d'événements
7. Recherche et filtres
8. Vue Découverte
9. Vue Mon calendrier
10. Gestion de la participation utilisateur

Toute fonctionnalité absente de cette liste est considérée hors périmètre.

---

# Hors périmètre V1

- Synchronisation Discord
- Synchronisation Google Calendar
- Synchronisation Outlook
- Scraping
- Notifications
- Application mobile
- IA générative
- OCR Cloud
- Réseau social
- Commentaires
- Partage
- Recommandations
- Statistiques
- Géolocalisation avancée

Ces éléments seront étudiés uniquement après validation complète de la V1.

---

# Principes

- Simplicité avant tout.
- Aucun développement hors périmètre.
- Aucune décision métier basée sur un LLM.
- Toutes les images originales sont conservées.
- Toutes les classifications sont traçables.
- Les référentiels métier sont indépendants du code.

---

# Stack technique

## Frontend

- Angular

## Backend

- NestJS

## Base de données

- PostgreSQL

## Stockage objet

- MinIO

## Cache / File de traitement

- Redis
- BullMQ

## OCR

- Tesseract

## Classification

- Moteur expert

## Déploiement

- Kubernetes

## CI/CD

Pipeline existant.

---

# Définition de terminé

La V1 est terminée lorsque l'ensemble des fonctionnalités définies dans les spécifications
fonctionnelles est :

- développé ;
- testé ;
- documenté ;
- validé.

Aucune fonctionnalité V2 ne sera développée avant cette validation.

---

# Gouvernance documentaire

La documentation est la référence du projet.

Le projet est organisé selon les collections suivantes :

- **VISION** : vision produit
- **ARCHI** : architecture
- **FSPEC** : spécifications fonctionnelles
- **TSPEC** : spécifications techniques
- **BACKLOG** : évolutions hors périmètre
- **ADR** : décisions d'architecture

Toute évolution du périmètre V1 passe obligatoirement par une mise à jour des spécifications fonctionnelles avant développement.

---

# Historique

| Version | Description |
|----------|-------------|
| 1.0 | Première version validée. |