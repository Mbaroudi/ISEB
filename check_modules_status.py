#!/usr/bin/env python3
"""
Script de vérification des modules ISEB installés dans Odoo
Affiche l'état de chaque module et les menus créés
"""

import xmlrpc.client
import sys

ODOO_URL = 'http://localhost:8069'
DB_NAME = 'iseb_prod'
USERNAME = 'admin'
PASSWORD = 'admin'

def check_modules():
    """Vérifier l'état des modules ISEB"""

    print("=" * 70)
    print("  VÉRIFICATION DES MODULES ISEB")
    print("=" * 70)
    print()

    try:
        # Connexion
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
        uid = common.authenticate(DB_NAME, USERNAME, PASSWORD, {})

        if not uid:
            print("✗ Authentification échouée")
            return False

        print(f"✓ Connecté à Odoo (Database: {DB_NAME})")
        print()

        # Liste des modules à vérifier (tous les 11 modules)
        modules_to_check = [
            'french_accounting',
            'website',
            'web_cors',
            'client_portal',
            'cabinet_portal',
            'invoice_ocr_config',
            'accounting_collaboration',
            'account_import_export',
            'bank_sync',
            'e_invoicing',
            'reporting',
            'integrations'
        ]

        installed_count = 0
        not_installed_count = 0

        print("ÉTAT DES MODULES:")
        print("-" * 70)

        for module_name in modules_to_check:
            # Chercher le module
            module_ids = models.execute_kw(
                DB_NAME, uid, PASSWORD,
                'ir.module.module', 'search',
                [[('name', '=', module_name)]]
            )

            if module_ids:
                module_data = models.execute_kw(
                    DB_NAME, uid, PASSWORD,
                    'ir.module.module', 'read',
                    [module_ids, ['name', 'state', 'shortdesc']]
                )[0]

                state = module_data['state']
                desc = module_data['shortdesc']

                if state == 'installed':
                    print(f"✅ {module_name:20s} - INSTALLÉ - {desc}")
                    installed_count += 1
                elif state == 'to install':
                    print(f"⏳ {module_name:20s} - EN ATTENTE - {desc}")
                elif state == 'to upgrade':
                    print(f"🔄 {module_name:20s} - À METTRE À JOUR - {desc}")
                else:
                    print(f"❌ {module_name:20s} - {state.upper()} - {desc}")
                    not_installed_count += 1
            else:
                print(f"❓ {module_name:20s} - MODULE NON TROUVÉ")
                not_installed_count += 1

        print("-" * 70)
        print(f"Total: {installed_count} installés, {not_installed_count} non installés")
        print()

        # Vérifier les menus créés
        print("MENUS DISPONIBLES:")
        print("-" * 70)

        menu_ids = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.ui.menu', 'search',
            [[('parent_id', '=', False)]]  # Menus racine seulement
        )

        if menu_ids:
            menus = models.execute_kw(
                DB_NAME, uid, PASSWORD,
                'ir.ui.menu', 'read',
                [menu_ids, ['name', 'sequence']]
            )

            menus_sorted = sorted(menus, key=lambda x: x['sequence'])

            for menu in menus_sorted:
                print(f"  📁 {menu['name']}")

                # Chercher les sous-menus
                submenu_ids = models.execute_kw(
                    DB_NAME, uid, PASSWORD,
                    'ir.ui.menu', 'search',
                    [[('parent_id', '=', menu['id'])]]
                )

                if submenu_ids:
                    submenus = models.execute_kw(
                        DB_NAME, uid, PASSWORD,
                        'ir.ui.menu', 'read',
                        [submenu_ids[:5], ['name']]  # Limiter à 5 pour éviter trop d'output
                    )

                    for submenu in submenus:
                        print(f"     └─ {submenu['name']}")

                    if len(submenu_ids) > 5:
                        print(f"     └─ ... et {len(submenu_ids) - 5} autres")

        print("-" * 70)
        print()

        # Vérifier les groupes utilisateur
        print("GROUPES DE L'UTILISATEUR ADMIN:")
        print("-" * 70)

        user_ids = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'res.users', 'search',
            [[('login', '=', USERNAME)]]
        )

        if user_ids:
            user_data = models.execute_kw(
                DB_NAME, uid, PASSWORD,
                'res.users', 'read',
                [user_ids, ['groups_id']]
            )[0]

            group_ids = user_data['groups_id']

            if group_ids:
                groups = models.execute_kw(
                    DB_NAME, uid, PASSWORD,
                    'res.groups', 'read',
                    [group_ids, ['full_name']]
                )

                # Filtrer les groupes pertinents
                relevant_groups = [g for g in groups if any(keyword in g['full_name'].lower()
                                   for keyword in ['account', 'portal', 'admin', 'settings', 'iseb'])]

                for group in sorted(relevant_groups, key=lambda x: x['full_name'])[:10]:
                    print(f"  👤 {group['full_name']}")

                print(f"\nTotal: {len(group_ids)} groupes (affichant les 10 plus pertinents)")

        print("-" * 70)
        print()

        # Vérifier si les données demo sont chargées
        print("DONNÉES DE DÉMONSTRATION:")
        print("-" * 70)

        # Compter les partenaires (exemple de données demo)
        partner_count = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'res.partner', 'search_count',
            [[]]
        )

        # Compter les factures
        invoice_count = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'account.move', 'search_count',
            [[('move_type', '=', 'out_invoice')]]
        )

        print(f"  Contacts: {partner_count}")
        print(f"  Factures: {invoice_count}")

        if partner_count < 10 and invoice_count == 0:
            print("\n  ⚠️  Peu de données - Les données de démo ne sont probablement pas chargées")
            print("     Pour charger les données de démo, voir les instructions ci-dessous")

        print("-" * 70)
        print()

        return True

    except Exception as e:
        print(f"✗ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print()
    success = check_modules()

    if success:
        print()
        print("💡 CONSEILS:")
        print("-" * 70)
        print("1. Accédez à Odoo: http://localhost:8069")
        print("2. Cliquez sur les menus en haut pour explorer")
        print("3. Pour activer les données de démo:")
        print("   - Apps → Rechercher le module → Désinstaller")
        print("   - Puis réinstaller avec 'Load demonstration data' coché")
        print("4. Pour voir tous les modules:")
        print("   - Apps → Filtres → Installed")
        print("-" * 70)

    sys.exit(0 if success else 1)
