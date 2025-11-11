# -*- coding: utf-8 -*-

import base64
from odoo.tests import TransactionCase, tagged
from datetime import date


@tagged('post_install', '-at_install')
class TestExpenseNote(TransactionCase):
    """Tests pour le modèle expense.note"""

    def setUp(self):
        super().setUp()
        
        # Créer un client de test
        self.partner = self.env['res.partner'].create({
            'name': 'Test Client Expense',
            'is_iseb_client': True,
        })
        
        # Créer une note de frais
        self.expense = self.env['expense.note'].create({
            'name': 'Repas client - Test',
            'partner_id': self.partner.id,
            'category': 'meal',
            'expense_date': date.today(),
            'amount': 85.50,
            'tva_amount': 8.55,
        })

    def test_create_expense(self):
        """Test création d'une note de frais"""
        self.assertTrue(self.expense.id)
        self.assertEqual(self.expense.partner_id, self.partner)
        self.assertEqual(self.expense.state, 'draft')
        self.assertEqual(self.expense.category, 'meal')

    def test_total_amount_computation(self):
        """Test calcul du montant TTC"""
        self.expense._compute_total_amount()
        # Total = HT + TVA = 85.50 + 8.55 = 94.05
        self.assertAlmostEqual(self.expense.total_amount, 94.05, places=2)

    def test_expense_workflow(self):
        """Test workflow complet"""
        # État initial
        self.assertEqual(self.expense.state, 'draft')
        
        # Soumettre
        self.expense.action_submit()
        self.assertEqual(self.expense.state, 'submitted')
        self.assertIsNotNone(self.expense.submitted_date)
        
        # Approuver
        self.expense.action_approve()
        self.assertEqual(self.expense.state, 'approved')
        self.assertIsNotNone(self.expense.approved_date)
        self.assertIsNotNone(self.expense.approved_by_id)
        
        # Payer
        self.expense.action_pay()
        self.assertEqual(self.expense.state, 'paid')
        self.assertIsNotNone(self.expense.paid_date)

    def test_expense_rejection(self):
        """Test rejet d'une note de frais"""
        self.expense.action_submit()
        
        # Rejeter
        self.expense.write({'rejection_reason': 'Justificatif manquant'})
        self.expense.action_reject()
        
        self.assertEqual(self.expense.state, 'rejected')
        self.assertEqual(self.expense.rejection_reason, 'Justificatif manquant')

    def test_expense_categories(self):
        """Test toutes les catégories de dépenses"""
        categories = ['meal', 'transport', 'accommodation', 'fuel', 'parking', 'other']
        
        for cat in categories:
            exp = self.env['expense.note'].create({
                'name': f'Expense {cat}',
                'partner_id': self.partner.id,
                'category': cat,
                'expense_date': date.today(),
                'amount': 100.00,
                'tva_amount': 20.00,
            })
            self.assertEqual(exp.category, cat)

    def test_expense_with_receipt(self):
        """Test note de frais avec justificatif photo"""
        # Créer une image fictive
        img_content = b'Fake image content'
        img_data = base64.b64encode(img_content)
        
        self.expense.write({'receipt_image': img_data})
        
        self.assertTrue(self.expense.receipt_image)

    def test_expense_without_receipt(self):
        """Test note de frais sans justificatif"""
        # Ne pas ajouter de receipt_image
        self.assertFalse(self.expense.receipt_image)

    def test_expense_approved_by_tracking(self):
        """Test suivi de l'approbateur"""
        self.expense.action_submit()
        self.expense.action_approve()
        
        self.assertEqual(self.expense.approved_by_id, self.env.user)

    def test_expense_reset_draft(self):
        """Test remise en brouillon"""
        self.expense.action_submit()
        
        # Remettre en brouillon
        self.expense.action_reset_draft()
        
        self.assertEqual(self.expense.state, 'draft')
        self.assertFalse(self.expense.submitted_date)

    def test_expense_ocr_data(self):
        """Test données OCR"""
        ocr_data = {
            'amount': '85.50',
            'date': '2025-01-15',
            'vendor': 'Restaurant Test',
        }
        
        self.expense.write({
            'ocr_data': str(ocr_data),
            'ocr_confidence': 0.92,
        })
        
        self.assertTrue(self.expense.ocr_data)
        self.assertEqual(self.expense.ocr_confidence, 0.92)

    def test_multiple_expenses_per_partner(self):
        """Test plusieurs notes de frais pour un client"""
        exp2 = self.env['expense.note'].create({
            'name': 'Transport Test',
            'partner_id': self.partner.id,
            'category': 'transport',
            'expense_date': date.today(),
            'amount': 45.00,
            'tva_amount': 9.00,
        })
        
        expenses = self.env['expense.note'].search([
            ('partner_id', '=', self.partner.id)
        ])
        
        self.assertEqual(len(expenses), 2)

    def test_expense_search_by_category(self):
        """Test recherche par catégorie"""
        # Créer plusieurs catégories
        self.env['expense.note'].create({
            'name': 'Transport',
            'partner_id': self.partner.id,
            'category': 'transport',
            'expense_date': date.today(),
            'amount': 50.00,
            'tva_amount': 10.00,
        })
        
        meals = self.env['expense.note'].search([
            ('partner_id', '=', self.partner.id),
            ('category', '=', 'meal')
        ])
        
        transports = self.env['expense.note'].search([
            ('partner_id', '=', self.partner.id),
            ('category', '=', 'transport')
        ])
        
        self.assertEqual(len(meals), 1)
        self.assertEqual(len(transports), 1)

    def test_expense_search_by_state(self):
        """Test recherche par état"""
        exp2 = self.env['expense.note'].create({
            'name': 'Expense 2',
            'partner_id': self.partner.id,
            'category': 'meal',
            'expense_date': date.today(),
            'amount': 100.00,
            'tva_amount': 20.00,
        })
        exp2.action_submit()
        
        drafts = self.env['expense.note'].search([
            ('partner_id', '=', self.partner.id),
            ('state', '=', 'draft')
        ])
        
        submitted = self.env['expense.note'].search([
            ('partner_id', '=', self.partner.id),
            ('state', '=', 'submitted')
        ])
        
        self.assertEqual(len(drafts), 1)
        self.assertEqual(len(submitted), 1)

    def test_expense_total_by_category(self):
        """Test calcul total par catégorie"""
        # Créer plusieurs expenses de type meal
        self.env['expense.note'].create({
            'name': 'Meal 2',
            'partner_id': self.partner.id,
            'category': 'meal',
            'expense_date': date.today(),
            'amount': 100.00,
            'tva_amount': 20.00,
        })
        
        meals = self.env['expense.note'].search([
            ('partner_id', '=', self.partner.id),
            ('category', '=', 'meal')
        ])
        
        total_ht = sum(meals.mapped('amount'))
        total_ttc = sum(meals.mapped('total_amount'))
        
        self.assertAlmostEqual(total_ht, 185.50, places=2)  # 85.50 + 100.00
        self.assertGreater(total_ttc, total_ht)

    def test_expense_currency(self):
        """Test devise des notes de frais"""
        # Devise par défaut
        self.assertEqual(self.expense.currency_id, self.env.company.currency_id)

    def test_expense_dates_consistency(self):
        """Test cohérence des dates"""
        self.expense.action_submit()
        self.expense.action_approve()
        self.expense.action_pay()
        
        # submitted_date <= approved_date <= paid_date
        self.assertLessEqual(self.expense.submitted_date, self.expense.approved_date)
        self.assertLessEqual(self.expense.approved_date, self.expense.paid_date)
