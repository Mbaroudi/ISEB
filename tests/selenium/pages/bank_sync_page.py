# -*- coding: utf-8 -*-
"""
Bank Sync Page Objects
"""

from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage


class BankAccountsPage(BasePage):
    """Page de gestion des comptes bancaires"""

    # Locators
    ACCOUNTS_LIST = (By.CSS_SELECTOR, '.o_list_view .o_data_row')
    NEW_ACCOUNT_BUTTON = (By.CSS_SELECTOR, '.o_list_button_add')
    SYNC_NOW_BUTTONS = (By.CSS_SELECTOR, '.btn-sync-now')
    CONNECT_BUTTON = (By.CSS_SELECTOR, '.btn-connect-bank')
    ACCOUNT_NAME = (By.NAME, 'name')
    BANK_PROVIDER = (By.NAME, 'provider_id')
    ACCOUNT_NUMBER = (By.NAME, 'account_number')
    SYNC_FREQUENCY = (By.NAME, 'sync_frequency')
    ALERT_THRESHOLD = (By.NAME, 'alert_threshold')
    SAVE_BUTTON = (By.CSS_SELECTOR, 'button.o_form_button_save')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web#action=bank_sync.action_bank_account'

    def load(self):
        """Charger la page comptes bancaires"""
        super().load(self.path)
        self.wait_for_page_load()
        self.wait_for_odoo_loading()
        return self

    def get_accounts_count(self):
        """Compter le nombre de comptes bancaires"""
        self.wait_for_element(self.ACCOUNTS_LIST, timeout=5)
        return self.get_elements_count(self.ACCOUNTS_LIST)

    def click_new_account(self):
        """Créer un nouveau compte"""
        self.click(self.NEW_ACCOUNT_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def fill_account_form(self, name, provider, account_number, frequency='daily'):
        """Remplir le formulaire de compte bancaire"""
        self.type_text(self.ACCOUNT_NAME, name)

        # Provider (dropdown Odoo many2one)
        provider_locator = (By.XPATH, f"//input[@name='provider_id']")
        self.type_text_slowly(provider_locator, provider, delay=0.2)
        self.sleep(1)
        # Sélectionner premier résultat
        first_result = (By.CSS_SELECTOR, '.ui-menu-item:first-child')
        if self.is_element_visible(first_result, timeout=3):
            self.click(first_result)

        self.type_text(self.ACCOUNT_NUMBER, account_number)
        self.select_dropdown_by_value(self.SYNC_FREQUENCY, frequency)

        return self

    def save_account(self):
        """Enregistrer le compte"""
        self.click(self.SAVE_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def click_sync_now(self, account_index=0):
        """
        Cliquer sur "Synchroniser maintenant"
        account_index: index du compte dans la liste (0 = premier)
        """
        sync_buttons = self.get_elements(self.SYNC_NOW_BUTTONS)
        if sync_buttons and len(sync_buttons) > account_index:
            sync_buttons[account_index].click()
            self.wait_for_odoo_loading(timeout=60)  # La sync peut prendre du temps
            return True
        return False

    def wait_for_sync_notification(self):
        """Attendre la notification de fin de synchronisation"""
        return self.wait_for_notification(timeout=60)


class BankTransactionsPage(BasePage):
    """Page des transactions bancaires"""

    # Locators
    TRANSACTIONS_LIST = (By.CSS_SELECTOR, '.o_list_view .o_data_row')
    FILTER_UNRECONCILED = (By.XPATH, "//button[contains(text(), 'Non rapprochées')]")
    RECONCILE_BUTTON = (By.CLASS_NAME, 'btn-reconcile')
    TRANSACTION_AMOUNT = (By.CSS_SELECTOR, '.o_data_cell[data-field="amount"]')
    SEARCH_BOX = (By.CSS_SELECTOR, '.o_searchview_input')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web#action=bank_sync.action_bank_transaction'

    def load(self):
        """Charger la page transactions"""
        super().load(self.path)
        self.wait_for_page_load()
        self.wait_for_odoo_loading()
        return self

    def get_transactions_count(self):
        """Compter le nombre de transactions"""
        try:
            self.wait_for_element(self.TRANSACTIONS_LIST, timeout=5)
            return self.get_elements_count(self.TRANSACTIONS_LIST)
        except:
            return 0

    def filter_unreconciled(self):
        """Filtrer les transactions non rapprochées"""
        self.click(self.FILTER_UNRECONCILED)
        self.wait_for_odoo_loading()
        return self

    def search_transaction(self, search_text):
        """Rechercher une transaction"""
        self.type_text(self.SEARCH_BOX, search_text)
        self.press_key(self.SEARCH_BOX, '\n')  # Enter
        self.wait_for_odoo_loading()
        return self

    def reconcile_first_transaction(self):
        """Rapprocher la première transaction"""
        transactions = self.get_elements(self.TRANSACTIONS_LIST)
        if transactions:
            transactions[0].click()
            self.wait_for_odoo_loading()
            self.click(self.RECONCILE_BUTTON)
            self.wait_for_odoo_loading()
            return True
        return False


class ReconciliationRulesPage(BasePage):
    """Page des règles de réconciliation"""

    # Locators
    RULES_LIST = (By.CSS_SELECTOR, '.o_list_view .o_data_row')
    NEW_RULE_BUTTON = (By.CSS_SELECTOR, '.o_list_button_add')
    RULE_NAME = (By.NAME, 'name')
    PATTERN_FIELD = (By.NAME, 'pattern')
    ACCOUNT_FIELD = (By.NAME, 'account_id')
    SAVE_BUTTON = (By.CSS_SELECTOR, 'button.o_form_button_save')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web#action=bank_sync.action_reconciliation_rule'

    def load(self):
        """Charger la page règles de réconciliation"""
        super().load(self.path)
        self.wait_for_page_load()
        self.wait_for_odoo_loading()
        return self

    def get_rules_count(self):
        """Compter le nombre de règles"""
        try:
            self.wait_for_element(self.RULES_LIST, timeout=5)
            return self.get_elements_count(self.RULES_LIST)
        except:
            return 0

    def create_rule(self, name, pattern, account):
        """Créer une nouvelle règle de réconciliation"""
        self.click(self.NEW_RULE_BUTTON)
        self.wait_for_odoo_loading()

        self.type_text(self.RULE_NAME, name)
        self.type_text(self.PATTERN_FIELD, pattern)

        # Account (dropdown Odoo)
        account_locator = (By.XPATH, f"//input[@name='account_id']")
        self.type_text_slowly(account_locator, account, delay=0.2)
        self.sleep(1)
        first_result = (By.CSS_SELECTOR, '.ui-menu-item:first-child')
        if self.is_element_visible(first_result, timeout=3):
            self.click(first_result)

        self.click(self.SAVE_BUTTON)
        self.wait_for_odoo_loading()
        return self
