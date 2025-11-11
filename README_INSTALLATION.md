# Installation rapide - Module Import/Export ISEB

## 🚀 Installation automatique (Recommandé)

### Option 1 : Script d'installation automatique

```bash
# Rendre le script exécutable (si ce n'est pas déjà fait)
chmod +x install_import_export.sh

# Lancer l'installation
./install_import_export.sh
```

**Ce script va automatiquement :**
1. ✅ Vérifier Docker et Odoo
2. ✅ Installer le module `account` (Comptabilité Odoo)
3. ✅ Installer le module `account_import_export` (Import/Export ISEB)
4. ✅ Redémarrer Odoo
5. ✅ Vérifier que tout fonctionne

**Durée** : 2-3 minutes

---

## 🔍 Vérification des prérequis

### Vérifier avant l'installation

```bash
# Vérifier les dépendances
python3 check_dependencies.py
```

**Le script vérifie :**
- ✓ Modules Odoo installés (base, account, account_import_export)
- ✓ Configuration société (SIREN obligatoire pour FEC)
- ✓ Plan comptable présent
- ✓ Journaux configurés
- ✓ Droits utilisateurs

**Résultat attendu :**
```
✅ Tous les prérequis sont satisfaits!

🎉 Vous pouvez utiliser le module Import/Export:
   - Web: http://localhost:3000/settings → Import/Export
   - Odoo: Comptabilité → Configuration → Import / Export
```

---

## 📋 Prérequis manuels

Si vous préférez installer manuellement, voici les prérequis :

### 1. Module Comptabilité Odoo (obligatoire)

**Via l'interface Odoo :**
```
1. http://localhost:8069
2. Apps → Rechercher "Accounting"
3. Cliquer sur "Installer"
4. Attendre 2-3 minutes
5. Configurer :
   - Pays : France
   - Plan comptable : PCG Français
```

**Via la ligne de commande :**
```bash
docker-compose exec odoo odoo-bin -d iseb_db -i account --stop-after-init
docker-compose restart odoo
```

### 2. Module ISEB Import/Export (obligatoire)

**Via l'interface Odoo :**
```
1. Apps → Menu (⋮) → Mettre à jour la liste des applications
2. Rechercher "ISEB Import/Export"
3. Cliquer sur "Installer"
```

**Via la ligne de commande :**
```bash
docker-compose exec odoo odoo-bin -d iseb_db -i account_import_export --stop-after-init
docker-compose restart odoo
```

### 3. Configuration société (obligatoire pour export FEC)

```
Paramètres → Sociétés → Votre société
```

**Remplir obligatoirement :**
- ✅ SIREN : 9 chiffres (ex: 123456789)
- ✅ SIRET : 14 chiffres (ex: 12345678900010)
- ✅ N° TVA : Format FR + 11 chiffres (ex: FR12345678901)

**Sans SIREN, l'export FEC ne fonctionnera pas !**

### 4. Plan comptable (recommandé)

Si pas déjà chargé :
```
Comptabilité → Configuration → Plan comptable → Importer le PCG français
```

---

## ✅ Vérification post-installation

### Test 1 : Vérifier les menus

```
Odoo → Comptabilité → Configuration → Import / Export
```

Vous devriez voir :
- ✓ **Importer des données**
- ✓ **Exporter des données**

### Test 2 : Export FEC de test

```bash
# Via le script
python3 check_dependencies.py

# Résultat attendu : ✅ Tous les prérequis sont satisfaits!
```

### Test 3 : Interface web

```
http://localhost:3000/settings → Onglet "Import/Export"
```

Vous devriez voir :
- ✓ Section **Importer des données comptables**
- ✓ Section **Exporter des données comptables**

---

## 🆘 Dépannage rapide

### Problème : Module "account" introuvable

**Solution :**
```bash
# Mettre à jour la liste
docker-compose exec odoo odoo-bin -d iseb_db -u all --stop-after-init
docker-compose restart odoo
```

### Problème : Erreur "SIREN invalide"

**Solution :**
```
Paramètres → Sociétés → Votre société → SIREN
```
Saisir exactement 9 chiffres : `123456789`

### Problème : Menu Import/Export invisible

**Solution :**
1. Vérifier les droits utilisateur
2. Se déconnecter / reconnecter
3. Vider le cache navigateur

### Problème : Import échoue avec "Compte non trouvé"

**Solution :**
```
Comptabilité → Configuration → Plan comptable
```
Créer les comptes manquants ou activer "Créer comptes automatiquement" dans l'assistant d'import

---

## 📚 Documentation complète

- **[INSTALLATION_IMPORT_EXPORT.md](./INSTALLATION_IMPORT_EXPORT.md)** - Guide d'installation détaillé
- **[IMPORT_EXPORT_GUIDE.md](./IMPORT_EXPORT_GUIDE.md)** - Guide utilisateur complet

---

## 🎯 Checklist rapide

Avant d'utiliser l'import/export :

- [ ] Odoo installé et actif (http://localhost:8069)
- [ ] Module `account` installé
- [ ] Module `account_import_export` installé
- [ ] SIREN configuré (9 chiffres)
- [ ] Plan comptable chargé
- [ ] Journaux créés (VE, AC, BQ, OD)
- [ ] Test export FEC réussi

**Vérification automatique :**
```bash
python3 check_dependencies.py
```

---

## 📞 Support

**Documentation :**
- Installation : `INSTALLATION_IMPORT_EXPORT.md`
- Utilisation : `IMPORT_EXPORT_GUIDE.md`

**Scripts utiles :**
- Installation auto : `./install_import_export.sh`
- Vérification : `python3 check_dependencies.py`

**Contact :**
- Email : support@iseb.fr
- Documentation : https://docs.iseb.fr

---

**Version** : 1.0.0
**Date** : Novembre 2024
**Compatibilité** : Odoo 17, Next.js 14
