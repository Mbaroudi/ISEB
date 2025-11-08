# Guide: Menus ISEB Non Visibles dans Odoo

## 🎯 Problème

Vous ne voyez que "Facturation" dans Odoo alors que plusieurs modules sont installés.

## 📋 Menus Qui DEVRAIENT Être Visibles

Si les modules sont correctement installés, vous devriez voir ces menus principaux:

### 1. **Comptabilité FR** (french_accounting)
- 📁 Export FEC
- 📁 Déclarations TVA
- 📁 Liasses Fiscales
- ⚙️ Configuration

### 2. **Mon Espace Client** (client_portal)
- 📊 Tableau de Bord
- 📄 Documents
  - Tous les documents
- 💰 Notes de Frais
  - Toutes les notes
  - Brouillons
  - En attente validation

### 3. **Cabinet** (cabinet_portal)
- 📊 Dashboard
- 👥 Clients
  - Tous les clients
- ✅ Tâches
- 🔍 Validations
  - Documents à valider
  - Notes de frais à valider
- ⚙️ Configuration

### 4. **Autres Modules Standards Odoo**
- 💼 Facturation (module `account`)
- 🌐 Website (si installé)
- 🏦 Bank Sync (menus intégrés dans Comptabilité)
- 📧 E-Invoicing (menus intégrés dans Facturation)
- 📊 Reporting (menus intégrés dans Comptabilité)

---

## 🔍 Diagnostic Rapide

### Étape 1: Vérifier l'État des Modules

```bash
cd ~/ISEB
python3 check_modules_status.py
```

Ce script vous montrera:
- ✅ Quels modules sont réellement installés
- 📁 Quels menus sont disponibles
- 👤 Quels groupes/permissions vous avez
- 📊 Si les données de démo sont chargées

### Étape 2: Vérifier dans l'Interface Odoo

1. **Accédez à la liste des modules:**
   ```
   http://localhost:8069/web#action=base.open_module_tree
   ```

2. **Filtrez les modules installés:**
   - Cliquez sur "Filtres"
   - Sélectionnez "Installed"

3. **Recherchez vos modules:**
   - Tapez "ISEB" dans la barre de recherche
   - Vous devriez voir: Client Portal, Cabinet Portal, French Accounting, etc.

### Étape 3: Actualiser la Page

Parfois les menus apparaissent après un rafraîchissement:

```
Ctrl + Shift + R (ou Cmd + Shift + R sur Mac)
```

Ou déconnectez-vous et reconnectez-vous.

---

## 🔧 Solutions Selon le Diagnostic

### Cas 1: Modules Marqués "Installés" Mais Menus Invisibles

**Cause:** Les menus sont peut-être cachés par les permissions.

**Solution:**

1. Vérifiez que vous êtes admin:
   ```
   Settings → Users & Companies → Users
   Cliquez sur votre utilisateur
   Vérifiez que "Administration / Settings" est coché
   ```

2. Activez le mode développeur:
   ```
   Settings → Activate the developer mode
   ```

3. Videz le cache du navigateur et rafraîchissez:
   ```
   Ctrl + Shift + Delete (navigateur)
   → Clear cache
   → Reload page
   ```

### Cas 2: Modules "To Install" ou "To Upgrade"

**Cause:** L'installation n'est pas terminée.

**Solution:**

```bash
cd ~/ISEB

# Option A: Via API
python3 install_modules_api.py

# Option B: Via Docker
docker compose exec odoo odoo-bin -d iseb_db -u all --stop-after-init
docker compose restart odoo
```

### Cas 3: Modules "Not Found"

**Cause:** Les modules ne sont pas dans le chemin d'addon d'Odoo.

**Solution:**

1. Vérifiez le docker-compose.yml:
   ```bash
   grep "addons" docker-compose.yml
   ```

   Devrait afficher:
   ```yaml
   - ./addons:/mnt/extra-addons:ro
   ```

2. Redémarrez Odoo:
   ```bash
   docker compose restart odoo
   ```

3. Mettez à jour la liste des modules:
   ```bash
   docker compose exec odoo odoo-bin -d iseb_db -u base --stop-after-init
   docker compose restart odoo
   ```

### Cas 4: Seulement "Facturation" Visible

**Cause:** Seul le module `account` (standard Odoo) est installé.

