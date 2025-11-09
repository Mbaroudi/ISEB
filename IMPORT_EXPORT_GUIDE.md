# Guide d'Import/Export Comptable ISEB

## Vue d'ensemble

ISEB supporte l'import et l'export de données comptables dans les formats standards français, permettant une migration facile depuis/vers d'autres logiciels comptables comme EBP, Sage, Ciel, etc.

## Formats supportés

### 1. FEC (Fichier des Écritures Comptables) 🇫🇷

#### Description
- **Format officiel** obligatoire en France depuis 2014 (Article L47 A du LPF)
- Requis pour les contrôles fiscaux de la DGFIP
- Format texte avec 18 champs obligatoires séparés par `|` (pipe)
- Encodage : UTF-8 ou ISO-8859-15 (Latin-9)

#### Nom du fichier
Format : `SIRENFECAAAAMMJJ.txt`
- SIREN : Numéro SIREN de l'entreprise (9 chiffres)
- AAAAMMJJ : Date de clôture (année, mois, jour)
- Exemple : `123456789FEC20241231.txt`

#### Structure
18 champs obligatoires séparés par `|` :
```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
```

#### Exemple de ligne
```
VE|Ventes|VE20240001|20240115|411000|Clients|C001|Dupont SARL|FAC001|20240115|Facture n°001|1200,00|0,00|||20240115||
```

#### Validation
- Outil officiel : **Test Compta Demat** (DGFIP)
- Disponible sur : https://www.economie.gouv.fr/dgfip/outil-de-test-des-fichiers-des-ecritures-comptables-fec

### 2. XIMPORT (Format universel) 📊

#### Description
- Format universel utilisé par **Ciel**, **EBP**, **Sage**
- Format texte ASCII avec champs à largeur fixe
- Nom du fichier : `XIMPORT.TXT`
- Encodage : CP1252 (Windows-1252 / ANSI)

#### Structure
Chaque ligne commence par un type :
- `L` : Ligne d'écriture comptable (le plus courant)
- `M` : En-tête de mouvement (optionnel)
- `#` ou `;` : Commentaire

#### Format de ligne type L
```
Position | Taille | Champ          | Description
---------|--------|----------------|---------------------------
0        | 1      | Type           | L = Ligne d'écriture
1        | 2      | Journal        | Code journal (ex: VE, AC)
3        | 6      | Date           | JJMMAA (ex: 150124)
9        | 10     | Compte         | Numéro de compte
19       | 25     | Libellé        | Libellé de l'écriture
44       | 14     | Débit          | Montant débit (centimes)
58       | 14     | Crédit         | Montant crédit (centimes)
72       | 1      | Sens           | C ou D
73       | 8      | Pièce          | Numéro de pièce
81       | 3      | Lettrage       | Code lettrage
84       | 3      | Devise         | Code devise (EUR, USD...)
87       | 14     | Montant devise | Montant en devise
101      | 6      | Échéance       | Date échéance JJMMAA
```

#### Exemple de ligne
```
LVE150124411000    Facture n°001            000120000000000000000000DFAC001
```

**Décodage** :
- `L` : Type ligne
- `VE` : Journal Ventes
- `150124` : 15/01/2024
- `411000` (10 car) : Compte client
- `Facture n°001` (25 car) : Libellé
- `000120000` (14 car) : 1200,00 € en centimes
- `000000000` : Crédit = 0
- `D` : Débit
- `FAC001` (8 car) : Référence pièce

### 3. CSV 📄

#### Description
- Format tableur universel
- Séparateur : virgule `,` ou point-virgule `;`
- Encodage : UTF-8

#### Structure minimale
```csv
Date,Journal,Compte,Libellé,Débit,Crédit,Référence
15/01/2024,VE,411000,Facture n°001,1200.00,0.00,FAC001
15/01/2024,VE,707000,Ventes de produits,0.00,1000.00,FAC001
15/01/2024,VE,445710,TVA collectée,0.00,200.00,FAC001
```

## Procédures d'import

### Via l'interface web (Recommandé)

#### 1. Accéder à l'import
- Connectez-vous à ISEB
- Allez dans **Paramètres** → **Import/Export**
- Section **Importer des données comptables**

#### 2. Sélectionner le format
- **Détection automatique** : ISEB détecte le format automatiquement
- Ou sélectionner manuellement : FEC, XIMPORT, CSV

#### 3. Choisir le fichier
- Cliquer sur "Sélectionner un fichier"
- Extensions acceptées : `.txt`, `.csv`
- Taille max : 50 Mo

#### 4. Configurer les options
- ✅ **Validation avant import** : Recommandé pour détecter les erreurs
- ❌ **Créer comptes automatiquement** : Désactivé par défaut (recommandé)
- ✅ **Créer tiers automatiquement** : Activé par défaut

#### 5. Lancer l'import
- Cliquer sur **Importer**
- La validation s'effectue automatiquement
- Si erreurs détectées : correction nécessaire
- Si succès : écritures créées dans Odoo

### Via Odoo (Expert)

#### 1. Dans le menu Comptabilité
- **Comptabilité** → **Configuration** → **Import / Export** → **Importer des données**

#### 2. Assistant d'import
- Sélectionner le fichier
- Choisir le format
- Valider (optionnel)
- Importer

## Procédures d'export

### Via l'interface web (Recommandé)

#### 1. Accéder à l'export
- **Paramètres** → **Import/Export**
- Section **Exporter des données comptables**

#### 2. Sélectionner le format
- **FEC** : Pour contrôle fiscal ou sauvegarde officielle
- **XIMPORT** : Pour migration vers Ciel/EBP/Sage
- **Les deux** : Génère les 2 fichiers simultanément

