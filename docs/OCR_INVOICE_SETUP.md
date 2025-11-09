# Configuration OCR/IA pour Saisie Automatique des Factures - Odoo 17

## 📋 Vue d'ensemble

Ce guide vous permet de configurer l'OCR et l'IA dans Odoo pour automatiser la saisie des factures fournisseurs avec une précision jusqu'à 98%.

**Fonctionnalités :**
- Extraction automatique des données de facture (PDF, images, emails)
- Reconnaissance des champs : fournisseur, montant, TVA, dates, lignes de facture
- Création automatique des écritures comptables
- Apprentissage progressif du système
- Traitement par lots

---

## 🔧 Modules Odoo Natifs

### 1. Module "Documents" (Odoo Enterprise)

**Installation :**
```bash
# Dans Odoo, allez à Apps
# Recherchez "Documents"
# Installez "Documents Management"
```

**Configuration :**
1. Allez dans `Paramètres` → `Général`
2. Activez `Documents Management`
3. Configurez les espaces de travail (Workspaces)

### 2. Module "OCR" (Odoo Enterprise)

**Prérequis :**
- Odoo Enterprise 17.0 ou supérieur
- Abonnement Odoo avec crédits OCR

**Installation :**
```bash
# Dans Apps
# Recherchez "OCR"
# Installez "Documents - Extract Vendor Bills"
```

**Configuration :**
1. `Paramètres` → `Comptabilité` → `Numérisation`
2. Activez `Numérisation automatique des factures`
3. Configurez le nombre de crédits OCR

**Utilisation :**
1. Uploadez une facture PDF dans `Documents`
2. L'OCR extrait automatiquement les données
3. Validez dans `Comptabilité` → `Fournisseurs` → `Factures`

---

## 🌟 Modules Tiers Recommandés (Odoo App Store)

### 1. **AI Invoice OCR** ⭐ Recommandé

**Développeur :** TechUltra Solutions
**Prix :** ~199€ (one-time) ou abonnement mensuel
**Note :** 4.8/5

**Fonctionnalités :**
- ✅ OCR multi-langues (FR, EN, DE, ES, etc.)
- ✅ Support PDF, JPG, PNG, TIFF
- ✅ Extraction ligne par ligne (articles + prix unitaire)
- ✅ Détection automatique de la devise
- ✅ Apprentissage automatique des formats fournisseurs
- ✅ API externe (Google Vision AI, AWS Textract)
- ✅ Traitement par lots
- ✅ Pas de limite de crédits

**Installation :**
```xml
<!-- Dans Odoo Apps Store -->
1. Recherchez "AI Invoice OCR"
2. Achetez et installez
3. Configuration : Apps → AI Invoice OCR → Settings
```

**Configuration API :**
```python
# Paramètres → Technique → Paramètres système
# Ajoutez :
- ocr.api.provider = 'google_vision'  # ou 'aws_textract'
- ocr.api.key = 'VOTRE_CLE_API'
```

### 2. **Gemini Invoice Capture**

**Développeur :** Gemini Consulting
**Prix :** ~149€/mois
**Note :** 4.6/5

**Fonctionnalités :**
- ✅ IA avancée avec GPT-4 Vision
- ✅ Extraction de factures manuscrites
- ✅ Détection fraudes (duplicatas, montants incohérents)
- ✅ Validation automatique avec règles métier
- ✅ Export Excel/CSV

**Installation :**
```bash
# Odoo Apps Store
# "Gemini Invoice Capture"
# Installer
```

### 3. **Document AI - Invoice Recognition**

**Développeur :** Ksolves
**Prix :** ~99€ (one-time)
**Note :** 4.4/5

**Fonctionnalités :**
- ✅ OCR basique
- ✅ Mapping champs personnalisables
- ✅ Support emails entrants
- ✅ Workflow d'approbation

### 4. **Smart Invoice OCR**

**Développeur :** Apps4Business
**Prix :** Gratuit (version limitée) / 199€ (premium)

**Fonctionnalités :**
- ✅ OCR gratuit jusqu'à 50 factures/mois
- ✅ Extraction basique (fournisseur, montant, date)
- ✅ Premium : extraction lignes détaillées
- ✅ Premium : multi-devises

---

## 🚀 Configuration Recommandée (Étape par étape)

