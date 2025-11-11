#!/usr/bin/env python3
"""
Load demo data into ISEB modules
"""

import xmlrpc.client
import sys

ODOO_URL = 'http://localhost:8069'
DB_NAME = 'iseb_prod'
USERNAME = '__system__'
PASSWORD = 'admin'  # Will use uid=1 which bypasses all ACL

def main():
    print("=" * 70)
    print("  LOADING ISEB DEMO DATA")
    print("=" * 70)
    print()

    try:
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
        uid = common.authenticate(DB_NAME, USERNAME, PASSWORD, {})

        if not uid:
            print("✗ Authentication failed")
            return False

        print(f"✓ Connected to Odoo (User ID: {uid})")
        print()

        # Create demo partners
        print("Creating demo partners...")
        partners = [
            {
                'name': 'Sophie Martin',
                'email': 'sophie.martin@exemple.fr',
                'phone': '+33 6 12 34 56 78',
                'is_iseb_client': True,
                'company_type': 'company',
                'street': '15 Avenue des Entrepreneurs',
                'city': 'Paris',
                'zip': '75008',
            },
            {
                'name': 'Thomas Dubois',
                'email': 'thomas.dubois@exemple.fr',
                'phone': '+33 6 98 76 54 32',
                'is_iseb_client': True,
                'company_type': 'company',
                'street': '42 Rue du Commerce',
                'city': 'Lyon',
                'zip': '69002',
            },
            {
                'name': 'Marie Lefevre',
                'email': 'marie.lefevre@exemple.fr',
                'phone': '+33 6 45 67 89 01',
                'is_iseb_client': True,
                'company_type': 'company',
                'street': '8 Boulevard Haussmann',
                'city': 'Paris',
                'zip': '75009',
            },
            {
                'name': 'Alexandre Bernard',
                'email': 'alex.bernard@exemple.fr',
                'phone': '+33 6 23 45 67 89',
                'is_iseb_client': True,
                'company_type': 'company',
                'street': '12 Rue de la République',
                'city': 'Marseille',
                'zip': '13001',
            },
        ]

        partner_ids = []
        for partner_data in partners:
            existing = models.execute_kw(DB_NAME, uid, PASSWORD, 'res.partner', 'search',
                                        [[('email', '=', partner_data['email'])]])
            if existing:
                partner_ids.append(existing[0])
                print(f"  ✓ Partner exists: {partner_data['name']}")
            else:
                partner_id = models.execute_kw(DB_NAME, uid, PASSWORD, 'res.partner', 'create', [partner_data])
                partner_ids.append(partner_id)
                print(f"  ✓ Created partner: {partner_data['name']} (ID: {partner_id})")

        # Create client dashboards
        print("\nCreating client dashboards...")
        dashboards = [
            {
                'partner_id': partner_ids[0],
                'period_start': '2025-01-01',
                'period_end': '2025-01-31',
                'cash_balance': 45230.50,
                'revenue_mtd': 12500.00,
                'revenue_ytd': 125000.00,
                'expenses_mtd': 8300.00,
                'expenses_ytd': 78000.00,
                'margin_rate': 37.6,
                'tva_due': 2450.00,
            },
            {
                'partner_id': partner_ids[1],
                'period_start': '2025-01-01',
                'period_end': '2025-01-31',
                'cash_balance': 28500.75,
                'revenue_mtd': 8200.00,
                'revenue_ytd': 89000.00,
                'expenses_mtd': 5100.00,
                'expenses_ytd': 52000.00,
                'margin_rate': 41.6,
                'tva_due': 1640.00,
            },
            {
                'partner_id': partner_ids[2],
                'period_start': '2025-01-01',
                'period_end': '2025-01-31',
                'cash_balance': 62100.25,
                'revenue_mtd': 18900.00,
                'revenue_ytd': 189000.00,
                'expenses_mtd': 12400.00,
                'expenses_ytd': 124000.00,
                'margin_rate': 34.4,
                'tva_due': 3780.00,
            },
        ]

        for dashboard_data in dashboards:
            dashboard_id = models.execute_kw(DB_NAME, uid, PASSWORD, 'client.dashboard', 'create', [dashboard_data])
            print(f"  ✓ Created dashboard for partner {dashboard_data['partner_id']} (ID: {dashboard_id})")

        # Create documents
        print("\nCreating documents...")
        documents = [
            {
                'name': 'Facture Achat Matériel Informatique',
                'partner_id': partner_ids[0],
                'document_type': 'invoice',
                'state': 'validated',
                'upload_date': '2025-01-10',
            },
            {
                'name': 'Justificatif Déplacement Client',
                'partner_id': partner_ids[0],
                'document_type': 'justificatif',
                'state': 'pending',
                'upload_date': '2025-01-20',
            },
            {
                'name': 'Contrat Prestation Services',
                'partner_id': partner_ids[2],
                'document_type': 'contract',
                'state': 'validated',
                'upload_date': '2025-01-05',
            },
            {
                'name': 'Facture Client - Projet Web',
                'partner_id': partner_ids[0],
                'document_type': 'invoice',
                'state': 'validated',
                'upload_date': '2025-01-15',
            },
            {
                'name': 'Relevé Bancaire - Janvier 2025',
                'partner_id': partner_ids[1],
                'document_type': 'other',
                'state': 'validated',
                'upload_date': '2025-01-31',
            },
        ]

        for doc_data in documents:
            doc_id = models.execute_kw(DB_NAME, uid, PASSWORD, 'client.document', 'create', [doc_data])
            print(f"  ✓ Created document: {doc_data['name']} (ID: {doc_id})")

        # Create expense notes
        print("\nCreating expense notes...")
        expenses = [
            {
                'name': 'Restaurant Client - Déjeuner d\'affaires',
                'partner_id': partner_ids[0],
                'expense_date': '2025-01-18',
                'category': 'meal',
                'amount': 85.50,
                'tva_amount': 8.55,
                'state': 'approved',
                'notes': 'Déjeuner avec prospect - Projet digital',
            },
            {
                'name': 'Essence - Déplacement Lyon-Paris',
                'partner_id': partner_ids[1],
                'expense_date': '2025-01-22',
                'category': 'transport',
                'amount': 120.00,
                'tva_amount': 24.00,
                'state': 'submitted',
                'notes': 'Déplacement professionnel rendez-vous client',
            },
            {
                'name': 'Abonnement SaaS - Outils Marketing',
                'partner_id': partner_ids[2],
                'expense_date': '2025-01-05',
                'category': 'other',
                'amount': 149.00,
                'tva_amount': 29.80,
                'state': 'approved',
                'notes': 'Abonnement mensuel HubSpot',
            },
            {
                'name': 'Fournitures Bureau',
                'partner_id': partner_ids[0],
                'expense_date': '2025-01-12',
                'category': 'office',
                'amount': 67.50,
                'tva_amount': 13.50,
                'state': 'approved',
                'notes': 'Papeterie et consommables',
            },
            {
                'name': 'Parking Aéroport CDG',
                'partner_id': partner_ids[3],
                'expense_date': '2025-01-20',
                'category': 'transport',
                'amount': 45.00,
                'tva_amount': 9.00,
                'state': 'pending',
                'notes': 'Déplacement professionnel Bruxelles',
            },
            {
                'name': 'Hôtel Business - Nuit Lyon',
                'partner_id': partner_ids[1],
                'expense_date': '2025-01-25',
                'category': 'accommodation',
                'amount': 135.00,
                'tva_amount': 13.50,
                'state': 'submitted',
                'notes': 'Séminaire client 2 jours',
            },
        ]

        for expense_data in expenses:
            expense_id = models.execute_kw(DB_NAME, uid, PASSWORD, 'expense.note', 'create', [expense_data])
            print(f"  ✓ Created expense: {expense_data['name']} (ID: {expense_id})")

        # Create cabinet tasks
        print("\nCreating cabinet tasks...")
        tasks = [
            {
                'name': 'Validation TVA T4 2024',
                'partner_id': partner_ids[0],
                'task_type': 'tax_declaration',
                'priority': 'high',
                'deadline': '2025-02-10',
                'state': 'in_progress',
                'notes': 'Préparer et valider la déclaration de TVA du 4ème trimestre',
            },
            {
                'name': 'Rapprochement bancaire Décembre',
                'partner_id': partner_ids[1],
                'task_type': 'bank_reconciliation',
                'priority': 'medium',
                'deadline': '2025-02-05',
                'state': 'todo',
                'notes': 'Effectuer le rapprochement bancaire du mois de décembre',
            },
            {
                'name': 'Clôture annuelle 2024',
                'partner_id': partner_ids[2],
                'task_type': 'annual_closing',
                'priority': 'high',
                'deadline': '2025-03-15',
                'state': 'todo',
                'notes': 'Préparer la clôture annuelle et les états financiers',
            },
            {
                'name': 'Révision comptable Janvier',
                'partner_id': partner_ids[0],
                'task_type': 'accounting_review',
                'priority': 'medium',
                'deadline': '2025-02-15',
                'state': 'in_progress',
                'notes': 'Réviser la saisie comptable du mois de janvier',
            },
            {
                'name': 'Consultation fiscale optimisation',
                'partner_id': partner_ids[3],
                'task_type': 'tax_consultation',
                'priority': 'low',
                'deadline': '2025-02-28',
                'state': 'todo',
                'notes': 'RDV conseil fiscal - optimisation IS',
            },
        ]

        for task_data in tasks:
            task_id = models.execute_kw(DB_NAME, uid, PASSWORD, 'cabinet.task', 'create', [task_data])
            print(f"  ✓ Created task: {task_data['name']} (ID: {task_id})")

        print()
        print("=" * 70)
        print("  ✓ DEMO DATA LOADED SUCCESSFULLY")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