**Solution:** Installer les modules ISEB:

```bash
cd ~/ISEB

# Méthode recommandée: via API
python3 install_modules_api.py

# Attendre la fin de l'installation (affichera la progression)
```

---

## 📊 Charger les Données de Démonstration

Les modules ISEB installent sans données de démo par défaut (`--without-demo=all`).

Pour voir du contenu exemple:

### Option 1: Via l'Interface

1. Allez dans Apps
2. Recherchez "Client Portal - ISEB"
3. Cliquez sur "Désinstaller"
4. Puis "Installer" et **cochez** "Load demonstration data"

### Option 2: Via la Ligne de Commande

```bash
# Arrêter Odoo
docker compose down

# Supprimer la base (ATTENTION: Perte de données!)
docker compose down -v

# Redémarrer
docker compose up -d

# Attendre 30s, puis créer la base via l'interface
http://localhost:8069

# Installer AVEC données de démo
docker compose exec odoo odoo-bin \
    -d iseb_db \
    -i french_accounting,website,client_portal,cabinet_portal,bank_sync,e_invoicing,reporting \
    --stop-after-init

# Redémarrer
docker compose restart odoo
```

**Note:** Cela créera des clients, factures, documents et notes de frais exemples.

---

## 🎨 Créer des Données Manuellement

Si vous voulez garder votre base actuelle mais ajouter du contenu:

### 1. Créer un Client

```
Contacts → Create
- Nom: "Entreprise Test"
- Type: Société
- Cocher "Is ISEB Client"
- Save
```

### 2. Créer une Facture

```
Facturation → Customers → Invoices → Create
- Client: "Entreprise Test"
- Ligne de facture: Ajouter un produit
- Save → Confirm
```

### 3. Créer une Note de Frais

```
Mon Espace Client → Notes de Frais → Create
- Titre: "Repas client"
- Montant: 45.50
- Date: Aujourd'hui
- Save
```

### 4. Créer un Export FEC

```
Comptabilité FR → Export FEC → Create
- Période: 01/01/2025 - 31/12/2025
- Save → Générer FEC
```

---

## 🔍 Vérifications Avancées

### Vérifier les Menus en Base de Données

```bash
# Connexion au container PostgreSQL
docker compose exec db psql -U odoo -d iseb_db

# Lister les menus racine
SELECT name, sequence FROM ir_ui_menu WHERE parent_id IS NULL ORDER BY sequence;

# Compter les menus par module
SELECT res_model, COUNT(*) as menu_count
FROM ir_ui_menu
WHERE res_model IS NOT NULL
GROUP BY res_model
ORDER BY menu_count DESC
LIMIT 10;

# Quitter
\q
```

### Vérifier les Logs Odoo

```bash
# Chercher des erreurs liées aux menus
docker compose logs odoo | grep -i "menu\|french_accounting\|client_portal" | tail -50
```

---

## 📞 Si Rien ne Fonctionne

### Réinstallation Propre

```bash
cd ~/ISEB

# 1. Sauvegarder (optionnel)
# http://localhost:8069/web/database/manager → Backup

# 2. Tout supprimer
docker compose down -v

# 3. Récupérer le code à jour
git pull origin claude/odoo-saas-accounting-platform-011CUtvteLJZet7GMhVhrMqe

# 4. Reconstruire
docker compose build --no-cache

# 5. Démarrer
docker compose up -d

# 6. Créer la base via l'interface (attendre 30s)
http://localhost:8069

# 7. Installer les modules
python3 install_modules_api.py

# 8. Vérifier
python3 check_modules_status.py
```

Cela devrait résoudre 99% des problèmes !

---

## ✅ Checklist de Vérification

- [ ] Modules marqués "installed" dans Apps
- [ ] Mode développeur activé
- [ ] Page rafraîchie (Ctrl+Shift+R)
- [ ] Utilisateur admin avec droits Settings
- [ ] Cache navigateur vidé
- [ ] Odoo redémarré
- [ ] Menus visibles en haut de l'écran
- [ ] Script check_modules_status.py exécuté

---

**Créé:** 2025-11-08
**But:** Diagnostiquer pourquoi les menus ISEB ne sont pas visibles
**Modules concernés:** french_accounting, client_portal, cabinet_portal