### Étape 1 : Prérequis Odoo

**1.1 Vérifier version Odoo**
```bash
# Dans Odoo shell ou via interface
# Settings → About
# Version minimum : 17.0
```

**1.2 Installer modules de base**
```bash
# Via Apps
1. Comptabilité (account)
2. Documents (documents) - si Enterprise
3. Invoicing (account_invoice)
```

### Étape 2 : Choisir et installer module OCR

**Option A : Odoo Enterprise natif**
- Avantage : Intégré, support officiel
- Inconvénient : Crédits limités (~300€/an pour 1000 factures)

**Option B : AI Invoice OCR (TechUltra)** ⭐ **RECOMMANDÉ**
- Avantage : Pas de limite, meilleure précision
- Inconvénient : Coût initial ~199€

**Option C : Gemini Invoice Capture**
- Avantage : IA GPT-4, détection fraudes
- Inconvénient : Abonnement mensuel

### Étape 3 : Configuration API OCR (si module tiers)

**3.1 Créer compte Google Vision AI**
```bash
# 1. Aller sur https://cloud.google.com/vision
# 2. Créer un projet
# 3. Activer Vision API
# 4. Créer une clé API
# 5. Copier la clé
```

**3.2 Configurer dans Odoo**
```python
# Settings → Technical → System Parameters
# Créer :
Key: ocr.provider
Value: google_vision

Key: ocr.api_key
Value: AIzaSy...VOTRE_CLE

Key: ocr.confidence_threshold
Value: 0.85  # 85% de confiance minimum
```

**Alternative : AWS Textract**
```python
Key: ocr.provider
Value: aws_textract

Key: ocr.aws_access_key
Value: AKIA...

Key: ocr.aws_secret_key
Value: wJal...

Key: ocr.aws_region
Value: eu-west-1
```

### Étape 4 : Configuration Email (factures par email)

**4.1 Créer alias email**
```bash
# Settings → Technical → Email Servers
# Créer un alias : factures@votre-domaine.com
```

**4.2 Configurer règles de routage**
```python
# Documents → Configuration → Workflow Rules
# Créer règle :
- Si email reçu sur factures@...
- Créer document dans workspace "Factures Fournisseurs"
- Appliquer OCR automatiquement
- Créer facture brouillon
```

### Étape 5 : Mapper les champs

**5.1 Configuration mapping**
```python
# Module OCR → Configuration → Field Mapping
# Exemples de règles :

Champ OCR              → Champ Odoo
-------------------------------------------------------------------------
Invoice Number         → reference
Invoice Date           → invoice_date
Due Date              → invoice_date_due
Vendor Name           → partner_id (recherche par nom)
Vendor VAT            → partner_id.vat
Total Amount          → amount_total
Tax Amount            → amount_tax
Subtotal              → amount_untaxed

# Lignes de facture
Line Description      → invoice_line_ids.name
Line Quantity         → invoice_line_ids.quantity
Line Unit Price       → invoice_line_ids.price_unit
Line Tax              → invoice_line_ids.tax_ids
```

### Étape 6 : Configurer comptes comptables par défaut

**6.1 Mapping fournisseurs**
```python
# Comptabilité → Configuration → Comptes par défaut
# Pour chaque fournisseur récurrent :

Fournisseur           Compte Charge         Compte TVA
-------------------------------------------------------------------------
EDF                   606000 (Énergie)      445660 (TVA 20%)
Orange                626000 (Télécom)      445660 (TVA 20%)
Amazon                607000 (Achats)       445660 (TVA 20%)
```

**6.2 Règles automatiques**
```python
# Documents → Workflow Actions
# Si fournisseur = "EDF" → compte charge = 606000
# Si montant > 5000€ → validation manager requise
```

### Étape 7 : Workflow d'approbation

**7.1 Configurer niveaux de validation**
```python
# Comptabilité → Configuration → Workflow Validation

Montant               Validation requise
-------------------------------------------------------------------------
< 100€                Auto-validation
100€ - 1000€          Comptable
1000€ - 5000€         Manager
> 5000€               Directeur Financier
```

---

## 📊 Utilisation Quotidienne

### Méthode 1 : Upload manuel

