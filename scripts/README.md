# Scripts de Test ISEB Platform

## Vue d'ensemble

Ce dossier contient les scripts de test automatique pour valider l'installation et le bon fonctionnement des modules ISEB:
- **french_accounting**: Comptabilité française (FEC, TVA, Liasses)
- **client_portal**: Portail client avec dashboards
- **cabinet_portal**: Gestion multi-clients pour les cabinets

## Prérequis

1. **Docker** en cours d'exécution
2. **Odoo 17** démarré (accessible sur http://localhost:8069)
3. **Python 3.8+** installé
4. **Base de données** ISEB créée avec les modules installés

## Scripts disponibles

### 1. test_modules.py

Script Python principal qui effectue les tests suivants:

**Tests de connexion:**
- Authentification à Odoo
- Accès à l'API XML-RPC

**Tests de modules:**
- Vérification de l'installation des modules
- Existence des modèles de données
- Accès aux modèles (permissions)
- Présence des données de démonstration

**Tests french_accounting:**
- ✓ Module installé
- ✓ Modèles: fec.export, tva.declaration, liasse.fiscale
- ✓ Champs étendus: account.move (fec_export_date, fec_match_hash)
- ✓ Données démo: 2+ déclarations TVA, 1+ export FEC

**Tests client_portal:**
- ✓ Module installé
- ✓ Modèles: client.dashboard, client.document, expense.note
- ✓ Champs étendus: res.partner (is_iseb_client, dashboard_ids)
- ✓ Données démo: 3+ dashboards, 3+ documents, 5+ notes de frais

**Tests cabinet_portal:**
- ✓ Module installé
- ✓ Modèles: cabinet.task, cabinet.dashboard
- ✓ Champs étendus: res.partner (cabinet_id, accountant_id, health_score)
- ✓ Données démo: 5+ tâches, 1+ dashboard cabinet

**Usage:**
```bash
python3 scripts/test_modules.py
```

**Variables d'environnement:**
```bash
export ODOO_URL=http://localhost:8069
export ODOO_DB=iseb
export ODOO_USER=admin
export ODOO_PASSWORD=admin
```

### 2. run_tests.sh

Wrapper shell qui:
1. Vérifie que Docker est en cours d'exécution
2. Vérifie qu'Odoo est accessible
3. Configure les variables d'environnement
4. Lance test_modules.py

**Usage:**
```bash
./scripts/run_tests.sh
```

**Usage avec configuration personnalisée:**
```bash
ODOO_DB=mydb ODOO_PASSWORD=mypass ./scripts/run_tests.sh
```

## Exemples de sortie

### ✓ Tests réussis
```
========================================================
                CONNEXION À ODOO                
========================================================

ℹ URL: http://localhost:8069
ℹ Base de données: iseb
ℹ Utilisateur: admin
✓ Connecté en tant que UID: 2

========================================================
           TESTS MODULE FRENCH_ACCOUNTING            
========================================================

✓ Module 'french_accounting' installé
✓ Modèle 'fec.export' existe
✓ Accès read au modèle 'fec.export' OK (2 enreg.)
✓ Modèle 'tva.declaration' existe
✓ Accès read au modèle 'tva.declaration' OK (2 enreg.)
✓ Données de démo présentes pour 'tva.declaration' (2 enreg.)

========================================================
                  RÉSUMÉ DES TESTS                    
========================================================

✓ TOUS LES TESTS RÉUSSIS
```

### ✗ Tests avec erreurs
```
========================================================
                  RÉSUMÉ DES TESTS                    
========================================================

✗ 2 ERREUR(S)
  • Module french_accounting non installé
  • Modèle fec.export introuvable

⚠ 1 AVERTISSEMENT(S)
  • Peu de données de démo: client.dashboard
```

## Installation manuelle des modules

Si les modules ne sont pas installés:

```bash
# Via ligne de commande Odoo
docker-compose exec odoo odoo -d iseb -i french_accounting,client_portal,cabinet_portal --stop-after-init

# Via interface web
# Aller dans Apps → Rechercher "ISEB" → Installer les 3 modules
```

## Chargement des données de démonstration

Les données de démo sont chargées automatiquement si les modules sont installés avec l'option demo:

```bash
# Réinstaller avec données de démo
docker-compose exec odoo odoo -d iseb -i french_accounting,client_portal,cabinet_portal --demo=all --stop-after-init
```

## Debugging

### Erreur de connexion
```
✗ Erreur de connexion: [Errno 111] Connection refused
```
**Solution:** Vérifier qu'Odoo est démarré (`docker-compose up -d`)

### Erreur d'authentification
```
✗ Échec d'authentification
```
**Solutions:**
- Vérifier le nom de la base de données
- Vérifier les identifiants (admin/admin par défaut)
- Créer la base si elle n'existe pas

### Module non installé
```
⚠ Module 'french_accounting' non installé
```
**Solution:** Installer le module via Apps ou ligne de commande

### Peu de données de démo
```
⚠ Peu de données de démo pour 'client.dashboard' (1 enreg., attendu: 3+)
```
**Solution:** Réinstaller les modules avec `--demo=all`

## Intégration Continue (CI)

Le script peut être intégré dans un pipeline CI/CD:

**GitLab CI (.gitlab-ci.yml):**
```yaml
test:
  stage: test
  script:
    - docker-compose up -d
    - sleep 30  # Attendre le démarrage d'Odoo
    - ./scripts/run_tests.sh
```

**GitHub Actions (.github/workflows/test.yml):**
```yaml
- name: Run tests
  run: |
    docker-compose up -d
    sleep 30
    ./scripts/run_tests.sh
```

## Codes de sortie

- **0**: Tous les tests réussis
- **1**: Au moins une erreur détectée

**Exemple usage dans scripts:**
```bash
if ./scripts/run_tests.sh; then
    echo "Déploiement OK"
else
    echo "Déploiement annulé - tests en échec"
    exit 1
fi
```

## Développement

### Ajouter un nouveau test

Éditer `test_modules.py` et ajouter une méthode:

```python
def test_my_new_module(self):
    """Tests pour mon nouveau module"""
    print_header("TESTS MODULE MY_NEW_MODULE")
    
    self.test_module_installed('my_new_module')
    self.test_model_exists('my.model')
    self.test_demo_data('my.model', 5)
```

Puis l'appeler dans `run_all_tests()`:
```python
self.test_my_new_module()
```

## Support

Pour toute question ou problème:
- Email: support@iseb-accounting.fr
- Documentation: https://docs.iseb-accounting.fr
- Issues: https://github.com/iseb/platform/issues

## Licence

AGPL-3
