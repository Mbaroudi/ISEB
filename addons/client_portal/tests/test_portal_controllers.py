# -*- coding: utf-8 -*-

import base64
from odoo.tests import HttpCase, tagged
from datetime import date


@tagged('post_install', '-at_install')
class TestPortalControllers(HttpCase):
    """Tests pour les controllers du portail client"""

    def setUp(self):
        super().setUp()
        
        # Créer un utilisateur client avec accès portail
        self.portal_user = self.env['res.users'].create({
            'name': 'Portal Test User',
            'login': 'portal_test',
            'password': 'portal_test',
            'email': 'portal@test.com',
            'groups_id': [(6, 0, [self.env.ref('base.group_portal').id])],
        })
        
        # Rendre le partner client ISEB
        self.portal_user.partner_id.is_iseb_client = True
        
        # Créer un dashboard
        self.dashboard = self.env['client.dashboard'].create({
            'partner_id': self.portal_user.partner_id.id,
            'period_start': date.today().replace(day=1),
            'period_end': date.today(),
            'cash_balance': 10000.00,
            'revenue_mtd': 15000.00,
        })
        
        # Créer quelques documents
        self.document1 = self.env['client.document'].create({
            'name': 'Test Doc 1',
            'partner_id': self.portal_user.partner_id.id,
            'document_type': 'invoice',
            'document_date': date.today(),
        })
        
        self.document2 = self.env['client.document'].create({
            'name': 'Test Doc 2',
            'partner_id': self.portal_user.partner_id.id,
            'document_type': 'contract',
            'document_date': date.today(),
            'state': 'pending',
        })
        
        # Créer quelques notes de frais
        self.expense1 = self.env['expense.note'].create({
            'name': 'Test Expense 1',
            'partner_id': self.portal_user.partner_id.id,
            'category': 'meal',
            'expense_date': date.today(),
            'amount': 85.50,
            'tva_amount': 8.55,
        })
        
        self.expense2 = self.env['expense.note'].create({
            'name': 'Test Expense 2',
            'partner_id': self.portal_user.partner_id.id,
            'category': 'transport',
            'expense_date': date.today(),
            'amount': 45.00,
            'tva_amount': 9.00,
            'state': 'submitted',
        })

    def test_dashboard_access(self):
        """Test accès à la page dashboard"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open('/my/dashboard')
        self.assertEqual(response.status_code, 200)
        
        # Vérifier que le dashboard est affiché
        self.assertIn(b'Tableau de Bord', response.content)

    def test_documents_list_access(self):
        """Test accès à la liste des documents"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open('/my/documents')
        self.assertEqual(response.status_code, 200)
        
        # Vérifier présence des documents
        self.assertIn(b'Test Doc 1', response.content)
        self.assertIn(b'Test Doc 2', response.content)

    def test_document_detail_access(self):
        """Test accès au détail d'un document"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open(f'/my/document/{self.document1.id}')
        self.assertEqual(response.status_code, 200)
        
        # Vérifier le contenu
        self.assertIn(b'Test Doc 1', response.content)

    def test_expenses_list_access(self):
        """Test accès à la liste des notes de frais"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open('/my/expenses')
        self.assertEqual(response.status_code, 200)
        
        # Vérifier présence des expenses
        self.assertIn(b'Test Expense 1', response.content)
        self.assertIn(b'Test Expense 2', response.content)

    def test_expense_detail_access(self):
        """Test accès au détail d'une note de frais"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open(f'/my/expense/{self.expense1.id}')
        self.assertEqual(response.status_code, 200)
        
        # Vérifier le contenu
        self.assertIn(b'Test Expense 1', response.content)

    def test_documents_pagination(self):
        """Test pagination des documents"""
        # Créer 15 documents pour tester la pagination (limite 10/page)
        for i in range(15):
            self.env['client.document'].create({
                'name': f'Doc {i}',
                'partner_id': self.portal_user.partner_id.id,
                'document_type': 'invoice',
                'document_date': date.today(),
            })
        
        self.authenticate('portal_test', 'portal_test')
        
        # Page 1
        response = self.url_open('/my/documents?page=1')
        self.assertEqual(response.status_code, 200)
        
        # Page 2 devrait exister
        response = self.url_open('/my/documents?page=2')
        self.assertEqual(response.status_code, 200)

    def test_documents_filter_by_state(self):
        """Test filtrage des documents par état"""
        self.authenticate('portal_test', 'portal_test')
        
        # Filtre draft
        response = self.url_open('/my/documents?filterby=draft')
        self.assertEqual(response.status_code, 200)
        
        # Filtre pending
        response = self.url_open('/my/documents?filterby=pending')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Test Doc 2', response.content)

    def test_documents_sort(self):
        """Test tri des documents"""
        self.authenticate('portal_test', 'portal_test')
        
        # Tri par date
        response = self.url_open('/my/documents?sortby=date')
        self.assertEqual(response.status_code, 200)
        
        # Tri par nom
        response = self.url_open('/my/documents?sortby=name')
        self.assertEqual(response.status_code, 200)

    def test_documents_search(self):
        """Test recherche dans les documents"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open('/my/documents?search=Test')
        self.assertEqual(response.status_code, 200)

    def test_expenses_filter_by_state(self):
        """Test filtrage des notes de frais par état"""
        self.authenticate('portal_test', 'portal_test')
        
        # Filtre draft
        response = self.url_open('/my/expenses?filterby=draft')
        self.assertEqual(response.status_code, 200)
        
        # Filtre submitted
        response = self.url_open('/my/expenses?filterby=submitted')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Test Expense 2', response.content)

    def test_document_download(self):
        """Test téléchargement d'un document"""
        # Ajouter un fichier au document
        file_content = b'Test PDF content'
        file_data = base64.b64encode(file_content)
        
        self.document1.write({
            'file_data': file_data,
            'file_name': 'test.pdf',
            'mime_type': 'application/pdf',
        })
        
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open(f'/my/document/{self.document1.id}/download')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get('Content-Type'), 'application/pdf')

    def test_access_denied_wrong_partner(self):
        """Test refus d'accès à un document d'un autre client"""
        # Créer un autre client
        other_partner = self.env['res.partner'].create({
            'name': 'Other Client',
            'is_iseb_client': True,
        })
        
        # Document appartenant à l'autre client
        other_doc = self.env['client.document'].create({
            'name': 'Other Doc',
            'partner_id': other_partner.id,
            'document_type': 'invoice',
            'document_date': date.today(),
        })
        
        self.authenticate('portal_test', 'portal_test')
        
        # Tenter d'accéder au document de l'autre client
        response = self.url_open(f'/my/document/{other_doc.id}')
        
        # Devrait être redirigé (302) ou forbidden (403)
        self.assertIn(response.status_code, [302, 403])

    def test_non_iseb_client_access(self):
        """Test refus d'accès pour un non-client ISEB"""
        # Retirer le flag is_iseb_client
        self.portal_user.partner_id.is_iseb_client = False
        
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open('/my/dashboard')
        # Devrait voir la page d'erreur
        self.assertIn("Accès non autorisé".encode('utf-8'), response.content)

    def test_home_redirect_to_dashboard(self):
        """Test redirection de /my/home vers /my/dashboard pour clients ISEB"""
        self.authenticate('portal_test', 'portal_test')
        
        response = self.url_open('/my/home')
        # Devrait rediriger vers dashboard
        self.assertIn(response.status_code, [200, 302])
