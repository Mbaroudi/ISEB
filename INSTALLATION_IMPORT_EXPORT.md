# Guide d'Installation - Module Import/Export Comptable

## Prérequis système

### 1. Modules Odoo requis

Le module **ISEB - Import/Export Comptable** nécessite les modules suivants :

#### ✅ Modules obligatoires

| Module | Nom technique | Description | Installation |
|--------|---------------|-------------|--------------|
| **Base** | `base` | Module de base Odoo | ✓ Pré-installé |
| **Comptabilité** | `account` | Module comptable principal | **À installer** |
| **Invoicing** | `account_accountant` | Fonctionnalités comptables avancées | Recommandé |

#### 📦 Modules recommandés (optionnels)

| Module | Nom technique | Utilité |
|--------|---------------|---------|
| **Facturation** | `account_invoicing` | Gestion factures clients/fournisseurs |
| **Paiements** | `account_payment` | Gestion des paiements |
| **Rapprochement bancaire** | `account_bank_statement_import` | Import relevés bancaires |
| **Multi-devises** | (inclus dans account) | Support devises étrangères |

### 2. Vérifier les modules installés

#### Via l'interface Odoo

1. Connectez-vous à Odoo en tant qu'administrateur
2. Allez dans **Apps** (Applications)
3. Recherchez "Comptabilité" ou "Accounting"
4. Vérifiez si le statut est **Installé** (vert) ou **Non installé** (gris)

#### Via la ligne de commande

```bash
# Vérifier les modules installés
python3 check_dependencies.py
```

## Installation étape par étape

### Étape 1 : Installer le module Comptabilité Odoo

#### Option A : Via l'interface web (Recommandé)

1. **Activer le mode développeur** :
   - Paramètres → Activer le mode développeur
   - Ou ajouter `?debug=1` dans l'URL

2. **Installer le module Comptabilité** :
   ```
   Apps → Rechercher "Accounting" → Cliquer sur "Installer"
   ```

3. **Attendre l'installation** :
   - L'installation peut prendre 2-5 minutes
   - Odoo installe automatiquement les dépendances

4. **Configuration initiale** :
   - Choisir le pays : **France**
   - Sélectionner le plan comptable : **Plan Comptable Général (PCG) Français**
   - Configurer la société (SIREN, SIRET, TVA)

#### Option B : Via la ligne de commande

```bash
# Méthode 1 : Via odoo-bin
docker-compose exec odoo odoo-bin -d iseb_db -i account --stop-after-init

# Méthode 2 : Via l'API
python3 install_accounting_module.py
```

### Étape 2 : Installer le module ISEB Import/Export

#### Option A : Via l'interface web

1. **Mettre à jour la liste des applications** :
   ```
   Apps → Menu (⋮) → Mettre à jour la liste des applications
   ```

2. **Rechercher le module** :
   ```
   Apps → Rechercher "ISEB Import/Export"
   ```

3. **Installer** :
   - Cliquer sur **Installer**
   - Attendre la fin de l'installation

#### Option B : Via la ligne de commande

```bash
# Installer le module
docker-compose exec odoo odoo-bin -d iseb_db -i account_import_export --stop-after-init

# Redémarrer Odoo
docker-compose restart odoo
```

### Étape 3 : Vérifier l'installation

1. **Vérifier les menus** :
   - Aller dans **Comptabilité** → **Configuration** → **Import / Export**
   - Vous devriez voir :
     - ✓ Importer des données
     - ✓ Exporter des données

2. **Tester un export** :
   - Comptabilité → Configuration → Import / Export → Exporter
   - Sélectionner une période
   - Générer un fichier FEC de test

3. **Vérifier les droits** :
   - Comptabilité → Configuration → Utilisateurs
   - S'assurer que les utilisateurs ont le groupe "Comptabilité / Utilisateur" ou "Comptabilité / Gestionnaire"

## Configuration post-installation

### 1. Configuration de la société

**Important** : Le SIREN est obligatoire pour les exports FEC.

```
Paramètres → Général → Sociétés → Votre société
```

Remplir obligatoirement :
- ✅ **Nom de la société**
- ✅ **SIREN** (9 chiffres) : Exemple `123456789`
- ✅ **SIRET** (14 chiffres) : Exemple `12345678900010`
- ✅ **N° TVA Intracommunautaire** : Exemple `FR12345678901`
- ✅ **Adresse complète**

### 2. Configuration du plan comptable

Le module utilise le plan comptable existant. Assurez-vous d'avoir :

```
Comptabilité → Configuration → Plan comptable
```

Comptes minimum requis :
- **Classe 1** : Capitaux (ex: 101000, 120000)
- **Classe 4** : Tiers (ex: 411000 Clients, 401000 Fournisseurs)
- **Classe 6** : Charges (ex: 607000 Achats)
- **Classe 7** : Produits (ex: 707000 Ventes)

### 3. Configuration des journaux

```
Comptabilité → Configuration → Journaux
```

Journaux minimum requis :
- **VE** : Journal de ventes
- **AC** : Journal d'achats
- **BQ** : Journal de banque
- **OD** : Opérations diverses

