# -*- coding: utf-8 -*-
"""
E-Invoicing Page Objects
"""

from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage


class InvoicesPage(BasePage):
    """Page de gestion des factures électroniques"""

    # Locators
    INVOICES_LIST = (By.CSS_SELECTOR, '.o_list_view .o_data_row')
    NEW_INVOICE_BUTTON = (By.CSS_SELECTOR, '.o_list_button_add')
    CUSTOMER_FIELD = (By.NAME, 'partner_id')
    INVOICE_DATE = (By.NAME, 'invoice_date')
    INVOICE_LINES_TAB = (By.XPATH, "//a[contains(text(), 'Lignes de facture')]")
    ADD_LINE_BUTTON = (By.CSS_SELECTOR, '.o_field_x2many_list_row_add a')
    PRODUCT_FIELD = (By.CSS_SELECTOR, 'input[name="product_id"]')
    QUANTITY_FIELD = (By.CSS_SELECTOR, 'input[name="quantity"]')
    UNIT_PRICE_FIELD = (By.CSS_SELECTOR, 'input[name="price_unit"]')
    SAVE_BUTTON = (By.CSS_SELECTOR, 'button.o_form_button_save')
    CONFIRM_BUTTON = (By.CSS_SELECTOR, 'button[name="action_post"]')

    # E-invoicing specific
    EINVOICE_FORMAT_FIELD = (By.NAME, 'einvoice_format_id')
    SEND_EINVOICE_BUTTON = (By.CSS_SELECTOR, 'button[name="action_send_einvoice"]')
    EINVOICE_STATUS = (By.CSS_SELECTOR, '.einvoice-status')
    DOWNLOAD_FACTURX_BUTTON = (By.CSS_SELECTOR, 'button[name="action_download_facturx"]')
    SEND_CHORUS_BUTTON = (By.CSS_SELECTOR, 'button[name="action_send_chorus_pro"]')
    SEND_PEPPOL_BUTTON = (By.CSS_SELECTOR, 'button[name="action_send_peppol"]')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web#model=account.move&view_type=list'

    def load(self):
        """Charger la page factures"""
        super().load(self.path)
        self.wait_for_page_load()
        self.wait_for_odoo_loading()
        return self

    def get_invoices_count(self):
        """Compter le nombre de factures"""
        try:
            self.wait_for_element(self.INVOICES_LIST, timeout=5)
            return self.get_elements_count(self.INVOICES_LIST)
        except:
            return 0

    def create_new_invoice(self):
        """Créer une nouvelle facture"""
        self.click(self.NEW_INVOICE_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def select_customer(self, customer_name):
        """Sélectionner un client"""
        # Odoo many2one autocomplete
        self.type_text_slowly(self.CUSTOMER_FIELD, customer_name, delay=0.2)
        self.sleep(1)

        # Sélectionner premier résultat ou créer nouveau
        first_result = (By.CSS_SELECTOR, '.ui-menu-item:first-child')
        if self.is_element_visible(first_result, timeout=3):
            self.click(first_result)
        else:
            # Créer nouveau client
            create_option = (By.XPATH, "//li[contains(text(), 'Créer')]")
            if self.is_element_visible(create_option, timeout=2):
                self.click(create_option)
                self.sleep(1)

        return self

    def set_invoice_date(self, date):
        """Définir la date de facture"""
        self.type_text(self.INVOICE_DATE, date)
        return self

    def add_invoice_line(self, product, quantity, unit_price):
        """Ajouter une ligne de facture"""
        # Cliquer sur onglet lignes si nécessaire
        if self.is_element_present(self.INVOICE_LINES_TAB):
            self.click(self.INVOICE_LINES_TAB)

        # Ajouter ligne
        self.click(self.ADD_LINE_BUTTON)
        self.sleep(1)

        # Remplir champs (locators peuvent varier selon ligne)
        self.type_text_slowly(self.PRODUCT_FIELD, product, delay=0.2)
        self.sleep(1)
        # Sélectionner premier produit
        first_result = (By.CSS_SELECTOR, '.ui-menu-item:first-child')
        if self.is_element_visible(first_result, timeout=3):
            self.click(first_result)

        self.type_text(self.QUANTITY_FIELD, str(quantity))
        self.type_text(self.UNIT_PRICE_FIELD, str(unit_price))

        return self

    def save_invoice(self):
        """Enregistrer la facture (brouillon)"""
        self.click(self.SAVE_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def confirm_invoice(self):
        """Confirmer la facture (passer en "Comptabilisée")"""
        self.click(self.CONFIRM_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def set_einvoice_format(self, format_name):
        """Définir le format de facture électronique"""
        # Ex: "Factur-X", "Chorus Pro", "Peppol"
        self.type_text_slowly(self.EINVOICE_FORMAT_FIELD, format_name, delay=0.2)
        self.sleep(1)
        first_result = (By.CSS_SELECTOR, '.ui-menu-item:first-child')
        if self.is_element_visible(first_result, timeout=3):
            self.click(first_result)
        return self

    def send_einvoice(self):
        """
        Envoyer la facture électronique
        (méthode générique)
        """
        self.click(self.SEND_EINVOICE_BUTTON)
        self.wait_for_odoo_loading(timeout=60)
        return self

    def download_facturx(self):
        """Télécharger la facture Factur-X"""
        self.click(self.DOWNLOAD_FACTURX_BUTTON)
        self.sleep(2)
        return self

    def send_to_chorus_pro(self):
        """Envoyer vers Chorus Pro"""
        self.click(self.SEND_CHORUS_BUTTON)
        self.wait_for_odoo_loading(timeout=60)
        return self

    def send_to_peppol(self):
        """Envoyer via réseau Peppol"""
        self.click(self.SEND_PEPPOL_BUTTON)
        self.wait_for_odoo_loading(timeout=60)
        return self

    def get_einvoice_status(self):
        """Récupérer le statut de la facture électronique"""
        if self.is_element_visible(self.EINVOICE_STATUS, timeout=5):
            return self.get_text(self.EINVOICE_STATUS)
        return None

    def open_first_invoice(self):
        """Ouvrir la première facture de la liste"""
        invoices = self.get_elements(self.INVOICES_LIST)
        if invoices:
            invoices[0].click()
            self.wait_for_odoo_loading()
            return True
        return False

    def search_invoice(self, reference):
        """Rechercher une facture par référence"""
        search_box = (By.CSS_SELECTOR, '.o_searchview_input')
        self.type_text(search_box, reference)
        self.press_key(search_box, '\n')
        self.wait_for_odoo_loading()
        return self


class EInvoiceFormatsPage(BasePage):
    """Page de configuration des formats de facturation électronique"""

    # Locators
    FORMATS_LIST = (By.CSS_SELECTOR, '.o_list_view .o_data_row')
    FORMAT_NAME = (By.CSS_SELECTOR, '.o_data_cell[data-field="name"]')
    FORMAT_CODE = (By.CSS_SELECTOR, '.o_data_cell[data-field="code"]')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web#action=e_invoicing.action_einvoice_format'

    def load(self):
        """Charger la page formats"""
        super().load(self.path)
        self.wait_for_page_load()
        self.wait_for_odoo_loading()
        return self

    def get_formats_count(self):
        """Compter le nombre de formats disponibles"""
        try:
            self.wait_for_element(self.FORMATS_LIST, timeout=5)
            return self.get_elements_count(self.FORMATS_LIST)
        except:
            return 0

    def get_format_names(self):
        """Récupérer la liste des noms de formats"""
        names = []
        elements = self.get_elements(self.FORMAT_NAME)
        for elem in elements:
            names.append(elem.text)
        return names

    def is_format_available(self, format_name):
        """Vérifier si un format est disponible"""
        return format_name in self.get_format_names()
