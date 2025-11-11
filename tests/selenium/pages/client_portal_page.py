# -*- coding: utf-8 -*-
"""
Client Portal Page Objects
"""

from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage


class DashboardPage(BasePage):
    """Dashboard du portail client"""

    # Locators
    KPI_CARDS = (By.CLASS_NAME, 'kpi-card')
    CHARTS = (By.TAG_NAME, 'canvas')
    EXPORT_PDF_BUTTON = (By.CLASS_NAME, 'btn-export-pdf')
    EXPORT_EXCEL_BUTTON = (By.CLASS_NAME, 'btn-export-excel')
    TOTAL_EXPENSES = (By.CSS_SELECTOR, '.kpi-card[data-type="expenses"] .kpi-value')
    TOTAL_DOCUMENTS = (By.CSS_SELECTOR, '.kpi-card[data-type="documents"] .kpi-value')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/my/dashboard'

    def load(self):
        """Charger le dashboard"""
        super().load(self.path)
        self.wait_for_page_load()
        return self

    def wait_for_dashboard_loaded(self):
        """Attendre que le dashboard soit chargé"""
        self.wait_for_element_visible(self.KPI_CARDS, timeout=15)
        self.wait_for_odoo_loading()
        return self

    def get_kpi_cards_count(self):
        """Compter le nombre de KPI cards"""
        return self.get_elements_count(self.KPI_CARDS)

    def get_charts_count(self):
        """Compter le nombre de graphiques"""
        return self.get_elements_count(self.CHARTS)

    def get_total_expenses(self):
        """Récupérer le total des notes de frais"""
        return self.get_text(self.TOTAL_EXPENSES)

    def export_to_pdf(self):
        """Exporter le dashboard en PDF"""
        self.click(self.EXPORT_PDF_BUTTON)
        self.sleep(2)  # Attendre téléchargement
        return self

    def export_to_excel(self):
        """Exporter le dashboard en Excel"""
        self.click(self.EXPORT_EXCEL_BUTTON)
        self.sleep(2)
        return self


class DocumentsPage(BasePage):
    """Page de gestion des documents"""

    # Locators
    UPLOAD_ZONE = (By.CLASS_NAME, 'upload-zone')
    FILE_INPUT = (By.CSS_SELECTOR, 'input[type="file"]')
    FILE_PREVIEW = (By.CLASS_NAME, 'file-preview')
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, '.alert-success')
    DOCUMENTS_LIST = (By.CLASS_NAME, 'document-item')
    NEW_DOCUMENT_BUTTON = (By.CLASS_NAME, 'btn-new-document')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/my/documents'

    def load(self):
        """Charger la page documents"""
        super().load(self.path)
        self.wait_for_page_load()
        return self

    def upload_document(self, file_path):
        """
        Uploader un document
        Retourne True si succès
        """
        # Cliquer sur zone d'upload
        self.click(self.UPLOAD_ZONE)

        # Uploader fichier
        self.upload_file(self.FILE_INPUT, file_path)

        # Attendre prévisualisation
        try:
            self.wait_for_element_visible(self.FILE_PREVIEW, timeout=15)
            # Attendre message de succès
            self.wait_for_success_notification(timeout=10)
            return True
        except:
            return False

    def get_documents_count(self):
        """Compter le nombre de documents"""
        return self.get_elements_count(self.DOCUMENTS_LIST)

    def get_success_message(self):
        """Récupérer le message de succès"""
        return self.get_text(self.SUCCESS_MESSAGE)