### 4. Droits utilisateurs

Assigner les droits appropriés aux utilisateurs :

```
Paramètres → Utilisateurs et sociétés → Utilisateurs
```

**Pour import/export** :
- Groupe : **Comptabilité / Gestionnaire** (account_manager)
- Ou : **Comptabilité / Utilisateur** (account_user) avec droits d'écriture

## Résolution de problèmes

### Problème 1 : Module "account" introuvable

**Symptôme** :
```
Module 'account' not found
```

**Solution** :
```bash
# 1. Vérifier que le module existe
ls -la /usr/lib/python3/dist-packages/odoo/addons/account

# 2. Mettre à jour la liste des modules
docker-compose exec odoo odoo-bin -d iseb_db -u all --stop-after-init

# 3. Redémarrer Odoo
docker-compose restart odoo
```

### Problème 2 : Erreur lors de l'installation

**Symptôme** :
```
Error while installing module 'account_import_export'
```

**Solution** :
1. Vérifier les logs Odoo :
   ```bash
   docker-compose logs odoo | tail -50
   ```

2. Vérifier les permissions :
   ```bash
   ls -la addons/account_import_export/
   ```

3. Réinstaller proprement :
   ```bash
   # Désinstaller
   docker-compose exec odoo odoo-bin -d iseb_db -u account_import_export --stop-after-init

   # Nettoyer le cache
   docker-compose exec odoo rm -rf /var/lib/odoo/.local/share/Odoo/filestore/iseb_db

   # Réinstaller
   docker-compose exec odoo odoo-bin -d iseb_db -i account_import_export --stop-after-init
   ```

### Problème 3 : Menus Import/Export invisibles

**Symptôme** :
Les menus n'apparaissent pas dans Comptabilité → Configuration

**Solution** :
1. Vérifier que l'utilisateur a les bons droits :
   ```
   Paramètres → Utilisateurs → Votre utilisateur → Groupes d'accès
   ```
   Cocher : **Comptabilité / Gestionnaire**

2. Se déconnecter/reconnecter

3. Vider le cache du navigateur (Ctrl+Shift+Delete)

### Problème 4 : Erreur "SIREN invalide" lors de l'export FEC

**Symptôme** :
```
Error: SIREN invalide ou manquant
```

**Solution** :
```
Paramètres → Sociétés → Votre société
```
- Saisir un SIREN valide de 9 chiffres
- Format : 123456789 (sans espaces)

### Problème 5 : Import échoue avec "Compte non trouvé"

**Symptôme** :
```
Account not found: 607000
```

**Solution** :
1. Créer les comptes manquants :
   ```
   Comptabilité → Configuration → Plan comptable → Créer
   ```

2. Ou activer "Créer comptes automatiquement" dans l'assistant d'import (déconseillé)

3. Ou préparer le plan comptable avant import avec tous les comptes utilisés dans le fichier

## Scripts utiles

### Script de vérification des dépendances

```bash
# Vérifier tous les prérequis
python3 check_dependencies.py

# Résultat attendu :
# ✓ Module 'base' installé
# ✓ Module 'account' installé
# ✓ Module 'account_import_export' installé
# ✓ SIREN configuré
# ✓ Plan comptable présent (150 comptes)
# ✓ Journaux configurés (4 journaux)
```

### Script d'installation automatique

```bash
# Installation complète automatisée
./install_import_export.sh

# Étapes :
# 1. Vérifier Odoo actif
# 2. Installer module 'account'
# 3. Installer module 'account_import_export'
# 4. Configurer société de base
# 5. Créer journaux par défaut
# 6. Vérifier installation
```

## Checklist d'installation complète

Avant d'utiliser l'import/export, vérifier :

- [ ] Odoo 17 installé et fonctionnel
- [ ] PostgreSQL actif
- [ ] Module `account` installé
- [ ] Module `account_import_export` installé
- [ ] SIREN/SIRET configuré (9/14 chiffres)
- [ ] Plan comptable chargé (au moins classes 1,4,6,7)
- [ ] Journaux créés (VE, AC, BQ, OD minimum)
- [ ] Droits utilisateurs configurés
- [ ] Tests export FEC réussis
- [ ] Tests import fichier exemple réussis

## Support

### Documentation
- [IMPORT_EXPORT_GUIDE.md](./IMPORT_EXPORT_GUIDE.md) - Guide utilisateur complet
- [Odoo Accounting](https://www.odoo.com/documentation/17.0/applications/finance/accounting.html) - Documentation officielle

### Problèmes connus
- ⚠️ Le module nécessite Odoo 17+
- ⚠️ L'import de gros fichiers (>10 000 lignes) peut être lent
- ⚠️ Les comptes doivent exister avant import (sauf si auto-création activée)

### Contact
- Email : support@iseb.fr
- Documentation : https://docs.iseb.fr

---

**Version** : 1.0.0
**Dernière mise à jour** : Novembre 2024
**Compatibilité** : Odoo 17.0
