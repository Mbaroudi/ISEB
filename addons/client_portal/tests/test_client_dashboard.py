# -*- coding: utf-8 -*-

from odoo.tests import TransactionCase, tagged
from odoo.exceptions import ValidationError
from datetime import date, datetime
from dateutil.relativedelta import relativedelta


@tagged('post_install', '-at_install')
class TestClientDashboard(TransactionCase):
    """Tests pour le modèle client.dashboard"""

    def setUp(self):
        super().setUp()
        
        # Créer un client de test
        self.partner = self.env['res.partner'].create({
            'name': 'Test Client ISEB',
            'is_iseb_client': True,
            'email': 'test@client.com',
        })
        
        # Créer une période de test (mois en cours)
        today = date.today()
        self.period_start = today.replace(day=1)
        self.period_end = self.period_start + relativedelta(months=1, days=-1)
        
        # Créer un dashboard
        self.dashboard = self.env['client.dashboard'].create({
            'partner_id': self.partner.id,
            'period_start': self.period_start,
            'period_end': self.period_end,
        })

    def test_create_dashboard(self):
        """Test création d'un dashboard"""
        self.assertTrue(self.dashboard.id)
        self.assertEqual(self.dashboard.partner_id, self.partner)
        self.assertEqual(self.dashboard.state, 'draft')

    def test_dashboard_name_compute(self):
        """Test calcul automatique du nom"""
        expected_name = f"Dashboard {self.partner.name} - {self.period_start.strftime('%m/%Y')}"
        self.assertEqual(self.dashboard.name, expected_name)

    def test_cash_balance_computation(self):
        """Test calcul du solde de trésorerie"""
        # Par défaut devrait être 0
        self.assertEqual(self.dashboard.cash_balance, 0.0)
        
        # Tester avec des valeurs manuelles (pour test rapide)
        self.dashboard.write({
            'cash_balance': 10000.00
        })
        self.assertEqual(self.dashboard.cash_balance, 10000.00)

    def test_revenue_computation(self):
        """Test calcul du chiffre d'affaires"""
        # Valeurs initiales
        self.assertEqual(self.dashboard.revenue_mtd, 0.0)
        self.assertEqual(self.dashboard.revenue_ytd, 0.0)

    def test_expenses_computation(self):
        """Test calcul des charges"""
        self.assertEqual(self.dashboard.expenses_mtd, 0.0)
        self.assertEqual(self.dashboard.expenses_ytd, 0.0)

    def test_net_income_computation(self):
        """Test calcul du résultat net"""
        # Net income = revenue - expenses
        self.dashboard.write({
            'revenue_mtd': 15000.00,
            'expenses_mtd': 8000.00,
        })
        # Les champs compute doivent être recalculés
        self.dashboard._compute_net_income()
        self.assertEqual(self.dashboard.net_income_mtd, 7000.00)

    def test_tva_computation(self):
        """Test calcul de la TVA"""
        self.dashboard.write({
            'tva_collectee': 3000.00,
            'tva_deductible': 1600.00,
        })
        self.dashboard._compute_tva()
        self.assertEqual(self.dashboard.tva_due, 1400.00)

    def test_margin_rate_computation(self):
        """Test calcul du taux de marge"""
        self.dashboard.write({
            'revenue_mtd': 15000.00,
            'expenses_mtd': 8000.00,
        })
        self.dashboard._compute_kpis()
        # Marge = (15000 - 8000) / 15000 * 100 = 46.67%
        self.assertAlmostEqual(self.dashboard.margin_rate, 46.67, places=2)

    def test_revenue_growth_computation(self):
        """Test calcul de la croissance du CA"""
        self.dashboard.write({
            'revenue_mtd': 15000.00,
            'revenue_last_month': 12000.00,
        })
        self.dashboard._compute_growth()
        # Croissance = (15000 - 12000) / 12000 * 100 = 25%
        self.assertAlmostEqual(self.dashboard.revenue_growth_mtd, 25.0, places=1)

    def test_dashboard_state_workflow(self):
        """Test du workflow des états"""
        # État initial
        self.assertEqual(self.dashboard.state, 'draft')
        
        # Calculer le dashboard
        self.dashboard.action_compute_dashboard()
        self.assertEqual(self.dashboard.state, 'computed')
        
        # Valider le dashboard
        self.dashboard.action_validate()
        self.assertEqual(self.dashboard.state, 'validated')
        
        # Remettre en brouillon
        self.dashboard.action_reset_draft()
        self.assertEqual(self.dashboard.state, 'draft')

    def test_multiple_dashboards_per_partner(self):
        """Test création de plusieurs dashboards pour un même client"""
        # Créer un second dashboard (période différente)
        period_start_2 = self.period_start + relativedelta(months=1)
        period_end_2 = period_start_2 + relativedelta(months=1, days=-1)
        
        dashboard2 = self.env['client.dashboard'].create({
            'partner_id': self.partner.id,
            'period_start': period_start_2,
            'period_end': period_end_2,
        })
        
        self.assertEqual(len(self.partner.dashboard_ids), 2)
        self.assertEqual(self.partner.dashboard_count, 2)

    def test_latest_dashboard_computation(self):
        """Test récupération du dernier dashboard"""
        # Créer plusieurs dashboards
        dashboard2 = self.env['client.dashboard'].create({
            'partner_id': self.partner.id,
            'period_start': self.period_start + relativedelta(months=1),
            'period_end': self.period_end + relativedelta(months=1),
        })
        
        # Le dernier devrait être dashboard2
        self.partner._compute_latest_dashboard()
        self.assertEqual(self.partner.latest_dashboard_id, dashboard2)

    def test_dashboard_action_view(self):
        """Test action d'affichage du dashboard"""
        action = self.partner.action_view_dashboard()
        
        self.assertEqual(action['type'], 'ir.actions.act_window')
        self.assertEqual(action['res_model'], 'client.dashboard')
        self.assertEqual(action['view_mode'], 'form')

    def test_receivables_and_payables(self):
        """Test des créances et dettes"""
        self.dashboard.write({
            'receivable_amount': 5000.00,
            'overdue_receivable': 1000.00,
            'payable_amount': 3000.00,
            'overdue_payable': 500.00,
        })
        
        self.assertEqual(self.dashboard.receivable_amount, 5000.00)
        self.assertEqual(self.dashboard.overdue_receivable, 1000.00)
        self.assertEqual(self.dashboard.payable_amount, 3000.00)
        self.assertEqual(self.dashboard.overdue_payable, 500.00)

    def test_dashboard_currency(self):
        """Test de la devise du dashboard"""
        # Devise par défaut devrait être celle de la société
        self.assertEqual(self.dashboard.currency_id, self.env.company.currency_id)
