# -*- coding: utf-8 -*-
"""
Reporting Page Objects
"""

from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage


class CustomReportsPage(BasePage):
    """Page de gestion des rapports personnalisés"""

    # Locators
    REPORTS_LIST = (By.CSS_SELECTOR, '.o_list_view .o_data_row')
    NEW_REPORT_BUTTON = (By.CSS_SELECTOR, '.o_list_button_add')
    REPORT_NAME = (By.NAME, 'name')
    REPORT_TYPE = (By.NAME, 'report_type')
    OUTPUT_FORMAT = (By.NAME, 'output_format')
    DATE_FROM = (By.NAME, 'date_from')
    DATE_TO = (By.NAME, 'date_to')
    GENERATE_BUTTON = (By.CSS_SELECTOR, 'button[name="action_generate"]')
    DOWNLOAD_LINK = (By.CSS_SELECTOR, '.download-report-link')
    SAVE_BUTTON = (By.CSS_SELECTOR, 'button.o_form_button_save')
    SCHEDULE_CHECKBOX = (By.NAME, 'is_scheduled')
    SCHEDULE_FREQUENCY = (By.NAME, 'schedule_frequency')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web#action=reporting.action_custom_report'

    def load(self):
        """Charger la page rapports"""
        super().load(self.path)
        self.wait_for_page_load()
        self.wait_for_odoo_loading()
        return self

    def get_reports_count(self):
        """Compter le nombre de rapports"""
        try:
            self.wait_for_element(self.REPORTS_LIST, timeout=5)
            return self.get_elements_count(self.REPORTS_LIST)
        except:
            return 0

    def create_new_report(self):
        """Créer un nouveau rapport"""
        self.click(self.NEW_REPORT_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def fill_report_form(self, name, report_type='financial', output_format='pdf',
                         date_from=None, date_to=None):
        """Remplir le formulaire de rapport"""
        self.type_text(self.REPORT_NAME, name)
        self.select_dropdown_by_value(self.REPORT_TYPE, report_type)
        self.select_dropdown_by_value(self.OUTPUT_FORMAT, output_format)

        if date_from:
            self.type_text(self.DATE_FROM, date_from)
        if date_to:
            self.type_text(self.DATE_TO, date_to)

        return self

    def save_report(self):
        """Enregistrer le rapport"""
        self.click(self.SAVE_BUTTON)
        self.wait_for_odoo_loading()
        return self

    def generate_report(self):
        """
        Générer le rapport
        Retourne True si succès
        """
        self.click(self.GENERATE_BUTTON)

        # Attendre génération (peut prendre du temps)
        try:
            self.wait_for_success_notification(timeout=30)
            return True
        except:
            return False

    def enable_schedule(self, frequency='weekly'):
        """Activer la planification du rapport"""
        self.check_checkbox(self.SCHEDULE_CHECKBOX)
        self.select_dropdown_by_value(self.SCHEDULE_FREQUENCY, frequency)
        return self

    def download_report(self):
        """Télécharger le rapport généré"""
        if self.is_element_visible(self.DOWNLOAD_LINK, timeout=5):
            self.click(self.DOWNLOAD_LINK)
            self.sleep(2)  # Attendre téléchargement
            return True
        return False

    def open_first_report(self):
        """Ouvrir le premier rapport de la liste"""
        reports = self.get_elements(self.REPORTS_LIST)
        if reports:
            reports[0].click()
            self.wait_for_odoo_loading()
            return True
        return False


class ReportViewerPage(BasePage):
    """Page de visualisation d'un rapport"""

    # Locators
    REPORT_TITLE = (By.CSS_SELECTOR, '.report-title, h2')
    REPORT_TABLE = (By.CSS_SELECTOR, 'table.report-table')
    REPORT_CHART = (By.TAG_NAME, 'canvas')
    EXPORT_PDF_BUTTON = (By.CSS_SELECTOR, 'button[data-export="pdf"]')
    EXPORT_EXCEL_BUTTON = (By.CSS_SELECTOR, 'button[data-export="excel"]')
    EXPORT_CSV_BUTTON = (By.CSS_SELECTOR, 'button[data-export="csv"]')
    COMPARISON_TOGGLE = (By.CSS_SELECTOR, 'input[name="show_comparison"]')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)

    def get_report_title(self):
        """Récupérer le titre du rapport"""
        return self.get_text(self.REPORT_TITLE)

    def has_table(self):
        """Vérifier si le rapport contient un tableau"""
        return self.is_element_present(self.REPORT_TABLE)

    def has_chart(self):
        """Vérifier si le rapport contient un graphique"""
        return self.is_element_present(self.REPORT_CHART)

    def export_to_pdf(self):
        """Exporter en PDF"""
        self.click(self.EXPORT_PDF_BUTTON)
        self.sleep(2)
        return self

    def export_to_excel(self):
        """Exporter en Excel"""
        self.click(self.EXPORT_EXCEL_BUTTON)
        self.sleep(2)
        return self

    def export_to_csv(self):
        """Exporter en CSV"""
        self.click(self.EXPORT_CSV_BUTTON)
        self.sleep(2)
        return self

    def toggle_comparison(self):
        """Activer/désactiver la comparaison N vs N-1"""
        self.click(self.COMPARISON_TOGGLE)
        self.wait_for_odoo_loading()
        return self

    def get_table_rows_count(self):
        """Compter le nombre de lignes du tableau"""
        if self.has_table():
            rows_locator = (By.CSS_SELECTOR, 'table.report-table tbody tr')
            return self.get_elements_count(rows_locator)
        return 0
