# -*- coding: utf-8 -*-
"""
Tests de performance et de charge pour ISEB Platform
Utilise Locust pour simuler des utilisateurs concurrents

Lancement:
    locust -f tests/performance/locustfile.py --host=http://localhost:8069 --users=100 --spawn-rate=10

Scénarios:
- Test de charge: 100-1000 utilisateurs simultanés
- Test de stress: Augmentation progressive jusqu'à rupture
- Test d'endurance: Charge constante sur 24h
"""

from locust import HttpUser, task, between, SequentialTaskSet
import json
import random


class ClientPortalBehavior(SequentialTaskSet):
    """Comportement d'un utilisateur du portail client"""

    def on_start(self):
        """Connexion de l'utilisateur"""
        # Login
        response = self.client.post('/web/login', {
            'login': f'user{random.randint(1, 100)}@test.com',
            'password': 'demo',
            'csrf_token': self._get_csrf_token()
        })

        if response.status_code == 200:
            self.logged_in = True
        else:
            self.logged_in = False

    def _get_csrf_token(self):
        """Récupérer le token CSRF"""
        response = self.client.get('/web/login')
        # Parser le token depuis la réponse
        return 'dummy_token'  # À implémenter

    @task(10)
    def view_dashboard(self):
        """Consulter le dashboard (tâche la plus fréquente)"""
        if not self.logged_in:
            return

        with self.client.get('/my/dashboard', catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Dashboard failed with status {response.status_code}")

    @task(5)
    def view_documents(self):
        """Consulter les documents"""
        if not self.logged_in:
            return

        self.client.get('/my/documents')

    @task(5)
    def view_expenses(self):
        """Consulter les notes de frais"""
        if not self.logged_in:
            return

        self.client.get('/my/expenses')

    @task(3)
    def create_expense(self):
        """Créer une note de frais"""
        if not self.logged_in:
            return

        expense_data = {
            'name': f'Expense {random.randint(1000, 9999)}',
            'amount': round(random.uniform(10, 500), 2),
            'expense_date': '2024-01-15',
            'category': random.choice(['meal', 'transport', 'fuel', 'accommodation'])
        }

        self.client.post('/my/expense/create', json=expense_data)

    @task(2)
    def upload_document(self):
        """Uploader un document"""
        if not self.logged_in:
            return

        # Simuler l'upload d'un petit fichier
        files = {'file': ('test.txt', b'Test document content', 'text/plain')}
        self.client.post('/my/document/upload', files=files)

    @task(1)
    def ocr_receipt(self):
        """Effectuer un OCR sur un reçu"""
        if not self.logged_in:
            return

        # Simuler une image en base64
        fake_image_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

        ocr_data = {
            'image': f'data:image/png;base64,{fake_image_base64}',
            'backend': 'auto'
        }

        with self.client.post('/my/expense/ocr', json=ocr_data, catch_response=True) as response:
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    response.success()
                else:
                    response.failure("OCR failed")
            else:
                response.failure(f"OCR request failed: {response.status_code}")

    @task(2)
    def export_pdf(self):
        """Exporter le dashboard en PDF"""
        if not self.logged_in:
            return

        self.client.get('/my/dashboard/export?format=pdf')

    @task(2)
    def export_excel(self):
        """Exporter le dashboard en Excel"""
        if not self.logged_in:
            return

        self.client.get('/my/dashboard/export?format=excel')


class BankSyncBehavior(SequentialTaskSet):
    """Comportement pour la synchronisation bancaire"""

    @task
    def list_accounts(self):
        """Lister les comptes bancaires"""
        self.client.get('/web/dataset/call_kw/bank.sync.account/search_read', json={
            'model': 'bank.sync.account',
            'method': 'search_read',
            'args': [],
            'kwargs': {}
        })

    @task
    def sync_account(self):
        """Synchroniser un compte"""
        account_id = random.randint(1, 10)

        with self.client.post(f'/web/dataset/call_button', json={
            'model': 'bank.sync.account',
            'method': 'action_sync_now',
            'args': [[account_id]],
            'kwargs': {}
        }, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure("Sync failed")

    @task
    def list_transactions(self):
        """Lister les transactions"""
        self.client.get('/web/dataset/call_kw/bank.sync.transaction/search_read', json={
            'model': 'bank.sync.transaction',
            'method': 'search_read',
            'args': [],
            'kwargs': {'limit': 100}
        })


class ReportingBehavior(SequentialTaskSet):
    """Comportement pour les rapports"""

    @task
    def list_reports(self):
        """Lister les rapports"""
        self.client.get('/web/dataset/call_kw/custom.report/search_read')

    @task
    def generate_report(self):
        """Générer un rapport"""
        report_id = random.randint(1, 5)

        with self.client.post('/web/dataset/call_button', json={
            'model': 'custom.report',
            'method': 'action_generate',
            'args': [[report_id]],
            'kwargs': {}
        }, catch_response=True) as response:
            # Timeout plus long pour génération de rapport
            if response.status_code == 200:
                response.success()
            else:
                response.failure("Report generation failed")


class EInvoicingBehavior(SequentialTaskSet):
    """Comportement pour la facturation électronique"""

    @task
    def list_invoices(self):
        """Lister les factures"""
        self.client.get('/web/dataset/call_kw/account.move/search_read', json={
            'model': 'account.move',
            'method': 'search_read',
            'args': [[['move_type', '=', 'out_invoice']]],
            'kwargs': {'limit': 50}
        })

    @task
    def send_einvoice(self):
        """Envoyer une facture électronique"""
        invoice_id = random.randint(1, 20)

        with self.client.post('/web/dataset/call_button', json={
            'model': 'account.move',
            'method': 'action_send_einvoice',
            'args': [[invoice_id]],
            'kwargs': {}
        }, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure("E-invoice sending failed")


class ISEBUser(HttpUser):
    """Utilisateur type de la plateforme ISEB"""

    # Temps d'attente entre les tâches (en secondes)
    wait_time = between(1, 5)

    # Poids des différents comportements (proportions d'utilisateurs)
    tasks = {
        ClientPortalBehavior: 10,  # 70% utilisent le portail client
        BankSyncBehavior: 2,       # 14% font de la sync bancaire
        ReportingBehavior: 1,      # 7% génèrent des rapports
        EInvoicingBehavior: 1      # 7% envoient des e-factures
    }


class APIUser(HttpUser):
    """Utilisateur API (intégrations externes)"""

    wait_time = between(0.5, 2)

    @task
    def api_get_dashboard(self):
        """API: Récupérer le dashboard"""
        self.client.get('/api/v1/dashboard', headers={
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
        })

    @task
    def api_create_invoice(self):
        """API: Créer une facture"""
        invoice_data = {
            'partner_id': random.randint(1, 100),
            'amount_total': round(random.uniform(100, 10000), 2),
            'invoice_date': '2024-01-15'
        }

        self.client.post('/api/v1/invoices', json=invoice_data, headers={
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
        })


# Configuration des scénarios de test

class LoadTestScenario:
    """
    Test de charge standard
    Commande: locust -f locustfile.py --users=500 --spawn-rate=50 --run-time=10m
    """
    pass


class StressTestScenario:
    """
    Test de stress - Augmentation progressive
    Commande: locust -f locustfile.py --users=2000 --spawn-rate=100 --run-time=30m
    """
    pass


class EnduranceTestScenario:
    """
    Test d'endurance - Charge constante prolongée
    Commande: locust -f locustfile.py --users=200 --spawn-rate=10 --run-time=24h
    """
    pass


class SpikeTestScenario:
    """
    Test de pic - Montée brutale de charge
    Commande: locust -f locustfile.py --users=1000 --spawn-rate=1000 --run-time=5m
    """
    pass


# Métriques de performance attendues (SLA)
PERFORMANCE_SLA = {
    'dashboard_load': {
        'p50': 500,  # ms
        'p95': 1500,
        'p99': 3000
    },
    'ocr_processing': {
        'p50': 2000,
        'p95': 5000,
        'p99': 10000
    },
    'report_generation': {
        'p50': 3000,
        'p95': 8000,
        'p99': 15000
    },
    'bank_sync': {
        'p50': 5000,
        'p95': 15000,
        'p99': 30000
    }
}
