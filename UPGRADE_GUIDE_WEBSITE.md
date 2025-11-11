# Guide de Mise à Jour: Intégration du Module Website

## 🎯 Objectif

Ajouter le module `website` à votre installation ISEB pour activer le CSS frontend complet de `client_portal`.

---

## 📊 État Actuel vs État Cible

### Avant (Installation Actuelle)
```
✅ french_accounting
✅ client_portal (sans CSS frontend)
✅ bank_sync
✅ e_invoicing
✅ reporting
⏳ cabinet_portal (à installer)
```

### Après (Nouvelle Installation)
```
✅ french_accounting
✅ website (NOUVEAU - module Odoo standard)
✅ client_portal (avec CSS frontend + backend)
✅ cabinet_portal
✅ bank_sync
✅ e_invoicing
✅ reporting
```

---

## 🚀 Option 1: Mise à Jour de l'Installation Existante (Recommandé)

### Étape 1: Installer le Module Website

```bash
# Via l'interface Odoo
http://localhost:8069/web#action=base.open_module_tree

# Rechercher "website"
# Cliquer sur "Installer"
# Attendre 2-3 minutes
```

**OU via API:**

```bash
cd ~/ISEB

cat > install_website.py << 'EOF'
#!/usr/bin/env python3
import xmlrpc.client
import time

ODOO_URL = 'http://localhost:8069'
DB_NAME = 'iseb_db'
USERNAME = 'admin'
PASSWORD = 'admin'

print("Installation du module website...")
common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
uid = common.authenticate(DB_NAME, USERNAME, PASSWORD, {})

# Chercher le module website
module_ids = models.execute_kw(
    DB_NAME, uid, PASSWORD,
    'ir.module.module', 'search',
    [[('name', '=', 'website')]]
)

if module_ids:
    # Installer
    models.execute_kw(
        DB_NAME, uid, PASSWORD,
        'ir.module.module', 'button_immediate_install',
        [module_ids]
    )

    print("Installation lancée...")
    for i in range(60):
        time.sleep(5)
        module_data = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'read',
            [module_ids, ['state']]
        )
        state = module_data[0]['state']
        print(f"[{i*5}s] État: {state}")

        if state == 'installed':
            print("\n✅ Module website installé!")
            break
else:
    print("✗ Module website non trouvé")
EOF

chmod +x install_website.py
python3 install_website.py
```

### Étape 2: Mettre à Jour client_portal

```bash
cd ~/ISEB

# Récupérer les derniers changements
git pull origin claude/odoo-saas-accounting-platform-011CUtvteLJZet7GMhVhrMqe

# Mettre à jour le module via l'interface Odoo
http://localhost:8069/web#action=base.open_module_tree

# Rechercher "Client Portal - ISEB"
# Cliquer sur "Mettre à jour" (ou "Upgrade")
```

**OU via Docker:**

```bash
docker compose exec odoo odoo-bin -d iseb_db -u client_portal --stop-after-init

# Redémarrer Odoo
docker compose restart odoo
```

### Étape 3: Vérifier

```bash
# Accéder à Odoo
http://localhost:8069

# Vérifier que le CSS se charge
# - Inspecter la page (F12)
# - Onglet "Network"
# - Chercher "portal.css"
# - Devrait être chargé depuis /client_portal/static/src/css/portal.css
```

---

## 🔄 Option 2: Réinstallation Propre (Si Option 1 Échoue)

### Étape 1: Sauvegarder vos Données

```bash
# Exporter la base de données
http://localhost:8069/web/database/manager

# Cliquer sur "Backup" pour iseb_db
# Télécharger le fichier .zip
```

### Étape 2: Réinstaller avec le Nouveau Script

