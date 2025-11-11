#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create test users in Odoo for testing Settings page and different user profiles
"""

import xmlrpc.client
import sys

ODOO_URL = 'http://localhost:8069'
DB_NAME = 'iseb_prod'
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin'

# Test users to create
TEST_USERS = [
    {
        'login': 'comptable',
        'name': 'Marie Comptable',
        'email': 'marie.comptable@iseb-test.fr',
        'password': 'comptable',
        'groups': ['base.group_user', 'account.group_account_manager'],
        'phone': '+33 6 12 34 56 78',
        'company_name': 'Cabinet Comptable Martin',
        'street': '15 rue de la Paix',
        'city': 'Paris',
        'zip': '75002',
        'profile': 'Expert-comptable',
    },
    {
        'login': 'client1',
        'name': 'Jean Dupont',
        'email': 'jean.dupont@entreprise-test.fr',
        'password': 'client1',
        'groups': ['base.group_portal'],
        'phone': '+33 6 98 76 54 32',
        'company_name': 'SARL Dupont & Fils',
        'street': '42 avenue des Champs',
        'city': 'Lyon',
        'zip': '69001',
        'profile': 'Entrepreneur - TPE',
    },
    {
        'login': 'client2',
        'name': 'Sophie Martin',
        'email': 'sophie.martin@startup-test.fr',
        'password': 'client2',
        'groups': ['base.group_portal'],
        'phone': '+33 7 45 67 89 01',
        'company_name': 'StartupTech SAS',
        'street': '123 rue du Faubourg',
        'city': 'Bordeaux',
        'zip': '33000',
        'profile': 'Entrepreneur - Startup',
    },
    {
        'login': 'manager',
        'name': 'Pierre Directeur',
        'email': 'pierre.directeur@iseb-test.fr',
        'password': 'manager',
        'groups': ['base.group_user', 'account.group_account_user'],
        'phone': '+33 6 11 22 33 44',
        'company_name': 'ISEB Management',
        'street': '78 boulevard Haussmann',
        'city': 'Paris',
        'zip': '75008',
        'profile': 'Directeur Financier',
    },
    {
        'login': 'testuser',
        'name': 'Test Utilisateur',
        'email': 'test@iseb-test.fr',
        'password': 'test',
        'groups': ['base.group_user'],
        'phone': '+33 6 00 00 00 00',
        'company_name': 'Test Company',
        'street': '1 rue du Test',
        'city': 'Test City',
        'zip': '00000',
        'profile': 'Utilisateur de test',
    },
]

def create_test_users():
    """Create test users in Odoo"""
    print("=" * 70)
    print("  CRÉATION DES UTILISATEURS DE TEST ISEB")
    print("=" * 70)
    print()

    try:
        # Connect to Odoo
        print("🔌 Connexion à Odoo...")
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

        # Authenticate as admin
        uid = common.authenticate(DB_NAME, ADMIN_USERNAME, ADMIN_PASSWORD, {})

        if not uid:
            print("❌ Erreur: Impossible de se connecter avec admin/admin")
            print("   Vérifiez que Odoo est démarré et que la base 'iseb_prod' existe")
            return False

        print(f"✅ Connecté en tant qu'admin (UID: {uid})")
        print()

        created_count = 0
        updated_count = 0

        for user_data in TEST_USERS:
            login = user_data['login']
            name = user_data['name']

            print(f"👤 Traitement de l'utilisateur: {name} ({login})")

            # Check if user already exists
            existing_user_ids = models.execute_kw(
                DB_NAME, uid, ADMIN_PASSWORD,
                'res.users', 'search',
                [[('login', '=', login)]]
            )

            # Get or create partner
            partner_vals = {
                'name': name,
                'email': user_data['email'],
                'phone': user_data['phone'],
                'street': user_data['street'],
                'city': user_data['city'],
                'zip': user_data['zip'],
                'is_company': False,
                'company_type': 'person',
            }

            if existing_user_ids:
                # User exists, update it
                user_id = existing_user_ids[0]
                print(f"   ⚠️  Utilisateur existe déjà (ID: {user_id})")

                # Get partner_id
                user_info = models.execute_kw(
                    DB_NAME, uid, ADMIN_PASSWORD,
                    'res.users', 'read',
                    [user_id], {'fields': ['partner_id']}
                )[0]
                partner_id = user_info['partner_id'][0]

                # Update partner
                models.execute_kw(
                    DB_NAME, uid, ADMIN_PASSWORD,
                    'res.partner', 'write',
                    [[partner_id], partner_vals]
                )

                # Update user
                user_vals = {
                    'name': name,
                    'email': user_data['email'],
                }

                models.execute_kw(
                    DB_NAME, uid, ADMIN_PASSWORD,
                    'res.users', 'write',
                    [[user_id], user_vals]
                )

                print(f"   ✅ Utilisateur mis à jour")
                updated_count += 1
            else:
                # Create new user
                # First create partner
                partner_id = models.execute_kw(
                    DB_NAME, uid, ADMIN_PASSWORD,
                    'res.partner', 'create',
                    [partner_vals]
                )

                # Get group IDs
                group_ids = []
                for group_xml_id in user_data['groups']:
                    try:
                        group_ref = models.execute_kw(
                            DB_NAME, uid, ADMIN_PASSWORD,
                            'ir.model.data', 'search_read',
                            [[('name', '=', group_xml_id.split('.')[1]),
                              ('module', '=', group_xml_id.split('.')[0])]],
                            {'fields': ['res_id'], 'limit': 1}
                        )
                        if group_ref:
                            group_ids.append(group_ref[0]['res_id'])
                    except:
                        pass

                # Create user
                user_vals = {
                    'login': login,
                    'name': name,
                    'email': user_data['email'],
                    'password': user_data['password'],
                    'partner_id': partner_id,
                    'groups_id': [(6, 0, group_ids)] if group_ids else False,
                }

                user_id = models.execute_kw(
                    DB_NAME, uid, ADMIN_PASSWORD,
                    'res.users', 'create',
                    [user_vals]
                )

                print(f"   ✅ Utilisateur créé (ID: {user_id})")
                created_count += 1

            # Display login info
            print(f"   📧 Email: {user_data['email']}")
            print(f"   🔑 Login: {login}")
            print(f"   🔐 Password: {user_data['password']}")
            print(f"   🏢 Entreprise: {user_data['company_name']}")
            print(f"   👔 Profil: {user_data['profile']}")
            print()

        print("=" * 70)
        print("  RÉSUMÉ")
        print("=" * 70)
        print(f"✅ Utilisateurs créés: {created_count}")
        print(f"♻️  Utilisateurs mis à jour: {updated_count}")
        print(f"📊 Total: {len(TEST_USERS)}")
        print()
        print("=" * 70)
        print("  COMPTES DE TEST DISPONIBLES")
        print("=" * 70)
        print()

        for user_data in TEST_USERS:
            print(f"👤 {user_data['name']}")
            print(f"   Login: {user_data['login']}")
            print(f"   Password: {user_data['password']}")
            print(f"   Profil: {user_data['profile']}")
            print()

        print("=" * 70)
        print("  COMMENT TESTER")
        print("=" * 70)
        print()
        print("1. Allez sur http://localhost:3000/login")
        print("2. Connectez-vous avec un des comptes ci-dessus")
        print("3. Naviguez vers /settings pour voir les infos du profil")
        print()
        print("Exemples:")
        print("  - comptable / comptable  → Expert-comptable")
        print("  - client1 / client1      → Entrepreneur TPE")
        print("  - client2 / client2      → Startup")
        print("  - manager / manager      → Directeur Financier")
        print("  - testuser / test        → Utilisateur de test")
        print()

        return True

    except Exception as e:
        print()
        print("❌ Erreur lors de la création des utilisateurs:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_test_users()
    sys.exit(0 if success else 1)