class ExpensesPage(BasePage):
    """Page de gestion des notes de frais"""

    # Locators
    NEW_EXPENSE_BUTTON = (By.CLASS_NAME, 'btn-new-expense')
    EXPENSES_LIST = (By.CLASS_NAME, 'expense-item')
    PHOTO_CAPTURE_ZONE = (By.CLASS_NAME, 'photo-capture-zone')
    CAMERA_INPUT = (By.CSS_SELECTOR, 'input[type="file"][capture="camera"]')
    OCR_LOADER = (By.CLASS_NAME, 'ocr-loader')
    EXPENSE_NAME_FIELD = (By.NAME, 'name')
    EXPENSE_AMOUNT_FIELD = (By.NAME, 'amount')
    EXPENSE_DATE_FIELD = (By.NAME, 'expense_date')
    EXPENSE_CATEGORY_SELECT = (By.NAME, 'category')
    EXPENSE_DESCRIPTION_FIELD = (By.NAME, 'description')
    SAVE_BUTTON = (By.CLASS_NAME, 'btn-save-expense')
    SUBMIT_BUTTON = (By.CLASS_NAME, 'btn-submit-expense')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/my/expenses'

    def load(self):
        """Charger la page notes de frais"""
        super().load(self.path)
        self.wait_for_page_load()
        return self

    def click_new_expense(self):
        """Cliquer sur "Nouvelle note de frais"""
        self.click(self.NEW_EXPENSE_BUTTON)
        self.wait_for_element_visible(self.PHOTO_CAPTURE_ZONE, timeout=10)
        return self

    def upload_receipt_photo(self, photo_path):
        """
        Uploader une photo de reçu
        Déclenche l'OCR automatiquement
        """
        # Uploader photo
        self.upload_file(self.CAMERA_INPUT, photo_path)

        # Attendre le loader OCR
        try:
            self.wait_for_element_visible(self.OCR_LOADER, timeout=5)
        except:
            pass  # Le loader peut être très rapide

        # Attendre la fin de l'OCR (disparition du loader)
        try:
            from selenium.webdriver.support import expected_conditions as EC
            self.long_wait.until(
                EC.invisibility_of_element_located(self.OCR_LOADER)
            )
        except:
            pass

        # Attendre notification de succès ou erreur
        self.sleep(2)

        return self

    def fill_expense_form(self, name, amount, date, category, description=''):
        """Remplir le formulaire de note de frais"""
        self.type_text(self.EXPENSE_NAME_FIELD, name)
        self.type_text(self.EXPENSE_AMOUNT_FIELD, amount)
        self.type_text(self.EXPENSE_DATE_FIELD, date)
        self.select_dropdown_by_value(self.EXPENSE_CATEGORY_SELECT, category)

        if description:
            self.type_text(self.EXPENSE_DESCRIPTION_FIELD, description)

        return self

    def get_prefilled_amount(self):
        """Récupérer le montant pré-rempli par OCR"""
        return self.get_value(self.EXPENSE_AMOUNT_FIELD)

    def save_expense(self):
        """Enregistrer la note de frais (brouillon)"""
        self.click(self.SAVE_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def submit_expense(self):
        """Soumettre la note de frais pour validation"""
        self.click(self.SUBMIT_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def get_expenses_count(self):
        """Compter le nombre de notes de frais"""
        return self.get_elements_count(self.EXPENSES_LIST)


class PWAPage(BasePage):
    """Page pour tester les fonctionnalités PWA"""

    # Locators
    MANIFEST_LINK = (By.CSS_SELECTOR, 'link[rel="manifest"]')
    THEME_COLOR_META = (By.CSS_SELECTOR, 'meta[name="theme-color"]')
    VIEWPORT_META = (By.CSS_SELECTOR, 'meta[name="viewport"]')
    SERVICE_WORKER_SCRIPT = (By.CSS_SELECTOR, 'script[src*="sw.js"], script[src*="service-worker"]')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)

    def has_manifest(self):
        """Vérifier si manifest PWA est présent"""
        return self.is_element_present(self.MANIFEST_LINK)

    def get_theme_color(self):
        """Récupérer la couleur du thème PWA"""
        if self.is_element_present(self.THEME_COLOR_META):
            return self.get_attribute(self.THEME_COLOR_META, 'content')
        return None

    def has_service_worker(self):
        """Vérifier si service worker est enregistré"""
        script = """
        return navigator.serviceWorker.controller !== null;
        """
        return self.execute_script(script)

    def is_pwa_ready(self):
        """Vérifier si l'application est prête pour PWA"""
        return self.has_manifest() and self.get_theme_color() is not None