```bash
cd ~/ISEB

# Récupérer les changements
git pull origin claude/odoo-saas-accounting-platform-011CUtvteLJZet7GMhVhrMqe

# Arrêter Odoo
docker compose down

# Supprimer les volumes (ATTENTION: Perte de données!)
docker compose down -v

# Redémarrer avec une base propre
docker compose up -d

# Attendre 30 secondes, puis créer la base
http://localhost:8069

# Lancer le nouveau script d'installation
python3 install_modules_api.py
```

Le script installera automatiquement:
1. french_accounting
2. **website** ← NOUVEAU
3. client_portal (avec CSS complet)
4. cabinet_portal
5. bank_sync
6. e_invoicing
7. reporting

---

## 📝 Différences Techniques

### Manifest client_portal

**Avant:**
```python
'depends': [
    'base',
    'account',
    'portal',
    'mail',
    'web',
],
```

**Après:**
```python
'depends': [
    'base',
    'account',
    'portal',
    'mail',
    'web',
    'website',  # ← AJOUTÉ
],
```

### assets.xml

**Avant:**
```xml
<!-- Frontend désactivé -->
<template id="assets_backend" inherit_id="web.assets_backend">
    <link rel="stylesheet" href="/client_portal/static/src/css/portal.css"/>
</template>
```

**Après:**
```xml
<!-- Frontend ET Backend activés -->
<template id="assets_frontend" inherit_id="website.assets_frontend">
    <link rel="stylesheet" href="/client_portal/static/src/css/portal.css"/>
</template>

<template id="assets_backend" inherit_id="web.assets_backend">
    <link rel="stylesheet" href="/client_portal/static/src/css/portal.css"/>
</template>
```

---

## ✅ Avantages de l'Intégration Website

1. **CSS Frontend Complet** - Styling personnalisé sur toutes les pages portail
2. **Module Website Inclus** - Accès à toutes les fonctionnalités website d'Odoo
3. **Pages Web Publiques** - Possibilité de créer des landing pages
4. **Meilleure UX** - Interface plus cohérente et moderne
5. **Évolutivité** - Base solide pour futures fonctionnalités web

---

## ⚠️ Notes Importantes

### Taille du Module Website

Le module `website` d'Odoo est **assez volumineux** (beaucoup de fichiers et fonctionnalités).

**Impact:**
- Installation: +2-3 minutes
- Espace disque: +50-100 MB
- Mémoire: +50-100 MB au runtime

**Bénéfice:**
- Portail client avec design complet
- Possibilité de créer des pages web publiques
- Éditeur de contenu intégré

### Si Vous ne Voulez PAS Website

Si vous préférez rester **léger** sans website, l'installation actuelle fonctionne très bien:
- ✅ Toutes les fonctionnalités métier fonctionnent
- ✅ Backend avec CSS custom
- ⚠️ Seulement sans CSS frontend (impact visuel mineur)

**Pour garder la version légère:**
- Ne faites rien, l'installation actuelle est parfaite
- client_portal fonctionne à 99% sans 'website'

---

## 🆘 En Cas de Problème

### Erreur "Module website not found"

```bash
# Mettre à jour la liste des modules Odoo
docker compose exec odoo odoo-bin -d iseb_db -u base --stop-after-init
docker compose restart odoo
```

### Erreur "website.assets_frontend not found"

```bash
# Vérifier que website est bien installé
# Via l'interface Odoo:
http://localhost:8069/web#action=base.open_module_tree
# Chercher "website" - doit être "Installed"
```

### client_portal ne se met pas à jour

```bash
# Forcer la mise à jour
docker compose exec odoo odoo-bin -d iseb_db -u client_portal --stop-after-init
docker compose restart odoo
```

---

## 📞 Support

Si vous rencontrez des problèmes, vérifiez:
1. Module website installé: `http://localhost:8069/web#action=base.open_module_tree`
2. client_portal à jour: version devrait être 17.0.1.0.0
3. Logs Odoo: `docker compose logs odoo | tail -100`

---

**Créé:** 2025-11-08
**Version:** ISEB Platform avec intégration website
**Modules concernés:** client_portal, website
