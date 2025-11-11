#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de vérification des prérequis pour le module Import/Export ISEB

Usage:
    python3 check_dependencies.py

Vérifie :
- Modules Odoo installés (base, account, account_import_export)
- Configuration de la société (SIREN)
- Plan comptable présent
- Journaux configurés
- Droits utilisateurs
"""

import sys
import os

try:
    import xmlrpc.client
except ImportError:
    print("❌ Module xmlrpc.client non disponible")
    sys.exit(1)


class DependencyChecker:
    """Vérificateur de dépendances pour ISEB Import/Export"""

    def __init__(self, url='http://localhost:8069', db='iseb_db', username='admin', password='admin'):
        self.url = url
        self.db = db
        self.username = username
        self.password = password
        self.uid = None
        self.models = None
        self.common = None

        print("=" * 70)
        print("🔍 Vérification des prérequis ISEB - Import/Export Comptable")
        print("=" * 70)
        print()

    def connect(self):
        """Connexion à Odoo"""
        print("📡 Connexion à Odoo...")
        try:
            # Connexion au serveur
            self.common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            version = self.common.version()
            print(f"   ✓ Odoo {version['server_version']} détecté")

            # Authentification
            self.uid = self.common.authenticate(self.db, self.username, self.password, {})
            if not self.uid:
                print(f"   ❌ Échec de l'authentification (user: {self.username})")
                return False

            print(f"   ✓ Authentifié en tant que '{self.username}' (UID: {self.uid})")

            # Accès aux modèles
            self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
            print()
            return True

        except Exception as e:
            print(f"   ❌ Erreur de connexion: {e}")
            print()
            print("💡 Vérifier que :")
            print("   - Odoo est démarré (docker-compose up)")
            print("   - L'URL est correcte (http://localhost:8069)")
            print("   - La base de données existe")
            print("   - Les identifiants sont corrects")
            return False

    def check_module_installed(self, module_name):
        """Vérifie si un module est installé"""
        try:
            modules = self.models.execute_kw(
                self.db, self.uid, self.password,
                'ir.module.module', 'search_read',
                [[('name', '=', module_name)]],
                {'fields': ['name', 'state']}
            )

            if not modules:
                return False, "non trouvé"

            state = modules[0]['state']
            return state == 'installed', state

        except Exception as e:
            return False, f"erreur: {e}"

    def check_modules(self):
        """Vérifie les modules requis"""
        print("📦 Vérification des modules Odoo...")

        required_modules = [
            ('base', 'Base (Core)', True),
            ('account', 'Comptabilité', True),
            ('account_import_export', 'ISEB Import/Export', True),
        ]

        optional_modules = [
            ('account_accountant', 'Comptabilité avancée', False),
            ('account_invoicing', 'Facturation', False),
        ]

        all_ok = True

        # Modules obligatoires
        for module, description, required in required_modules:
            installed, state = self.check_module_installed(module)

            if installed:
                print(f"   ✓ {description} ({module}): installé")
            else:
                if required:
                    print(f"   ❌ {description} ({module}): {state} - REQUIS")
                    all_ok = False
                else:
                    print(f"   ⚠️  {description} ({module}): {state} - optionnel")

        # Modules optionnels
        print()
        print("   Modules optionnels:")
        for module, description, required in optional_modules:
            installed, state = self.check_module_installed(module)
            if installed:
                print(f"   ✓ {description} ({module}): installé")
            else:
                print(f"   ○ {description} ({module}): non installé")

        print()
        return all_ok

    def check_company_config(self):
        """Vérifie la configuration de la société"""
        print("🏢 Vérification de la configuration société...")

        try:
            companies = self.models.execute_kw(
                self.db, self.uid, self.password,
                'res.company', 'search_read',
                [[]],
                {'fields': ['name', 'company_registry', 'vat', 'street', 'city'], 'limit': 1}
            )

            if not companies:
                print("   ❌ Aucune société configurée")
                return False

            company = companies[0]
            all_ok = True

            # Nom
            if company.get('name'):
                print(f"   ✓ Nom: {company['name']}")
            else:
                print("   ❌ Nom de société manquant")
                all_ok = False

            # SIREN
            siren = company.get('company_registry')
            if siren:
                # Nettoie le SIREN
                siren_digits = ''.join(filter(str.isdigit, siren))
                if len(siren_digits) == 9:
                    print(f"   ✓ SIREN: {siren_digits}")
                else:
                    print(f"   ⚠️  SIREN: {siren} (format invalide, devrait faire 9 chiffres)")
                    all_ok = False
            else:
                print("   ❌ SIREN manquant - REQUIS pour export FEC")
                all_ok = False

            # N° TVA
            if company.get('vat'):
                print(f"   ✓ N° TVA: {company['vat']}")
            else:
                print("   ⚠️  N° TVA intracommunautaire manquant")

            # Adresse
            if company.get('street') and company.get('city'):
                print(f"   ✓ Adresse configurée")
            else:
                print("   ⚠️  Adresse incomplète")

            print()
            return all_ok

        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            print()
            return False

    def check_chart_of_accounts(self):
        """Vérifie le plan comptable"""
        print("📊 Vérification du plan comptable...")

        try:
            # Compte le nombre de comptes
            account_count = self.models.execute_kw(
                self.db, self.uid, self.password,
                'account.account', 'search_count',
                [[]]
            )

            if account_count == 0:
                print("   ❌ Aucun compte comptable trouvé")
                print("   💡 Installer le plan comptable français : Comptabilité → Configuration → Plan Comptable")
                print()
                return False

            print(f"   ✓ {account_count} comptes comptables configurés")

            # Vérifier les classes de comptes
            classes = ['1', '4', '6', '7']
            for classe in classes:
                count = self.models.execute_kw(
                    self.db, self.uid, self.password,
                    'account.account', 'search_count',
                    [[('code', '=like', f'{classe}%')]]
                )
                if count > 0:
                    print(f"   ✓ Classe {classe}: {count} comptes")
                else:
                    print(f"   ⚠️  Classe {classe}: aucun compte")

            print()
            return True

        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            print()
            return False

    def check_journals(self):
        """Vérifie les journaux comptables"""
        print("📝 Vérification des journaux...")

        try:
            journals = self.models.execute_kw(
                self.db, self.uid, self.password,
                'account.journal', 'search_read',
                [[]],
                {'fields': ['name', 'code', 'type']}
            )

            if not journals:
                print("   ❌ Aucun journal configuré")
                print("   💡 Créer des journaux : Comptabilité → Configuration → Journaux")
                print()
                return False

            print(f"   ✓ {len(journals)} journaux configurés:")

            # Journaux recommandés
            recommended_codes = {
                'sale': 'Ventes',
                'purchase': 'Achats',
                'bank': 'Banque',
                'general': 'Opérations diverses'
            }

            for journal in journals[:5]:  # Affiche les 5 premiers
                print(f"      - {journal['code']}: {journal['name']} ({journal['type']})")

            if len(journals) > 5:
                print(f"      ... et {len(journals) - 5} autres")

            print()
            return True

        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            print()
            return False

    def check_user_rights(self):
        """Vérifie les droits utilisateurs"""
        print("👤 Vérification des droits utilisateurs...")

        try:
            # Récupère l'utilisateur actuel
            user = self.models.execute_kw(
                self.db, self.uid, self.password,
                'res.users', 'read',
                [[self.uid]],
                {'fields': ['name', 'groups_id']}
            )[0]

            # Récupère les groupes
            groups = self.models.execute_kw(
                self.db, self.uid, self.password,
                'res.groups', 'read',
                [user['groups_id']],
                {'fields': ['name', 'category_id']}
            )

            # Cherche les groupes comptables
            accounting_groups = [g for g in groups if 'account' in g['name'].lower() or 'compta' in g['name'].lower()]

            if accounting_groups:
                print(f"   ✓ Utilisateur '{user['name']}' a {len(accounting_groups)} groupe(s) comptable(s)")
                for group in accounting_groups[:3]:
                    print(f"      - {group['name']}")
            else:
                print(f"   ⚠️  Utilisateur '{user['name']}' n'a pas de droits comptables")
                print("   💡 Ajouter le groupe : Paramètres → Utilisateurs → Groupes d'accès → Comptabilité")

            print()
            return len(accounting_groups) > 0

        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            print()
            return False

    def run_all_checks(self):
        """Exécute toutes les vérifications"""
        if not self.connect():
            return False

        results = {
            'modules': self.check_modules(),
            'company': self.check_company_config(),
            'accounts': self.check_chart_of_accounts(),
            'journals': self.check_journals(),
            'rights': self.check_user_rights(),
        }

        # Résumé
        print("=" * 70)
        print("📋 RÉSUMÉ")
        print("=" * 70)

        all_passed = all(results.values())

        if all_passed:
            print("✅ Tous les prérequis sont satisfaits!")
            print()
            print("🎉 Vous pouvez utiliser le module Import/Export:")
            print("   - Web: http://localhost:3000/settings → Import/Export")
            print("   - Odoo: Comptabilité → Configuration → Import / Export")
        else:
            print("❌ Certains prérequis ne sont pas satisfaits:")
            print()
            for check, passed in results.items():
                status = "✓" if passed else "✗"
                print(f"   {status} {check}")
            print()
            print("💡 Consultez INSTALLATION_IMPORT_EXPORT.md pour plus d'informations")

        print("=" * 70)
        print()

        return all_passed


def main():
    """Point d'entrée principal"""
    # Configuration (peut être passée en arguments)
    checker = DependencyChecker(
        url=os.getenv('ODOO_URL', 'http://localhost:8069'),
        db=os.getenv('ODOO_DB', 'iseb_db'),
        username=os.getenv('ODOO_USER', 'admin'),
        password=os.getenv('ODOO_PASSWORD', 'admin'),
    )

    success = checker.run_all_checks()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
