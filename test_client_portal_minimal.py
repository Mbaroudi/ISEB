#!/usr/bin/env python3
"""
Test d'installation minimale de client_portal
Identifie exactement où l'installation échoue
"""

import xmlrpc.client
import time
import sys

ODOO_URL = 'http://localhost:8069'
DB_NAME = 'iseb_prod'
USERNAME = 'admin'
PASSWORD = 'admin'

def test_installation():
    """Test l'installation étape par étape"""

    print("=" * 60)
    print("  TEST INSTALLATION CLIENT_PORTAL")
    print("=" * 60)

    try:
        # 1. Connexion
        print("\n[1/5] Connexion à Odoo...")
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        uid = common.authenticate(DB_NAME, USERNAME, PASSWORD, {})
        if not uid:
            print("✗ Authentification échouée")
            return
        print(f"✓ Connecté (UID: {uid})")

        models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

        # 2. Vérifier l'état actuel
        print("\n[2/5] Vérification de l'état du module...")
        module_ids = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'search',
            [[('name', '=', 'client_portal')]]
        )

        if module_ids:
            module_data = models.execute_kw(
                DB_NAME, uid, PASSWORD,
                'ir.module.module', 'read',
                [module_ids, ['state', 'latest_version']]
            )
            print(f"✓ Module trouvé - État: {module_data[0]['state']}")

            if module_data[0]['state'] == 'installed':
                print("\n✓ Module déjà installé !")
                return
        else:
            print("✗ Module non trouvé dans la liste")
            return

        # 3. Marquer pour installation
        print("\n[3/5] Marquage pour installation...")
        models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'button_immediate_install',
            [module_ids]
        )
        print("✓ Installation lancée...")

        # 4. Surveiller l'installation avec logging détaillé
        print("\n[4/5] Surveillance de l'installation...")
        print("(Timeout: 600 secondes)")

        waited = 0
        check_interval = 5
        max_wait = 600
        last_state = None

        while waited < max_wait:
            time.sleep(check_interval)
            waited += check_interval

            try:
                module_data = models.execute_kw(
                    DB_NAME, uid, PASSWORD,
                    'ir.module.module', 'read',
                    [module_ids, ['state']]
                )

                current_state = module_data[0]['state']

                # Afficher le changement d'état
                if current_state != last_state:
                    print(f"  [{waited}s] État: {current_state}")
                    last_state = current_state

                if current_state == 'installed':
                    print(f"\n✓ Installation réussie en {waited}s!")
                    return True

                elif current_state in ['uninstalled', 'to remove']:
                    print(f"\n✗ Installation échouée - État final: {current_state}")

                    # Chercher les logs d'erreur
                    print("\nRecherche des logs d'erreur...")
                    try:
                        log_ids = models.execute_kw(
                            DB_NAME, uid, PASSWORD,
                            'ir.logging', 'search',
                            [[('name', 'ilike', 'client_portal')]],
                            {'limit': 5, 'order': 'create_date desc'}
                        )

                        if log_ids:
                            logs = models.execute_kw(
                                DB_NAME, uid, PASSWORD,
                                'ir.logging', 'read',
                                [log_ids, ['name', 'message', 'level']]
                            )

                            for log in logs:
                                print(f"\n{log['level']}: {log['message'][:200]}")
                    except:
                        print("  (Impossible de récupérer les logs)")

                    return False

                # Afficher un point d'activité
                if waited % 15 == 0:
                    print(f"  [{waited}s] En cours...", end='\r')

            except Exception as e:
                print(f"\n  Erreur lors de la vérification: {e}")
                if "database is locked" in str(e).lower():
                    print("  Base de données verrouillée - installation en cours")
                    continue
                else:
                    raise

        print(f"\n✗ Timeout après {max_wait}s")
        print(f"  État final: {last_state}")
        return False

    except Exception as e:
        print(f"\n✗ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_installation()
    sys.exit(0 if success else 1)
