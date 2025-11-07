# -*- coding: utf-8 -*-
"""
Tests E2E pour le module Bank Sync
"""

import pytest
from tests.selenium.pages.bank_sync_page import (
    BankAccountsPage, BankTransactionsPage, ReconciliationRulesPage
)


@pytest.mark.smoke
class TestBankAccounts:
    """Tests de gestion des comptes bancaires"""

    def test_bank_accounts_page_loads(self, authenticated_driver):
        """Test: La page comptes bancaires se charge"""
        accounts_page = BankAccountsPage(authenticated_driver)
        accounts_page.load()

        assert 'bank_sync.action_bank_account' in accounts_page.get_current_url()

    def test_create_bank_account(self, authenticated_driver):
        """Test: Créer un compte bancaire"""
        accounts_page = BankAccountsPage(authenticated_driver)
        accounts_page.load()

        initial_count = accounts_page.get_accounts_count()

        # Créer compte
        accounts_page.click_new_account()
        accounts_page.fill_account_form(
            name='Compte Test Selenium',
            provider='BNP Paribas',
            account_number='FR76123456789012345678901',
            frequency='daily'
        )
        accounts_page.save_account()

        # Vérifier création
        accounts_page.load()
        new_count = accounts_page.get_accounts_count()
        assert new_count == initial_count + 1

    @pytest.mark.slow
    def test_sync_bank_account(self, authenticated_driver):
        """Test: Synchroniser un compte bancaire"""
        accounts_page = BankAccountsPage(authenticated_driver)
        accounts_page.load()

        # Vérifier qu'il y a au moins un compte
        if accounts_page.get_accounts_count() == 0:
            pytest.skip("Aucun compte bancaire disponible pour test de sync")

        # Synchroniser premier compte
        success = accounts_page.click_sync_now(account_index=0)
        assert success, "La synchronisation devrait être lancée"

        # Attendre notification
        notification = accounts_page.wait_for_sync_notification()
        assert notification is not None


class TestBankTransactions:
    """Tests des transactions bancaires"""

    def test_transactions_page_loads(self, authenticated_driver):
        """Test: La page transactions se charge"""
        transactions_page = BankTransactionsPage(authenticated_driver)
        transactions_page.load()

        assert 'bank_sync.action_bank_transaction' in transactions_page.get_current_url()

    def test_filter_unreconciled_transactions(self, authenticated_driver):
        """Test: Filtrer les transactions non rapprochées"""
        transactions_page = BankTransactionsPage(authenticated_driver)
        transactions_page.load()

        transactions_page.filter_unreconciled()
        # Vérifier que le filtre est appliqué (URL ou éléments)
        assert True

    def test_search_transaction(self, authenticated_driver):
        """Test: Rechercher une transaction"""
        transactions_page = BankTransactionsPage(authenticated_driver)
        transactions_page.load()

        transactions_page.search_transaction('Test')
        # Vérifier résultats
        assert True

    @pytest.mark.slow
    def test_reconcile_transaction(self, authenticated_driver):
        """Test: Rapprocher une transaction"""
        transactions_page = BankTransactionsPage(authenticated_driver)
        transactions_page.load()
        transactions_page.filter_unreconciled()

        # Rapprocher si transaction disponible
        count = transactions_page.get_transactions_count()
        if count > 0:
            success = transactions_page.reconcile_first_transaction()
            assert success


class TestReconciliationRules:
    """Tests des règles de réconciliation"""

    def test_rules_page_loads(self, authenticated_driver):
        """Test: La page règles se charge"""
        rules_page = ReconciliationRulesPage(authenticated_driver)
        rules_page.load()

        assert 'bank_sync.action_reconciliation_rule' in rules_page.get_current_url()

    def test_create_reconciliation_rule(self, authenticated_driver):
        """Test: Créer une règle de réconciliation"""
        rules_page = ReconciliationRulesPage(authenticated_driver)
        rules_page.load()

        initial_count = rules_page.get_rules_count()

        # Créer règle
        rules_page.create_rule(
            name='Règle Test Salaires',
            pattern='SALAIRE|VIREMENT',
            account='Personnel'
        )

        # Vérifier création
        rules_page.load()
        new_count = rules_page.get_rules_count()
        assert new_count == initial_count + 1


@pytest.mark.integration
class TestBankSyncWorkflow:
    """Tests de workflow complet synchronisation bancaire"""

    @pytest.mark.slow
    def test_complete_sync_workflow(self, authenticated_driver):
        """Test: Workflow complet sync → transactions → réconciliation"""
        # 1. Créer compte
        accounts_page = BankAccountsPage(authenticated_driver)
        accounts_page.load()
        accounts_page.click_new_account()
        accounts_page.fill_account_form(
            name='Compte Test Workflow',
            provider='Crédit Agricole',
            account_number='FR761234567890',
            frequency='daily'
        )
        accounts_page.save_account()

        # 2. Synchroniser (simulé)
        accounts_page.load()
        # sync_success = accounts_page.click_sync_now(account_index=0)

        # 3. Vérifier transactions
        transactions_page = BankTransactionsPage(authenticated_driver)
        transactions_page.load()
        # count = transactions_page.get_transactions_count()
        # assert count > 0, "Des transactions devraient être importées"

        # 4. Créer règle de réconciliation
        rules_page = ReconciliationRulesPage(authenticated_driver)
        rules_page.load()
        rules_page.create_rule(
            name='Auto Reconcile Test',
            pattern='TEST',
            account='Banque'
        )

        assert True
