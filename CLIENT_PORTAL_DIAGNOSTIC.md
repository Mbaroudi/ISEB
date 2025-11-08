# Diagnostic Approfondi: client_portal

## 🎯 Objectif

Identifier la cause exacte du blocage d'installation du module `client_portal`.

## 📊 État Actuel

- **Code**: ✅ Aucune erreur statique détectée
- **Dépendances Python**: ✅ Toutes présentes dans requirements.txt
- **Fichiers**: ✅ Tous les fichiers existent et sont valides
- **Problème**: ❌ Timeout/erreur lors de l'installation runtime

## 🔧 Outils de Diagnostic Créés

### 1. `test_client_portal_minimal.py`

Script Python qui teste l'installation avec logging détaillé.

**Fonctionnalités**:
- Connexion XML-RPC à Odoo
- Lancement de l'installation
- Surveillance en temps réel de l'état
- Timeout de 600s (10 minutes)
- Récupération des logs d'erreur si échec

### 2. `test_client_portal_installation.sh`

Script Bash qui compare deux configurations:
- **Test 1**: Installation avec manifest minimal (security + menu seulement)
- **Test 2**: Installation avec manifest complet (toutes les vues)

**Diagnostic automatique** à la fin pour identifier la catégorie de problème.

### 3. `__manifest__.py.minimal`

Version simplifiée du manifest avec:
- Dépendances minimales: `base`, `account`, `portal`
- Pas de dépendances Python externes
- Seulement `security/` et `menu_views.xml`

## 🚀 Procédure de Diagnostic

### Étape 1: Vérifier qu'Odoo est en cours d'exécution

```bash
cd ~/ISEB
docker compose ps
```

Vous devriez voir:
```
NAME          STATUS    PORTS
iseb_db       Up        5432/tcp
iseb_redis    Up        6379/tcp
iseb_odoo     Up        0.0.0.0:8069->8069/tcp
```

### Étape 2: Désinstaller client_portal si déjà partiellement installé

```bash
# Via l'interface Odoo
http://localhost:8069/web#action=base.open_module_tree

# Ou via API
python3 -c "
import xmlrpc.client
models = xmlrpc.client.ServerProxy('http://localhost:8069/xmlrpc/2/object')
common = xmlrpc.client.ServerProxy('http://localhost:8069/xmlrpc/2/common')
uid = common.authenticate('iseb_db', 'admin', 'admin', {})
module_ids = models.execute_kw('iseb_db', uid, 'admin', 'ir.module.module', 'search', [[('name', '=', 'client_portal')]])
if module_ids:
    models.execute_kw('iseb_db', uid, 'admin', 'ir.module.module', 'button_immediate_uninstall', [module_ids])
    print('Module désinstallé')
"
```

### Étape 3: Lancer le diagnostic complet

```bash
cd ~/ISEB
./test_client_portal_installation.sh
```

**Durée estimée**: 10-20 minutes (2 tests de 5-10 min chacun)

### Étape 4: Analyser les résultats

Le script affichera un diagnostic automatique:

#### Scénario A: Version minimale ✓, Version complète ✗

```
✓ TEST 1: Version minimale installée avec succès
✗ TEST 2: Version complète a échoué

DIAGNOSTIC:
→ Le problème vient des fichiers de vues ou des dépendances externes
```

**Causes possibles**:
- `portal_templates.xml` ou `portal_templates_enhanced.xml` ont des erreurs
- `assets.xml` référence des fichiers manquants
- Dépendances Python (pytesseract, PIL) causent des erreurs d'import

**Actions correctives**:
1. Simplifier `portal_templates.xml`
2. Commenter temporairement `assets.xml` dans le manifest
3. Vérifier que Tesseract OCR est installé dans le container

#### Scénario B: Version minimale ✗, Version complète ✗

```
✗ TEST 1: Version minimale a échoué
✗ TEST 2: Version complète a échoué

DIAGNOSTIC:
→ Le problème est dans les fichiers de base
```

**Causes possibles**:
- `security/security.xml` a des références de groupes invalides
- `models/*.py` ont des erreurs d'import ou de syntaxe
- Conflit avec un autre module installé

**Actions correctives**:
1. Vérifier `security/security.xml` ligne par ligne
2. Tester les imports des models Python:
   ```bash
   docker compose exec odoo python3 -c "from addons.client_portal.models import *"
   ```
3. Désinstaller `cabinet_portal` qui dépend de `client_portal`

#### Scénario C: Version minimale ✓, Version complète ✓

```
✓ TEST 1: Version minimale installée avec succès
✓ TEST 2: Version complète installée avec succès
```

**Résultat**: Le module s'installe correctement !

**Actions**:
- Vérifier que l'installation a vraiment réussi dans Odoo
- Tester les fonctionnalités du portail client

## 📝 Logs Détaillés

### Pendant le test

Le script `test_client_portal_minimal.py` affiche:

```
[15s] État: to install
[30s] État: to install
[45s] État: installing
[60s] En cours...
[75s] En cours...
[90s] État: installed

✓ Installation réussie en 90s!
```

### En cas d'erreur

Si l'installation échoue, le script récupère automatiquement les 5 derniers logs:

```
✗ Installation échouée - État final: uninstalled

Recherche des logs d'erreur...
ERROR: Field 'xxx' does not exist in model 'yyy'
WARNING: Unable to load template 'zzz'
```

## 🔍 Diagnostic Manuel Supplémentaire

### Vérifier les dépendances Python dans le container

```bash
docker compose exec odoo pip3 list | grep -E "xlsxwriter|reportlab|pytesseract|Pillow"
```

Devrait afficher:
```
Pillow                10.1.0
pytesseract           0.3.10
reportlab             4.0.7
xlsxwriter            3.1.9
```

### Vérifier Tesseract OCR

```bash
docker compose exec odoo tesseract --version
```

Devrait afficher:
```
tesseract 4.1.x
```

### Tester les imports Python

```bash
docker compose exec odoo python3 << EOF
try:
    from addons.client_portal.models.client_dashboard import ClientDashboard
    from addons.client_portal.controllers.main import ClientPortalController
    print("✓ Tous les imports fonctionnent")
except Exception as e:
    print(f"✗ Erreur d'import: {e}")
EOF
```

### Vérifier les logs Odoo en temps réel

```bash
# Dans un terminal séparé, pendant l'installation
docker compose logs -f odoo | grep -i "client_portal\|error\|traceback"
```

## 🎯 Prochaines Étapes

Selon les résultats du diagnostic:

### Si le problème est identifié

1. Appliquer la correction suggérée
2. Relancer le test
3. Vérifier que l'installation réussit

### Si le problème persiste

1. Partager les logs complets
2. Vérifier les conflits avec d'autres modules
3. Tester une installation fraîche dans une nouvelle database

### Si tout fonctionne

1. Installer `cabinet_portal` (qui dépend de `client_portal`)
2. Tester les fonctionnalités du portail
3. Documenter la solution pour référence future

## 📞 Support

Si le diagnostic ne révèle pas la cause:
- Partager les logs complets de `test_client_portal_minimal.py`
- Partager la sortie de `docker compose logs odoo`
- Vérifier la version exacte d'Odoo: `docker compose exec odoo odoo-bin --version`

---

**Créé**: 2025-11-08
**But**: Identifier et résoudre le blocage d'installation de client_portal
**Modules affectés**: client_portal, cabinet_portal (dépendant)
