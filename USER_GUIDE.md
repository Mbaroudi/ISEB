# 📘 Guide Utilisateur - ISEB Platform

**Plateforme SaaS de Gestion Comptable pour Indépendants et TPE**

Version 17.0 | Dernière mise à jour : Janvier 2025

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Démarrage Rapide](#démarrage-rapide)
3. [Portail Client](#portail-client)
4. [Synchronisation Bancaire](#synchronisation-bancaire)
5. [Rapports Personnalisés](#rapports-personnalisés)
6. [Facturation Électronique](#facturation-électronique)
7. [Fonctionnalités Avancées](#fonctionnalités-avancées)
8. [FAQ](#faq)
9. [Support](#support)

---

## 🎯 Introduction

### Qu'est-ce qu'ISEB Platform ?

ISEB est une plateforme SaaS complète de gestion comptable spécialement conçue pour :
- ✅ Indépendants (auto-entrepreneurs, freelances)
- ✅ TPE (Très Petites Entreprises)
- ✅ Cabinets comptables gérant plusieurs clients

### Fonctionnalités Principales

#### 📊 **Tableau de Bord Temps Réel**
- Trésorerie actualisée en permanence
- Chiffre d'affaires et charges du mois
- Résultat net instantané
- TVA à décaisser
- Graphiques interactifs Chart.js

#### 🏦 **Synchronisation Bancaire Automatique**
- Connexion sécurisée PSD2 à votre banque
- Import automatique des transactions
- Rapprochement bancaire intelligent
- Compatible 50+ banques françaises

#### 📄 **Gestion Documentaire**
- Upload drag & drop
- Capture photo mobile avec OCR
- Extraction automatique des données (DeepSeek-OCR/Tesseract)
- Classement automatique

#### 💰 **Notes de Frais Simplifiées**
- Photo du reçu → Données extraites automatiquement
- Catégorisation intelligente
- Validation rapide
- Remboursement suivi

#### 📧 **Factur

ation Électronique**
- Conformité Factur-X / Chorus Pro
- Envoi automatique aux administrations
- Archivage légal 10 ans
- Signature électronique

#### 📈 **Rapports Personnalisés**
- Bilan, compte de résultat, flux de trésorerie
- Exports PDF/Excel/CSV
- Planification automatique
- Comparaisons N vs N-1

---

## 🚀 Démarrage Rapide

### 1. Connexion

1. Ouvrez votre navigateur : `https://votre-instance.iseb.fr`
2. Saisissez vos identifiants :
   - **Email** : votre.email@entreprise.fr
   - **Mot de passe** : (fourni par votre administrateur)
3. Cliquez sur **Se connecter**

### 2. Premier Accès

Au premier accès, vous verrez un **Assistant de Configuration** :

#### Étape 1 : Profil
- Nom de l'entreprise
- SIREN/SIRET
- Adresse
- Contacts

#### Étape 2 : Banques
- Connectez votre(vos) compte(s) bancaire(s)
- Sélectionnez votre banque dans la liste
- Suivez le processus d'authentification sécurisée PSD2

#### Étape 3 : Préférences
- Catégories de dépenses personnalisées
- Alertes et notifications
- Fréquence de synchronisation

### 3. Installation PWA (Optionnel mais Recommandé)

Pour utiliser ISEB comme une app mobile :

#### Sur Android/Chrome :
1. Cliquez sur le menu (⋮) → **Installer l'application**
2. Confirmez l'installation
3. L'icône ISEB apparaît sur votre écran d'accueil

#### Sur iOS/Safari :
1. Appuyez sur le bouton Partager (⬆️)
2. Sélectionnez **Sur l'écran d'accueil**
3. Confirmez

---

## 📊 Portail Client

### Vue d'Ensemble du Dashboard

Le dashboard est votre page d'accueil principale. Il affiche :

#### Indicateurs Clés (KPIs)

| KPI | Description | Mise à jour |
|-----|-------------|-------------|
| **Trésorerie** | Solde actuel de tous vos comptes | Temps réel |
| **CA du Mois** | Chiffre d'affaires mensuel | Temps réel |
| **Charges** | Dépenses du mois en cours | Temps réel |
| **Résultat Net** | CA - Charges | Calculé auto |
| **TVA à Décaisser** | Montant de TVA à payer | Calculé auto |

#### Graphiques Interactifs

1. **Évolution du CA (12 mois)**
   - Graphique en ligne
   - Survol pour détails mois par mois
   - Comparaison N vs N-1

2. **CA vs Charges (Comparaison)**
   - Graphique en barres
   - Vue par mois
   - Identification rapide des déséquilibres

3. **Répartition des Dépenses**
   - Graphique camembert
   - Par catégorie (repas, transport, fournitures, etc.)
   - Cliquez pour drill-down

### Navigation

Menu principal (gauche ou burger mobile) :

```
🏠 Accueil
📊 Dashboard
📄 Documents
💰 Notes de Frais
🏦 Comptes Bancaires
📧 Factures
📈 Rapports
⚙️ Configuration
```

### Export du Dashboard

#### Export PDF
1. Cliquez sur **📄 Exporter en PDF** en haut à droite
2. Le PDF se télécharge automatiquement
3. Contenu : KPIs + graphiques + tableaux de transactions

#### Export Excel
1. Cliquez sur **📊 Exporter en Excel**
2. Fichier `.xlsx` téléchargé
3. Feuilles multiples : Synthèse, CA, Charges, Transactions

---

## 📄 Gestion Documentaire

### Upload de Documents

#### Méthode 1 : Drag & Drop

1. Allez dans **📄 Documents**
2. **Glissez-déposez** vos fichiers sur la zone bleue
3. Les fichiers sont uploadés automatiquement
4. Prévisualisation instantanée

**Formats acceptés** : PDF, JPG, PNG, Word, Excel

#### Méthode 2 : Clic sur Zone

1. Cliquez sur la zone d'upload
2. Sélectionnez vos fichiers depuis votre ordinateur
3. Validez

#### Méthode 3 : Capture Photo Mobile

**Idéal pour scanner des documents en déplacement !**

1. Sur mobile, cliquez sur **📷 Prendre une Photo**
2. Autorisez l'accès à la caméra
3. Photographiez le document
4. Prévisualisez
5. Confirmez

### Organisation des Documents

#### Dossiers
Les documents sont classés automatiquement dans :
- 📁 **Factures Clients** - Vos factures émises
- 📁 **Factures Fournisseurs** - Factures reçues
- 📁 **Justificatifs** - Reçus, tickets, etc.
- 📁 **Contrats** - Documents contractuels
- 📁 **RIB** - Relevés d'identité bancaire
- 📁 **Autres** - Divers

#### Recherche
- Barre de recherche en haut
- Recherche par nom, date, montant, fournisseur
- Filtres avancés : période, catégorie, statut

### États des Documents

| État | Icône | Description |
|------|-------|-------------|
| **En attente** | ⏳ | Document uploadé, pas encore validé |
| **Validé** | ✅ | Document vérifié et approuvé |
| **Rejeté** | ❌ | Document rejeté (raison indiquée) |
| **Archivé** | 📦 | Document archivé (conservation légale) |

---

## 💰 Notes de Frais

### Créer une Note de Frais

#### Méthode Classique

1. Cliquez sur **💰 Notes de Frais** → **+ Nouvelle Note**
2. Remplissez le formulaire :
   - **Description** : Ex. "Déjeuner client"
   - **Montant** : Ex. 42.50 €
   - **TVA** : Auto-calculée ou manuelle
   - **Date** : Date de la dépense
   - **Catégorie** : Repas, Transport, Hébergement, etc.
   - **Justificatif** : Uploadez le reçu
3. Cliquez sur **Enregistrer**

#### Méthode Rapide : Photo + OCR ⭐ **RECOMMANDÉ**

**L'OCR extrait automatiquement toutes les données du reçu !**

1. Cliquez sur **📷 Prendre une Photo**
2. Photographiez le reçu
3. **Attendez 3-5 secondes** pendant l'analyse OCR
4. Les champs sont **pré-remplis automatiquement** :
   - ✅ Montant
   - ✅ Date
   - ✅ Vendeur/Fournisseur
   - ✅ Catégorie (détectée intelligemment)
5. Vérifiez et ajustez si nécessaire
6. Cliquez sur **Enregistrer**

**Backends OCR disponibles** :
- 🤖 **DeepSeek-OCR** (IA avancée, 95%+ précision) - Si serveur GPU
- 📝 **Tesseract** (Classique, 85-90% précision) - CPU uniquement

💡 **Le système choisit automatiquement le meilleur backend disponible !**

### Catégories de Dépenses

| Catégorie | Icône | Exemples |
|-----------|-------|----------|
| **Repas** | 🍽️ | Restaurant, déjeuner client, traiteur |
| **Transport** | 🚗 | Taxi, train, avion, métro |
| **Carburant** | ⛽ | Essence, diesel |
| **Hébergement** | 🏨 | Hôtel, Airbnb |
| **Parking** | 🅿️ | Parking, stationnement |
| **Fournitures** | ✏️ | Papeterie, matériel bureau |
| **Télécoms** | 📞 | Téléphone, internet |
| **Autres** | 📌 | Divers |

### Workflow de Validation

```
┌─────────────┐
│  Créée      │ ← Vous créez la note
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ En attente  │ ← Votre comptable reçoit une notification
└──────┬──────┘
       │
       ▼
  ┌────┴────┐
  │ Validée │   ou   │ Rejetée │
  └─────────┘        └─────────┘
       │                  │
       ▼                  ▼
  ┌─────────┐     ┌──────────────┐
  │  Payée  │     │ À Corriger   │
  └─────────┘     └──────────────┘
```

### Notifications Email

Vous recevez un email automatique pour :
- ✅ **Note validée** - "Votre note de frais a été approuvée"
- ❌ **Note rejetée** - "Votre note a été rejetée" (avec raison)
- 💰 **Remboursement effectué** - "Remboursement de 42.50 € effectué"

---

## 🏦 Synchronisation Bancaire

### Connecter un Compte Bancaire

#### Étape 1 : Ajouter un Compte

1. Allez dans **🏦 Comptes Bancaires**
2. Cliquez sur **+ Nouveau Compte**
3. Sélectionnez votre banque dans la liste :

**Banques compatibles (50+)** :
- BNP Paribas
- Crédit Agricole
- Société Générale
- La Banque Postale
- Crédit Mutuel / CIC
- Boursorama
- ING
- Hello bank!
- N26
- Revolut
- ... et bien d'autres

#### Étape 2 : Authentification Sécurisée PSD2

1. Vous êtes **redirigé vers le site de votre banque**
2. **Connectez-vous** avec vos identifiants bancaires habituels
3. **Autorisez** ISEB à accéder à vos données (lecture seule)
4. Validez avec **authentification forte** (SMS, app mobile, etc.)
5. Vous êtes **redirigé automatiquement** vers ISEB

🔒 **Sécurité** :
- Vos identifiants bancaires ne transitent **jamais** par ISEB
- Conformité **PSD2** (directive européenne)
- Accès **lecture seule** (pas de virements possibles)
- Révocation **instantanée** possible à tout moment

#### Étape 3 : Configuration

- **Nom du compte** : Ex. "Compte Courant BNP"
- **Synchronisation** : Manuelle, Horaire, Quotidienne, Hebdomadaire
- **Alertes** : Seuil de solde minimum
- **Journal comptable** : Association automatique

### Synchroniser Manuellement

1. Allez dans **🏦 Comptes Bancaires**
2. Sélectionnez un compte
3. Cliquez sur **🔄 Synchroniser Maintenant**
4. Patientez **5-15 secondes**
5. Notification : "X nouvelles transactions importées"

### Transactions Importées

Chaque transaction affiche :
- 📅 **Date** et date de valeur
- 💰 **Montant** (débit en rouge, crédit en vert)
- 🏢 **Contrepartie** (nom du bénéficiaire/émetteur)
- 📁 **Catégorie** (auto-détectée ou manuelle)
- 🔗 **Statut** : En attente, Rapprochée, Ignorée

### Rapprochement Bancaire

Le **rapprochement** associe une transaction à une facture/paiement :

#### Automatique ⭐
ISEB rapproche automatiquement si :
- Montant exact
- Date proche (±3 jours)
- Référence/IBAN correspond

#### Manuel
1. Cliquez sur une transaction **"En attente"**
2. Cliquez sur **🔗 Rapprocher**
3. Sélectionnez la facture/paiement correspondant
4. Validez

#### Ignorer
Pour des transactions internes (virements entre comptes) :
1. Cliquez sur la transaction
2. Cliquez sur **❌ Ignorer**

### Règles de Rapprochement

Créez des **règles automatiques** pour gagner du temps :

**Exemple** : Tous les paiements de "URSSAF" → Catégorie "Charges sociales"

1. **Configuration** → **Règles de Rapprochement**
2. **+ Nouvelle Règle**
3. Définissez :
   - **Nom** : "URSSAF → Charges sociales"
   - **Type** : Nom contrepartie contient "URSSAF"
   - **Action** : Catégorie = "Charges sociales", Partenaire = URSSAF
4. **Enregistrer**

---

## 📈 Rapports Personnalisés

### Types de Rapports Prédéfinis

#### 1. **Bilan**
- Actif / Passif
- Capitaux propres
- Dettes à court/long terme

#### 2. **Compte de Résultat**
- Produits d'exploitation
- Charges d'exploitation
- Résultat net

#### 3. **Flux de Trésorerie**
- Flux opérationnels
- Flux d'investissement
- Flux de financement

#### 4. **Déclaration TVA**
- TVA collectée
- TVA déductible
- TVA à décaisser

#### 5. **Balance Âgée**
- Créances clients par ancienneté
- Dettes fournisseurs par ancienneté

### Générer un Rapport

1. Allez dans **📈 Rapports**
2. Sélectionnez un rapport (ex: "Compte de Résultat")
3. Cliquez sur **▶️ Générer**
4. Choisissez les **paramètres** :
   - **Période** : Mois, Trimestre, Année, Personnalisé
   - **Dates** : Du... Au...
   - **Comparaison** : N vs N-1 (oui/non)
   - **Format** : PDF, Excel, CSV
5. Cliquez sur **Générer**

Le rapport se télécharge automatiquement !

### Rapports Programmés

Recevez vos rapports automatiquement par email :

1. **Configuration** → **Rapports Programmés**
2. **+ Nouveau**
3. Définissez :
   - **Rapport** : Type de rapport
   - **Fréquence** : Quotidien, Hebdomadaire, Mensuel
   - **Format** : PDF/Excel
   - **Destinataires** : Emails
4. **Activer**

**Exemple** : Compte de résultat mensuel envoyé chaque 1er du mois

---

## 📧 Facturation Électronique

### Qu'est-ce que la Facturation Électronique ?

À partir de **2026**, la **facturation électronique B2B sera obligatoire** en France.

**Formats supportés par ISEB** :
- ✅ **Factur-X** (PDF + XML embarqué)
- ✅ **Chorus Pro** (administration publique)
- ✅ **Peppol** (réseau européen)

### Configurer un Partenaire pour E-Facture

1. Allez dans **Contacts** → Sélectionnez un client
2. Onglet **Facturation Électronique**
3. Cochez **"Facture électronique obligatoire"**
4. Sélectionnez le **format** :
   - Factur-X (standard français)
   - Chorus Pro (si client = administration)
   - Peppol (si client européen)
5. Renseignez les **identifiants** :
   - **SIRET** (obligatoire)
   - **Code service Chorus** (si Chorus Pro)
   - **Peppol ID** (si Peppol)
6. **Enregistrer**

### Envoyer une Facture Électronique

#### Automatique
Dès qu'une facture est **comptabilisée**, elle est **envoyée automatiquement** si :
- Le client a la e-facture **obligatoire**
- Le format est configuré

#### Manuel
1. Ouvrez une **facture comptabilisée**
2. Cliquez sur **📧 Envoyer E-Facture**
3. Vérifiez les informations
4. Cliquez sur **Envoyer**
5. Notification : "Facture envoyée avec succès"

### États de la Facture Électronique

| État | Description |
|------|-------------|
| **À envoyer** | Facture comptabilisée, pas encore envoyée |
| **Envoyée** | Facture transmise avec succès |
| **Acceptée** | Client a accepté la facture |
| **Rejetée** | Client a rejeté (raison indiquée) |
| **Erreur** | Problème d'envoi (vérifier config) |

### Archivage Légal

Toutes les factures électroniques sont **archivées automatiquement** pendant **10 ans** conformément au Code Général des Impôts (Art. 289).

---

## 🔧 Fonctionnalités Avancées

### PWA - Application Mobile

**Installez ISEB sur votre smartphone pour un accès rapide !**

#### Avantages
- ✅ **Icône sur écran d'accueil**
- ✅ **Mode hors ligne** (consultation des données)
- ✅ **Notifications push**
- ✅ **Chargement ultra-rapide**

#### Fonctionnement Hors Ligne
Le **Service Worker** met en cache :
- Dashboard
- Dernières transactions
- Documents récents

Vous pouvez **consulter** ces données même sans connexion internet !

### Système OCR Hybride

#### DeepSeek-OCR (IA Avancée)
- **Précision** : 95%+
- **Nécessite** : Serveur avec GPU
- **Avantages** :
  - Reconnaissance avancée
  - Layout preservation
  - Multi-langues

#### Tesseract (Classique)
- **Précision** : 85-90%
- **Nécessite** : Serveur CPU uniquement
- **Avantages** :
  - Léger et rapide
  - Pas de GPU requis
  - Support français excellent

💡 **Le système choisit automatiquement le meilleur backend disponible !**

Après chaque OCR, vous voyez :
```
✓ Données extraites avec succès!
  Backend: DeepSeek-OCR (IA) | Confiance: 95%
```

### API RESTful

ISEB expose une **API RESTful** pour intégrations externes :

#### Endpoints Principaux

```http
GET    /api/v1/dashboard           # Récupérer le dashboard
GET    /api/v1/transactions        # Lister les transactions
POST   /api/v1/invoices            # Créer une facture
GET    /api/v1/reports/:id         # Récupérer un rapport
POST   /api/v1/expenses            # Créer une note de frais
```

#### Authentification
```http
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

#### Documentation Complète
Disponible sur : `https://votre-instance.iseb.fr/api/docs`

---

## ❓ FAQ

### Général

**Q : Mes données sont-elles sécurisées ?**
R : Oui ! ISEB utilise :
- Chiffrement AES-256
- Authentification multi-facteurs
- Conformité RGPD
- Hébergement en France

**Q : Puis-je importer mes données depuis un autre logiciel ?**
R : Oui, via import CSV/Excel ou API.

**Q : Combien coûte ISEB ?**
R : Contactez votre cabinet comptable ou notre service commercial.

### Synchronisation Bancaire

**Q : Mes identifiants bancaires sont-ils stockés par ISEB ?**
R : **Non**, jamais ! L'authentification se fait directement sur le site de votre banque (PSD2).

**Q : Puis-je révoquer l'accès à tout moment ?**
R : Oui, instantanément depuis **Comptes Bancaires** → **Déconnecter**.

**Q : Combien de temps prend une synchronisation ?**
R : Entre 5 et 15 secondes en moyenne.

### OCR

**Q : L'OCR fonctionne-t-il avec tous les reçus ?**
R : Oui, mais la qualité dépend de :
- Qualité de la photo (nette, bien éclairée)
- Lisibilité du reçu (pas froissé, encre visible)
- Langue (français excellent, anglais supporté)

**Q : Puis-je choisir le backend OCR ?**
R : Non, le système choisit automatiquement le meilleur disponible. Vous voyez quel backend a été utilisé après chaque traitement.

### Facturation Électronique

**Q : Est-ce obligatoire maintenant ?**
R : Pour les **administrations publiques** : **oui** depuis 2020.
Pour les **entreprises B2B** : **oui** à partir de **2026**.

**Q : Mes clients doivent-ils avoir un logiciel spécial ?**
R : Non, les factures Factur-X sont des **PDF normaux** qui s'ouvrent partout.

---

## 💬 Support

### Besoin d'Aide ?

#### 📧 Email
support@iseb.fr

#### 📞 Téléphone
+33 1 23 45 67 89
Lundi-Vendredi : 9h-18h

#### 💬 Chat
Cliquez sur l'icône 💬 en bas à droite de l'application

#### 📚 Documentation
https://docs.iseb.fr

#### 🎓 Tutoriels Vidéo
https://iseb.fr/videos

---

## 📝 Notes de Version

### Version 17.0 (Janvier 2025)

#### ✨ Nouveautés
- 🤖 **OCR hybride** (DeepSeek-OCR + Tesseract)
- 📱 **PWA** (Installation mobile)
- 🏦 **Synchronisation bancaire** PSD2
- 📧 **Facturation électronique** (Factur-X, Chorus Pro)
- 📊 **Graphiques interactifs** Chart.js
- 📁 **Drag & Drop** upload
- 📷 **Capture photo** mobile

#### 🔧 Améliorations
- Performances dashboard (+40%)
- Interface responsive mobile
- Notifications email automatiques
- Exports PDF/Excel optimisés

#### 🐛 Corrections
- Corrections diverses et améliorations de stabilité

---

**🚀 Profitez pleinement d'ISEB Platform !**

*Guide rédigé par l'équipe ISEB - Janvier 2025*