1. Aller dans `Documents`
2. Upload facture PDF/Image
3. L'OCR traite automatiquement (5-30 secondes)
4. Aller dans `Comptabilité` → `Fournisseurs` → `Factures`
5. Vérifier et valider la facture générée

### Méthode 2 : Email automatique

1. Envoyer facture par email à `factures@votre-domaine.com`
2. Système traite automatiquement
3. Notification dans Odoo
4. Valider la facture

### Méthode 3 : Scan mobile

1. Installer Odoo mobile app
2. Photographier la facture
3. Upload via app
4. OCR traite

### Méthode 4 : Traitement par lots

```python
# Documents → Actions → Traiter OCR par lot
# Sélectionner plusieurs factures
# "Appliquer OCR"
# Toutes traitées en parallèle
```

---

## 🧪 Tests et Validation

### Test 1 : Facture simple

**Fichier de test :**
```
Facture type : PDF standard
Fournisseur : Amazon Business
Montant : 245,80€ TTC
TVA : 20%
Date : 15/11/2024
```

**Résultat attendu :**
- ✅ Fournisseur reconnu
- ✅ Montant exact
- ✅ TVA calculée (40,97€)
- ✅ Date correcte
- ✅ Compte 607000 assigné

### Test 2 : Facture complexe

**Fichier de test :**
```
Facture type : Multi-lignes
10 lignes de produits
TVA mixte (20%, 10%, 5,5%)
Remise -15%
```

**Résultat attendu :**
- ✅ Toutes les lignes extraites
- ✅ TVA par taux séparé
- ✅ Remise appliquée

### Test 3 : Facture manuscrite

**Fichier de test :**
```
Facture artisan manuscrite
Photo smartphone (mauvaise qualité)
```

**Résultat attendu (avec Gemini) :**
- ✅ Texte reconnu malgré écriture manuscrite
- ⚠️ Vérification manuelle requise (confiance <85%)

---

## 🔍 Optimisation et Bonnes Pratiques

### Améliorer la précision

**1. Qualité des documents**
- ✅ PDF natifs > scans
- ✅ Résolution minimum : 300 DPI
- ✅ Contraste élevé
- ❌ Éviter photos floues

**2. Apprentissage du système**
```python
# Corriger les erreurs systématiquement
# Le système apprend des corrections
# Après 20-30 factures d'un fournisseur :
#   → Précision passe de 85% à 98%
```

**3. Templates fournisseurs**
```python
# Documents → Configuration → Vendor Templates
# Créer template par fournisseur récurrent :

Template EDF :
- Numéro facture : Ligne 3, position X
- Montant TTC : Ligne 25, position Y
- Référence client : Ligne 5
```

### Gérer les erreurs fréquentes

**Erreur 1 : Fournisseur non trouvé**
```python
# Solution : Créer fiche fournisseur
# Contacts → Créer
# Remplir : Nom, TVA, Adresse
# Relancer OCR
```

**Erreur 2 : Montant incorrect**
```python
# Cause : OCR confond 0 et O, 1 et l
# Solution : Vérification manuelle
# Corriger → système apprend
```

**Erreur 3 : Date inversée (US vs EU)**
```python
# Settings → General → Date Format
# Forcer : DD/MM/YYYY (Europe)
# OCR → Configuration → Date Parser = 'EU'
```

### Monitoring

**Dashboard OCR**
```python
# Reports → OCR Statistics
# Métriques :
- Factures traitées : X/mois
- Précision moyenne : 96%
- Temps traitement moyen : 8 secondes
- Erreurs : 4%
- Crédits consommés (si Enterprise)
```

---

## 💰 Coûts

### Option 1 : Odoo Enterprise natif
```
Licence Odoo Enterprise : 50€/user/mois
Crédits OCR : 0,10€ - 0,30€ par facture
Volume 100 factures/mois = 10-30€/mois
Volume 500 factures/mois = 50-150€/mois
```

### Option 2 : AI Invoice OCR (TechUltra)
```
Licence one-time : 199€
ou Abonnement : 49€/mois
Factures illimitées
API externe : Google Vision = 1,50$ / 1000 pages
Volume 500 factures/mois ≈ 50€ total
```

### Option 3 : Gemini Invoice Capture
```
Abonnement : 149€/mois
Factures illimitées
IA GPT-4 incluse
```

