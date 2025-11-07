# Cahier des Charges Fonctionnel
## Plateforme SaaS de Gestion Comptable Française - ISEB

**Version** : 1.0
**Date** : Novembre 2025
**Statut** : Document de référence

---

## =Ë Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Périmètre du projet](#2-périmètre-du-projet)
3. [Acteurs et utilisateurs](#3-acteurs-et-utilisateurs)
4. [Besoins fonctionnels](#4-besoins-fonctionnels)
5. [Architecture technique](#5-architecture-technique)
6. [Contraintes et exigences](#6-contraintes-et-exigences)
7. [Planning et roadmap](#7-planning-et-roadmap)
8. [Livrables](#8-livrables)

---

## 1. Contexte et objectifs

### 1.1 Contexte

Les cabinets d'expertise-comptable français cherchent à moderniser leurs services pour :
- Répondre aux attentes digitales de leurs clients (micro-entrepreneurs, associations, PME)
- Automatiser les tâches répétitives et chronophages
- Améliorer la collaboration avec leurs clients
- Se différencier par l'innovation technologique
- Respecter les évolutions réglementaires (facturation électronique 2026, FEC)

### 1.2 Objectifs du projet

**Objectif principal** : Développer une plateforme SaaS de gestion comptable complète, conforme à la législation française, basée sur Odoo.

**Objectifs spécifiques** :
- Offrir un espace de travail unifié pour les cabinets comptables
- Proposer un portail client intuitif et automatisé
- Automatiser la synchronisation bancaire et la catégorisation des transactions
- Faciliter la gestion des déclarations fiscales (TVA, liasses)
- Garantir la conformité RGPD et FEC
- Assurer une scalabilité via une infrastructure Docker moderne

### 1.3 Positionnement

**Modèle de référence** : Dougs.fr
**Différenciation** : Solution basée sur Odoo (extensible, personnalisable, open-source)

---

## 2. Périmètre du projet

### 2.1 Fonctionnalités incluses

#### Phase 1 - MVP (Q2 2025)
 Infrastructure Docker complète
 Module comptabilité française (PCG)
 Portail client de base
 Synchronisation bancaire (1 fournisseur minimum)
 Gestion des factures clients
 Tableau de bord trésorerie

#### Phase 2 - Production (Q3 2025)
 Portail cabinet complet (multi-clients)
 Déclarations TVA automatisées
 Intégration paie (PayFit ou Silae)
 Notes de frais avec OCR
 Workflow de validation
 Communication intégrée (chat, notifications)

#### Phase 3 - Scale (Q4 2025)
 Facturation électronique (Chorus Pro)
 IA pour catégorisation automatique
 Reporting analytique avancé
 API publique pour partenaires
 Application mobile (iOS/Android)

### 2.2 Fonctionnalités exclues (hors scope)

L Module CRM complet (utilisation du module Odoo standard)
L Gestion de la production industrielle
L E-learning / Formation intégrée
L Marketplace d'addons tiers

---

## 3. Acteurs et utilisateurs

### 3.1 Profils utilisateurs

| Profil | Rôle | Besoins principaux |
|--------|------|-------------------|
| **Expert-comptable** | Gestionnaire principal | Supervision multi-clients, validation écritures, déclarations fiscales |
| **Collaborateur cabinet** | Assistant comptable | Saisie comptable, catégorisation, préparation dossiers |
| **Client entrepreneur** | Utilisateur final | Consultation tableaux de bord, gestion factures, dépôt documents |
| **Client PME** | Utilisateur final avancé | + Notes de frais, reporting analytique, multi-utilisateurs |
| **Administrateur système** | IT/DevOps | Déploiement, monitoring, sauvegardes, maintenance |

### 3.2 Matrice de permissions

| Fonctionnalité | Expert-comptable | Collaborateur | Client Entrepreneur | Client PME | Admin |
|---------------|------------------|---------------|---------------------|-----------|-------|
| Vue multi-clients |  |  | L | L |  |
| Validation écritures |  |   (selon droits) | L | L | L |
| Déclarations fiscales |  |   | =A (lecture seule) | =A | L |
| Gestion factures |  |  |  |  | L |
| Synchro bancaire |  |  | =A | =A | L |
| Notes de frais |  |  |  |  | L |
| Configuration système | L | L | L | L |  |

---

## 4. Besoins fonctionnels

### 4.1 Espace Cabinet (Back-office Expert-Comptable)

#### 4.1.1 Gestion multi-clients

**Description** : Interface centralisée permettant de gérer tous les dossiers clients depuis un tableau de bord unique.

**Fonctionnalités** :
- Liste des clients avec filtres (statut, type, échéances)
- Fiche client complète (infos légales, mandats, historique)
- Vue consolidée par client : bilan, compte de résultat, TVA, trésorerie
- Indicateurs de santé financière (alertes trésorerie, échéances)
- Attribution de collaborateurs par dossier client

**Critères d'acceptation** :
- [ ] Affichage de tous les clients en moins de 2 secondes
- [ ] Filtres multiples fonctionnels (combinaisons)
- [ ] Export Excel/PDF de la liste clients
- [ ] Recherche instantanée par nom, SIRET, statut

#### 4.1.2 Workflow de validation

**Description** : Processus de validation des écritures comptables avant finalisation.

**Étapes** :
1. Saisie/Import des écritures (collaborateur)
2. Catégorisation automatique + revue manuelle
3. Soumission pour validation (collaborateur ’ expert)
4. Validation/Refus avec commentaires (expert)
5. Lettrage et pointage final

**Fonctionnalités** :
- File d'attente des écritures à valider
- Système de commentaires et annotations
- Historique des modifications
- Notifications automatiques (email + in-app)

**Critères d'acceptation** :
- [ ] Processus fluide sans rechargement de page
- [ ] Commentaires en temps réel
- [ ] Notifications instantanées (<5 secondes)
- [ ] Audit trail complet

#### 4.1.3 Gestion des déclarations fiscales

**Description** : Préparation, validation et télétransmission des déclarations fiscales françaises.

**Déclarations supportées** :
- TVA (CA3, CA12)
- Liasses fiscales :
  - 2033 (régime réel simplifié)
  - 2035 (BNC)
  - 2050 (régime réel normal)
- Déclaration de résultats
- CFE, CVAE

**Fonctionnalités** :
- Pré-remplissage automatique depuis la comptabilité
- Vérification des cohérences et anomalies
- Simulation avant dépôt
- Export XML conforme EDI-TVA
- Archivage automatique des déclarations déposées

**Critères d'acceptation** :
- [ ] Conformité format FEC
- [ ] Détection automatique des anomalies
- [ ] Export XML validé par les services fiscaux
- [ ] Historique complet des dépôts

#### 4.1.4 Communication client

**Description** : Outil de communication intégré pour échanger avec les clients.

**Canaux** :
- Chat intégré (temps réel)
- Commentaires sur documents
- Tâches partagées (TODO lists)
- Demandes de pièces justificatives
- Notifications email/SMS

**Fonctionnalités** :
- Messagerie contextuelle (par dossier client)
- Pièces jointes (drag & drop)
- Rappels automatiques (relances)
- Historique centralisé

---

### 4.2 Espace Client (Portail SaaS)

#### 4.2.1 Tableau de bord

**Description** : Vue d'ensemble de la santé financière de l'entreprise.

**Widgets** :
- Trésorerie (solde actuel, évolution sur 12 mois)
- Chiffre d'affaires (mensuel, annuel, comparaisons N-1)
- Charges (répartition par catégorie)
- Résultat net (mensuel, cumulé)
- TVA à décaisser
- Indicateurs clés (CA/charges, taux de marge, BFR)

**Critères d'acceptation** :
- [ ] Données actualisées en temps réel
- [ ] Graphiques interactifs (zoom, filtres)
- [ ] Export PDF du dashboard
- [ ] Responsive (mobile, tablette)

#### 4.2.2 Gestion des factures

**Description** : Module complet de facturation conforme à la réglementation française.

**Fonctionnalités** :
- Création de factures (devis ’ facture ’ avoir)
- Numérotation automatique conforme
- Catalogue produits/services
- Gestion des clients et fournisseurs
- Relances automatiques (email, courrier)
- Rapprochement bancaire automatique
- Exports multiples (PDF, XML, FEC)

**Conformité** :
- Mentions obligatoires françaises
- TVA (taux multiples, auto-liquidation)
- Facturation électronique 2026 (format Factur-X)

**Critères d'acceptation** :
- [ ] Envoi email automatique au client
- [ ] Génération PDF conforme (mentions légales)
- [ ] Rapprochement automatique avec règlements
- [ ] Relances paramétrables (J+15, J+30, J+45)

#### 4.2.3 Synchronisation bancaire

**Description** : Import automatique des transactions bancaires et catégorisation intelligente.

**Fournisseurs supportés** :
- Budget Insight (API principale)
- Bridge (fallback)
- Bankin' / Linxo (option)

**Fonctionnalités** :
- Connexion multi-comptes (plusieurs banques)
- Synchronisation quotidienne automatique
- Catégorisation par IA/règles
- Rapprochement bancaire auto
- Détection des doublons
- Alertes solde (seuils personnalisables)

**Critères d'acceptation** :
- [ ] Synchro quotidienne réussie (>95%)
- [ ] Catégorisation correcte (>80%)
- [ ] Temps de synchro <30 secondes/compte
- [ ] Support des principales banques françaises

#### 4.2.4 Notes de frais

**Description** : Gestion dématérialisée des notes de frais avec OCR.

**Fonctionnalités** :
- Prise de photo du justificatif (mobile)
- OCR automatique (montant, date, fournisseur)
- Catégorisation (repas, transport, hébergement)
- Validation en 1 clic
- Calcul automatique TVA récupérable
- Remboursement (suivi des paiements)

**Critères d'acceptation** :
- [ ] OCR précis (>85% de réussite)
- [ ] Interface mobile fluide
- [ ] Validation expert-comptable intégrée
- [ ] Export vers paie (indemnités kilométriques)

#### 4.2.5 Dépôt de documents

**Description** : Espace de stockage centralisé pour tous les documents comptables.

**Types de documents** :
- Factures fournisseurs
- Contrats
- Bulletins de salaire
- Relevés bancaires
- Justificatifs divers

**Fonctionnalités** :
- Upload drag & drop
- Organisation par dossiers (automatique ou manuelle)
- OCR pour indexation automatique
- Recherche plein texte
- Prévisualisation
- Partage avec le cabinet
- Archivage légal (10 ans)

**Critères d'acceptation** :
- [ ] Upload jusqu'à 20 MB/fichier
- [ ] Formats supportés : PDF, JPG, PNG, Excel, Word
- [ ] Recherche instantanée (<1 seconde)
- [ ] Sauvegardes quotidiennes automatiques

---

### 4.3 Modules Comptables Odoo

#### 4.3.1 Comptabilité générale (PCG)

**Description** : Module de comptabilité adapté au Plan Comptable Général français.

**Fonctionnalités** :
- Plan comptable PCG pré-configuré
- Saisie d'écritures (manuel, import, automatique)
- Lettrage et pointage
- Gestion des journaux (ventes, achats, banque, OD)
- Clôture mensuelle/annuelle
- Grand livre, balance, journaux
- Bilan et compte de résultat

**Particularités françaises** :
- Numérotation séquentielle obligatoire
- Intouchabilité des écritures validées
- Export FEC (Fichier des Écritures Comptables)
- Conformité art. L123-22 Code de commerce

**Critères d'acceptation** :
- [ ] PCG 2025 complet (700+ comptes)
- [ ] Export FEC validé par logiciels de contrôle
- [ ] Saisie rapide (<10 secondes/écriture)
- [ ] Pas de modification d'écritures validées

#### 4.3.2 Déclarations TVA automatisées

**Description** : Génération automatique des déclarations de TVA.

**Régimes supportés** :
- Régime réel normal (mensuel)
- Régime réel simplifié (trimestriel, annuel)
- Franchise en base (pas de TVA)

**Fonctionnalités** :
- Calcul automatique TVA collectée/déductible
- Pré-remplissage CA3/CA12
- Gestion des acomptes
- Crédit de TVA (report)
- Export EDI-TVA (télédéclaration)
- Archivage automatique

**Critères d'acceptation** :
- [ ] Calcul automatique sans erreur
- [ ] Format EDI-TVA conforme
- [ ] Gestion des cas particuliers (auto-liquidation, import/export)
- [ ] Historique complet des déclarations

#### 4.3.3 Liasses fiscales

**Description** : Génération des liasses fiscales annuelles.

**Liasses supportées** :
- 2033 (BIC régime réel simplifié)
- 2035 (BNC)
- 2050 (BIC régime réel normal)

**Fonctionnalités** :
- Pré-remplissage depuis la comptabilité
- Contrôles de cohérence
- Calcul automatique des reports (déficits, amortissements)
- Export PDF + XML (EDI-TDFC)
- Signature électronique expert-comptable

**Critères d'acceptation** :
- [ ] Tous les tableaux pré-remplis
- [ ] Contrôles de cohérence automatiques
- [ ] Export conforme pour télédéclaration
- [ ] Signature électronique intégrée

#### 4.3.4 Immobilisations & Amortissements

**Description** : Gestion du patrimoine immobilisé de l'entreprise.

**Fonctionnalités** :
- Fiche immobilisation (acquisition, mise en service)
- Calculs d'amortissements :
  - Linéaire
  - Dégressif
  - Exceptionnel (dérogations)
- Plan d'amortissement automatique
- Cessions et mises au rebut
- Tableau des immobilisations (2055)

**Critères d'acceptation** :
- [ ] Calculs conformes aux règles fiscales françaises
- [ ] Support amortissements dérogatoires
- [ ] Export tableau 2055 pour liasse fiscale
- [ ] Historique complet des mouvements

---

## 5. Architecture technique

### 5.1 Stack technologique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend | Odoo | 17.0 |
| Base de données | PostgreSQL | 15 |
| Cache | Redis | 7.0 |
| Proxy | Nginx | 1.24 |
| Conteneurisation | Docker | 20.10+ |
| Orchestration | Docker Compose | 2.0+ |
| CI/CD | GitHub Actions | - |
| Monitoring | Prometheus + Grafana | Latest |
| Logs | ELK Stack | 8.x |

### 5.2 Architecture Docker

#### Conteneurs principaux

1. **odoo-web** : Application Odoo (port 8069)
2. **postgres** : Base de données (port 5432)
3. **nginx** : Reverse proxy (port 80/443)
4. **redis** : Cache et sessions (port 6379)
5. **odoo-worker** : Tâches asynchrones (cron, emails)

#### Volumes persistants

- `postgres-data` : Données PostgreSQL
- `odoo-data` : Fichiers Odoo (addons, filestore)
- `nginx-certs` : Certificats SSL
- `backups` : Sauvegardes automatiques

#### Réseau

- Réseau interne Docker `iseb-network`
- Exposition publique via Nginx (reverse proxy)
- SSL/TLS via Let's Encrypt (Certbot)

### 5.3 Schéma d'architecture

```
                                                         
                    Internet / Clients                    
                    ,                                    
                     
                      HTTPS (443)
                     
                    ¼      
                  Nginx     (Reverse Proxy + SSL)
                 Container 
                    ,      
                     
                    4           
                                
        ¼                    ¼     
    Odoo Web               Redis   
    Container Ä         $ Container 
        ,                          
                                
                           (Cache/Sessions)
         
        ¼      
    PostgreSQL 
    Container  
               
         
   (Persistent Volume)
```

### 5.4 Déploiement

#### Environnements

1. **Développement** : Local (Docker Compose)
2. **Staging** : VPS/Cloud (test avant prod)
3. **Production** : Infrastructure scalable (Kubernetes ou Docker Swarm)

#### CI/CD Pipeline

```yaml
1. Git Push ’ GitHub
2. GitHub Actions déclenché
3. Tests automatiques (unittest, lint)
4. Build Docker images
5. Push vers registry (Docker Hub/AWS ECR)
6. Déploiement automatique (staging)
7. Tests d'intégration
8. Déploiement manuel (production)
```

---

## 6. Contraintes et exigences

### 6.1 Exigences fonctionnelles

| ID | Exigence | Priorité | Statut |
|----|----------|----------|--------|
| EF-01 | Conformité PCG 2025 | =4 Critique |  Planifié |
| EF-02 | Export FEC conforme | =4 Critique |  Planifié |
| EF-03 | Déclarations TVA automatisées | =4 Critique |  Planifié |
| EF-04 | Synchro bancaire quotidienne | =à Haute |  Planifié |
| EF-05 | Notes de frais avec OCR | =à Haute | ó Phase 2 |
| EF-06 | Facturation électronique 2026 | =â Moyenne | ó Phase 3 |
| EF-07 | Application mobile | =â Moyenne | ó Phase 3 |

### 6.2 Exigences non-fonctionnelles

#### Performance

- Temps de réponse page <2 secondes
- Support 1000 utilisateurs simultanés
- Disponibilité 99.9% (SLA)
- Synchro bancaire <30 secondes/compte

#### Sécurité

- Authentification OAuth2 / SSO
- Chiffrement TLS 1.3 minimum
- Chiffrement données sensibles (AES-256)
- Logs d'audit complets (7 ans)
- Conformité RGPD stricte

#### Scalabilité

- Architecture multi-tenant
- Séparation données par client (row-level security)
- Scaling horizontal (ajout de workers)
- CDN pour assets statiques

#### Compatibilité

- Navigateurs : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile : iOS 14+, Android 10+
- Responsive design (mobile-first)

### 6.3 Conformité légale

 **RGPD** : Gestion des consentements, droit à l'oubli, portabilité
 **FEC** : Export conforme art. A47 A-1 du LPF
 **Facturation** : Mentions obligatoires (CGI art. 242 nonies A)
 **Archivage** : Conservation 10 ans (Code de commerce L123-22)
 **Sécurité** : Hébergement HDS (Hébergeur de Données de Santé) si nécessaire

---

## 7. Planning et roadmap

### 7.1 Phase 1 - MVP (Q2 2025) - 3 mois

**Objectif** : Version minimale viable pour early adopters

| Tâche | Durée | Responsable |
|-------|-------|-------------|
| Setup infrastructure Docker | 1 semaine | DevOps |
| Module comptabilité base (PCG) | 3 semaines | Dev Backend |
| Portail client simplifié | 3 semaines | Dev Frontend |
| Synchro bancaire (Budget Insight) | 2 semaines | Dev Backend |
| Tests & corrections | 2 semaines | QA |
| Déploiement staging | 1 semaine | DevOps |

**Livrables** :
- Infrastructure Docker opérationnelle
- Module comptabilité française de base
- Portail client avec tableau de bord
- Synchronisation bancaire (1 fournisseur)

### 7.2 Phase 2 - Production (Q3 2025) - 4 mois

**Objectif** : Version production complète pour commercialisation

| Tâche | Durée | Responsable |
|-------|-------|-------------|
| Portail cabinet complet | 4 semaines | Dev Fullstack |
| Déclarations TVA automatisées | 3 semaines | Dev Backend |
| Intégration paie (PayFit) | 2 semaines | Dev Backend |
| Notes de frais + OCR | 3 semaines | Dev Mobile/Backend |
| Workflow validation | 2 semaines | Dev Backend |
| Communication intégrée (chat) | 2 semaines | Dev Frontend |
| Tests end-to-end | 2 semaines | QA |
| Déploiement production | 1 semaine | DevOps |

**Livrables** :
- Portail cabinet multi-clients opérationnel
- Déclarations fiscales automatisées
- Intégration paie fonctionnelle
- Notes de frais avec OCR

### 7.3 Phase 3 - Scale (Q4 2025) - 3 mois

**Objectif** : Fonctionnalités avancées et scaling

| Tâche | Durée | Responsable |
|-------|-------|-------------|
| Facturation électronique Chorus Pro | 3 semaines | Dev Backend |
| IA catégorisation automatique | 4 semaines | Data Scientist |
| Reporting analytique avancé | 3 semaines | Dev BI |
| API publique (documentation) | 2 semaines | Dev Backend |
| Application mobile (React Native) | 6 semaines | Dev Mobile |
| Optimisations performance | 2 semaines | DevOps |

**Livrables** :
- Conformité facturation électronique 2026
- IA opérationnelle (>80% précision)
- API publique documentée
- Application mobile iOS/Android

### 7.4 Jalons clés

| Date | Jalon | Description |
|------|-------|-------------|
| 15/05/2025 | =€ MVP Release | Version beta pour early adopters |
| 15/07/2025 | <¯ Production v1.0 | Commercialisation officielle |
| 01/10/2025 | =ñ Mobile Release | Application iOS/Android |
| 01/01/2026 | ¡ Scale v2.0 | Facturation électronique + IA |

---

## 8. Livrables

### 8.1 Documentation

| Document | Description | Statut |
|----------|-------------|--------|
| Cahier des charges fonctionnel | Ce document |  Livré |
| Architecture technique détaillée | Schémas, data-flow, infrastructure | =Ý En cours |
| Guide d'intégration | API, connecteurs bancaires, paie | =Ý En cours |
| Guide de déploiement | Installation, configuration, monitoring | =Ý En cours |
| Documentation utilisateur | Manuels cabinet et client | ó Phase 2 |
| Documentation développeur | API, modules, extensions | ó Phase 2 |

### 8.2 Code et infrastructure

| Livrable | Description | Statut |
|----------|-------------|--------|
| Infrastructure Docker | docker-compose.yml, Dockerfiles |  Livré |
| Modules Odoo personnalisés | french_accounting, cabinet_portal, client_portal | =Ý En cours |
| Intégrations externes | Connecteurs banques, paie, signature | =Ý En cours |
| Tests automatisés | Unittests, tests d'intégration | =Ý En cours |
| CI/CD Pipeline | GitHub Actions, scripts déploiement | =Ý En cours |

### 8.3 Prototypes et maquettes

| Prototype | Description | Statut |
|-----------|-------------|--------|
| Prototype UI Cabinet | Maquettes Figma/Sketch espace cabinet | =Ý En cours |
| Prototype UI Client | Maquettes Figma/Sketch portail client | =Ý En cours |
| Prototype Mobile | Wireframes application mobile | ó Phase 3 |
| Design System | Composants UI réutilisables | =Ý En cours |

---

## 9. Budget prévisionnel

### 9.1 Coûts de développement

| Poste | Ressources | Durée | Coût estimé |
|-------|-----------|-------|-------------|
| **Phase 1 - MVP** | 2 dev fullstack + 1 DevOps | 3 mois | 60 000¬ |
| **Phase 2 - Production** | 3 dev + 1 QA + 1 DevOps | 4 mois | 100 000¬ |
| **Phase 3 - Scale** | 3 dev + 1 data scientist + 1 mobile | 3 mois | 90 000¬ |
| **Total développement** | - | 10 mois | **250 000¬** |

### 9.2 Coûts d'infrastructure (annuel)

| Service | Description | Coût mensuel | Coût annuel |
|---------|-------------|--------------|-------------|
| Hébergement cloud | VPS scalable (4vCPU, 16GB RAM) | 150¬ | 1 800¬ |
| Base de données managée | PostgreSQL (backup auto) | 80¬ | 960¬ |
| CDN + Object Storage | Assets statiques, documents | 50¬ | 600¬ |
| Monitoring | Prometheus, Grafana, logs | 40¬ | 480¬ |
| Sauvegardes | Backups quotidiens (S3) | 30¬ | 360¬ |
| SSL/Domaines | Certificats, DNS | 20¬ | 240¬ |
| **Total infrastructure** | - | **370¬** | **4 440¬** |

### 9.3 Coûts de licences et APIs (pour 100 clients)

| Service | Coût unitaire | Nombre | Coût annuel |
|---------|---------------|--------|-------------|
| Odoo Enterprise (optionnel) | 20¬/mois/utilisateur | 5 utilisateurs cabinet | 1 200¬ |
| Budget Insight API | 2¬/mois/compte bancaire | 100 comptes | 2 400¬ |
| PayFit API | Inclus dans abonnement client | - | 0¬ |
| Yousign API | 1¬/signature | 500 signatures/an | 500¬ |
| OCR (Google Vision API) | 1.5¬/1000 images | 50 000 images/an | 75¬ |
| **Total licences** | - | - | **4 175¬** |

### 9.4 ROI et rentabilité

**Hypothèses** :
- Prix moyen : 350¬/mois/client
- Objectif : 50 clients à M+12, 200 clients à M+24
- Taux de churn : 5%/an

**Projections** :

| Période | Clients actifs | CA mensuel | CA annuel |
|---------|----------------|------------|-----------|
| M+12 | 50 | 17 500¬ | 210 000¬ |
| M+24 | 200 | 70 000¬ | 840 000¬ |
| M+36 | 500 | 175 000¬ | 2 100 000¬ |

**Break-even** : Atteint à M+18 (environ 80 clients)

---

## 10. Risques et mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Retard développement | =4 Élevé | =à Moyen | Planning agile, sprints courts, MVP prioritaire |
| Non-conformité FEC | =4 Élevé | =â Faible | Validation par expert-comptable, tests logiciels contrôle |
| Problèmes API bancaires | =à Moyen | =à Moyen | Multi-provider (Budget Insight + Bridge), gestion erreurs |
| Scalabilité insuffisante | =à Moyen | =â Faible | Architecture Docker scalable, tests de charge |
| Sécurité (faille RGPD) | =4 Élevé | =â Faible | Audits sécurité réguliers, pentests, conformité by design |
| Turnover équipe | =à Moyen | =à Moyen | Documentation complète, code review, pair programming |

---

## 11. Validation et approbation

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Chef de projet | __________ | __/__/____ | __________ |
| Directeur technique | __________ | __/__/____ | __________ |
| Expert-comptable référent | __________ | __/__/____ | __________ |
| Client pilote | __________ | __/__/____ | __________ |

---

## 12. Annexes

### 12.1 Références

- [Odoo Documentation](https://www.odoo.com/documentation/17.0/)
- [Plan Comptable Général (PCG)](https://www.legifrance.gouv.fr/)
- [Norme FEC](https://www.economie.gouv.fr/dgfip/fec-fichier-ecritures-comptables)
- [Budget Insight API](https://docs.budget-insight.com/)
- [Facturation électronique 2026](https://www.impots.gouv.fr/facturation-electronique)

### 12.2 Glossaire

| Terme | Définition |
|-------|------------|
| **PCG** | Plan Comptable Général - référentiel comptable français |
| **FEC** | Fichier des Écritures Comptables - export normalisé obligatoire |
| **TVA** | Taxe sur la Valeur Ajoutée |
| **BIC** | Bénéfices Industriels et Commerciaux |
| **BNC** | Bénéfices Non Commerciaux |
| **CA3** | Déclaration de TVA (régime réel normal) |
| **CA12** | Déclaration de TVA (régime réel simplifié) |
| **OCR** | Optical Character Recognition - reconnaissance de caractères |
| **SaaS** | Software as a Service |
| **MVP** | Minimum Viable Product - produit minimum viable |

---

**Fin du document**

Version 1.0 - Novembre 2025
© ISEB - Tous droits réservés