#### 3. Choisir la période
- **Date de début** : Premier jour de l'exercice
- **Date de fin** : Dernier jour de l'exercice
- Exemple : 01/01/2024 → 31/12/2024

#### 4. Générer et télécharger
- Cliquer sur **Exporter**
- Les fichiers se téléchargent automatiquement
- Formats générés :
  - FEC : `{SIREN}FEC{AAAAMMJJ}.txt`
  - XIMPORT : `XIMPORT.TXT`

### Via Odoo (Expert)

#### 1. Dans le menu Comptabilité
- **Comptabilité** → **Configuration** → **Import / Export** → **Exporter des données**

#### 2. Assistant d'export
- Période (date début/fin)
- Format souhaité
- Générer

## Guide de migration

### Migration depuis EBP

#### 1. Exporter depuis EBP
1. Dans EBP Comptabilité :
   - **Dossier** → **Importer/Exporter** → **Exporter des écritures**
   - Format : **XIMPORT** ou **FEC**
   - Période : Exercice complet
   - Enregistrer le fichier

2. Fichier généré :
   - XIMPORT : `XIMPORT.TXT`
   - FEC : `{SIREN}FEC{DATE}.txt`

#### 2. Importer dans ISEB
1. ISEB → **Paramètres** → **Import/Export**
2. Format : **XIMPORT** ou **FEC** (selon export)
3. Sélectionner le fichier EBP
4. Activer "Validation avant import"
5. Importer

### Migration depuis Sage

#### 1. Exporter depuis Sage
1. Dans Sage Comptabilité :
   - **Fichier** → **Format paramétrable** → **Export**
   - Format : Sélectionner **XIMPORT** ou **FEC**
   - Période : Choisir l'exercice
   - Lancer l'export

2. Ou utiliser :
   - **Outils** → **Export** → **Fichier des écritures comptables (FEC)**

#### 2. Importer dans ISEB
- Même procédure que pour EBP
- Format détecté automatiquement

### Migration depuis Ciel

#### 1. Exporter depuis Ciel
1. Dans Ciel Compta :
   - **Utilitaires** → **Import/Export** → **Exporter**
   - Format : **Format XIMPORT standard**
   - Période : Sélectionner l'exercice
   - Destination : Enregistrer sur le disque

2. Ou :
   - **Communication expert** → **Export FEC**

#### 2. Importer dans ISEB
- Uploader le fichier XIMPORT.TXT ou FEC
- ISEB gère automatiquement la conversion

### Migration vers un autre logiciel

#### 1. Exporter depuis ISEB
- Format **XIMPORT** (universel)
- Ou format **FEC** (si supporté par logiciel cible)

#### 2. Importer dans le logiciel cible
- Consulter la documentation du logiciel cible
- Généralement : Import → Format XIMPORT

## Bonnes pratiques

### Avant l'import

1. **Backup** : Sauvegarder la base de données
2. **Plan comptable** : Créer les comptes avant import (ou activer création auto)
3. **Validation** : Toujours activer "Validation avant import"
4. **Test** : Importer d'abord 1 mois de données pour tester

### Pendant l'import

1. **Erreurs comptes** : Noter les comptes manquants
2. **Création tiers** : Vérifier les tiers créés automatiquement
3. **Monitoring** : Surveiller le nombre d'écritures importées

### Après l'import

1. **Vérification** : Comparer les balances (ancien logiciel vs ISEB)
2. **Lettrage** : Vérifier que le lettrage est conservé
3. **Écritures types** : Vérifier quelques écritures manuellement
4. **Balance** : Éditer la balance et comparer avec l'ancien système

### Export FEC pour contrôle fiscal

1. **Période** : Exercice complet (01/01 → 31/12)
2. **Validation** : Toutes les écritures doivent être validées
3. **Test** : Valider avec Test Compta Demat avant remise
4. **Conservation** : Conserver le FEC 6 ans minimum

## Troubleshooting

### Erreurs courantes d'import

#### "Compte non trouvé : XXXXXX"
**Cause** : Le compte n'existe pas dans le plan comptable
**Solution** :
1. Créer le compte manuellement dans Odoo
2. Ou activer "Créer comptes automatiquement" (déconseillé)

#### "Format de date invalide"
**Cause** : Format de date non reconnu
**Solution** :
1. Vérifier que le format est JJMMAA (XIMPORT) ou AAAAMMJJ (FEC)
2. Convertir le fichier si nécessaire

#### "Montant invalide"
**Cause** : Séparateur décimal incorrect
**Solution** :
- FEC : Utiliser `,` (virgule)
- XIMPORT : Montants en centimes (entiers)

#### "Journal non trouvé : XX"
**Cause** : Le code journal n'existe pas
**Solution** :
1. Créer le journal dans Odoo : **Comptabilité** → **Configuration** → **Journaux**
2. Ou modifier le fichier pour utiliser un code existant

### Erreurs courantes d'export

#### "Aucune écriture trouvée"
**Cause** : Pas d'écritures validées dans la période
**Solution** :
1. Vérifier la période sélectionnée
2. Valider les écritures (État = "Comptabilisé")

#### "Fichier FEC invalide"
**Cause** : SIREN manquant ou invalide
**Solution** :
1. Configurer le SIREN dans **Paramètres** → **Entreprise**
2. Format : 9 chiffres exactement

## Support technique

### Documentation officielle
- DGFIP FEC : https://www.economie.gouv.fr/dgfip/outil-de-test-des-fichiers-des-ecritures-comptables-fec
- Odoo Accounting : https://www.odoo.com/documentation/17.0/applications/finance/accounting.html

### Contacts
- Support ISEB : support@iseb.fr
- Documentation ISEB : https://docs.iseb.fr

---

**Version** : 1.0.0
**Dernière mise à jour** : Novembre 2024
**Auteur** : ISEB Team