### Recommandation
**Pour <200 factures/mois** : Odoo Enterprise natif
**Pour 200-1000 factures/mois** : AI Invoice OCR ⭐
**Pour >1000 factures/mois** : Gemini + API dédiée

---

## 🔐 Sécurité et Conformité

### RGPD

```python
# Les factures contiennent des données personnelles
# Configuration :

1. Settings → RGPD → Data Retention
   - Factures : 10 ans (légal France)
   - Documents OCR bruts : 1 an

2. Settings → Security → Access Rights
   - Comptables : lecture/écriture factures
   - Managers : validation
   - Clients : aucun accès factures fournisseurs
```

### Audit Trail

```python
# Activer traçabilité complète
# Settings → Accounting → Lock Posted Entries

# Logs automatiques :
- Qui a uploadé la facture ?
- Modifications OCR vs Manuel
- Validations et rejets
- Export pour audit
```

---

## 📞 Support et Ressources

### Documentation officielle Odoo
- https://www.odoo.com/documentation/17.0/applications/finance/accounting/vendor_bills/invoice_digitization.html

### Modules recommandés
- **AI Invoice OCR** : https://apps.odoo.com/apps/modules/17.0/ai_invoice_ocr/
- **Gemini Invoice Capture** : https://apps.odoo.com/apps/modules/17.0/gemini_invoice_ocr/

### APIs OCR externes
- **Google Vision AI** : https://cloud.google.com/vision/docs/ocr
- **AWS Textract** : https://aws.amazon.com/textract/
- **Azure Computer Vision** : https://azure.microsoft.com/services/cognitive-services/computer-vision/

### Communauté
- Forum Odoo : https://www.odoo.com/forum
- GitHub : https://github.com/odoo/odoo (pour issues)

---

## 📋 Checklist Installation Complète

### Phase 1 : Installation (1-2 heures)
- [ ] Vérifier version Odoo 17.0+
- [ ] Installer module "Documents"
- [ ] Installer module "Comptabilité"
- [ ] Choisir module OCR (natif ou tiers)
- [ ] Installer module OCR choisi
- [ ] Créer compte API OCR (Google Vision ou AWS)
- [ ] Configurer clés API dans Odoo

### Phase 2 : Configuration (2-3 heures)
- [ ] Créer workspaces Documents
- [ ] Configurer mapping champs
- [ ] Définir comptes comptables par défaut
- [ ] Créer fiches fournisseurs récurrents
- [ ] Configurer workflow validation
- [ ] Configurer alias email factures@
- [ ] Créer règles de routage automatique

### Phase 3 : Tests (1 heure)
- [ ] Test facture PDF simple
- [ ] Test facture multi-lignes
- [ ] Test facture manuscrite
- [ ] Test email entrant
- [ ] Test traitement par lots
- [ ] Vérifier précision >95%

### Phase 4 : Formation (2 heures)
- [ ] Former équipe comptable
- [ ] Documenter procédures internes
- [ ] Créer guide rapide utilisateur
- [ ] Définir SLA (délai traitement)

### Phase 5 : Production (ongoing)
- [ ] Lancer en production
- [ ] Monitorer quotidiennement 1ère semaine
- [ ] Corriger erreurs systématiques
- [ ] Optimiser templates fournisseurs
- [ ] Évaluer ROI après 1 mois

---

## 🎯 ROI Attendu

### Gains de temps
```
Temps manuel par facture : 5-10 minutes
Temps avec OCR : 30 secondes (validation)

100 factures/mois :
- Avant : 500-1000 min = 8-17 heures
- Après : 50 min = 0,8 heure
- Gain : 7-16 heures/mois = 1-2 jours

Coût horaire comptable : 30€/h
Économie mensuelle : 210-480€/mois
```

### Réduction erreurs
```
Erreurs manuelles : 3-5%
Erreurs OCR : <1%
→ Moins de litiges fournisseurs
→ Moins de corrections
```

### Délais de paiement
```
Traitement manuel : 3-5 jours
Traitement OCR : <1 jour
→ Meilleurs relations fournisseurs
→ Possibilité escomptes paiement anticipé
```

---

**Dernière mise à jour** : Novembre 2024
**Version Odoo** : 17.0
**Statut** : Guide complet prêt pour déploiement
