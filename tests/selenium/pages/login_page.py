# -*- coding: utf-8 -*-
"""
Login Page Object
"""

from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage


class LoginPage(BasePage):
    """Page de connexion Odoo"""

    # Locators
    LOGIN_FIELD = (By.ID, 'login')
    PASSWORD_FIELD = (By.ID, 'password')
    SUBMIT_BUTTON = (By.CSS_SELECTOR, 'button[type="submit"]')
    ERROR_MESSAGE = (By.CLASS_NAME, 'alert-danger')
    LOGO = (By.CSS_SELECTOR, '.oe_logo img')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/web/login'

    def load(self):
        """Charger la page de login"""
        super().load(self.path)
        self.wait_for_page_load()
        return self

    def login(self, username, password):
        """
        Se connecter
        Retourne True si succès, False si échec
        """
        self.type_text(self.LOGIN_FIELD, username)
        self.type_text(self.PASSWORD_FIELD, password)
        self.click(self.SUBMIT_BUTTON)

        # Attendre redirection ou message d'erreur
        try:
            self.wait_for_url_contains('/web', timeout=10)
            return True
        except:
            return False

    def get_error_message(self):
        """Récupérer le message d'erreur"""
        if self.is_element_present(self.ERROR_MESSAGE):
            return self.get_text(self.ERROR_MESSAGE)
        return None

    def is_login_page(self):
        """Vérifier qu'on est sur la page de login"""
        return self.is_element_present(self.LOGO) and \
               self.is_element_present(self.LOGIN_FIELD)
