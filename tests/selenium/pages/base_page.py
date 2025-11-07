# -*- coding: utf-8 -*-
"""
Base Page Object
Classe parente pour tous les Page Objects
"""

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time


class BasePage:
    """
    Classe de base pour tous les Page Objects
    Contient les méthodes communes à toutes les pages
    """

    def __init__(self, driver, base_url='http://localhost:8069'):
        self.driver = driver
        self.base_url = base_url
        self.wait = WebDriverWait(driver, 10)
        self.long_wait = WebDriverWait(driver, 30)

    # ===============================================================
    # NAVIGATION
    # ===============================================================

    def load(self, path=''):
        """Charger une page"""
        url = f"{self.base_url}{path}"
        self.driver.get(url)
        return self

    def get_current_url(self):
        """URL actuelle"""
        return self.driver.current_url

    def refresh(self):
        """Rafraîchir la page"""
        self.driver.refresh()
        return self

    def go_back(self):
        """Retour arrière"""
        self.driver.back()
        return self

    # ===============================================================
    # ATTENTES & RECHERCHE
    # ===============================================================

    def wait_for_element(self, locator, timeout=10):
        """
        Attendre qu'un élément soit présent
        locator: tuple (By.ID, 'element-id')
        """
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.presence_of_element_located(locator))

    def wait_for_element_visible(self, locator, timeout=10):
        """Attendre qu'un élément soit visible"""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.visibility_of_element_located(locator))

    def wait_for_element_clickable(self, locator, timeout=10):
        """Attendre qu'un élément soit cliquable"""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.element_to_be_clickable(locator))

    def wait_for_text_in_element(self, locator, text, timeout=10):
        """Attendre qu'un texte apparaisse dans un élément"""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.text_to_be_present_in_element(locator, text))

    def wait_for_url_contains(self, text, timeout=10):
        """Attendre que l'URL contienne un texte"""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.url_contains(text))

    def wait_for_page_load(self, timeout=10):
        """Attendre que la page soit complètement chargée"""
        wait = WebDriverWait(self.driver, timeout)
        wait.until(
            lambda driver: driver.execute_script('return document.readyState') == 'complete'
        )
        return self

    def is_element_present(self, locator):
        """Vérifier si élément est présent (sans attendre)"""
        try:
            self.driver.find_element(*locator)
            return True
        except NoSuchElementException:
            return False

    def is_element_visible(self, locator, timeout=5):
        """Vérifier si élément est visible"""
        try:
            self.wait_for_element_visible(locator, timeout)
            return True
        except TimeoutException:
            return False

    # ===============================================================
    # INTERACTIONS
    # ===============================================================

    def click(self, locator, wait_clickable=True):
        """Cliquer sur un élément"""
        if wait_clickable:
            element = self.wait_for_element_clickable(locator)
        else:
            element = self.wait_for_element(locator)

        element.click()
        return self

    def click_with_js(self, locator):
        """Cliquer avec JavaScript (si click normal échoue)"""
        element = self.wait_for_element(locator)
        self.driver.execute_script("arguments[0].click();", element)
        return self

    def double_click(self, locator):
        """Double-cliquer"""
        element = self.wait_for_element(locator)
        ActionChains(self.driver).double_click(element).perform()
        return self

    def hover(self, locator):
        """Survoler un élément"""
        element = self.wait_for_element(locator)
        ActionChains(self.driver).move_to_element(element).perform()
        return self

    def type_text(self, locator, text, clear_first=True):
        """Taper du texte dans un champ"""
        element = self.wait_for_element_visible(locator)

        if clear_first:
            element.clear()

        element.send_keys(text)
        return self

    def type_text_slowly(self, locator, text, delay=0.1):
        """Taper du texte caractère par caractère (pour autocomplete)"""
        element = self.wait_for_element_visible(locator)
        element.clear()

        for char in text:
            element.send_keys(char)
            time.sleep(delay)

        return self

    def press_key(self, locator, key):
        """Presser une touche (ex: Keys.ENTER)"""
        element = self.wait_for_element(locator)
        element.send_keys(key)
        return self

    def select_dropdown_by_text(self, locator, text):
        """Sélectionner dans un dropdown par texte visible"""
        from selenium.webdriver.support.select import Select

        element = self.wait_for_element(locator)
        select = Select(element)
        select.select_by_visible_text(text)
        return self

    def select_dropdown_by_value(self, locator, value):
        """Sélectionner dans un dropdown par value"""
        from selenium.webdriver.support.select import Select

        element = self.wait_for_element(locator)
        select = Select(element)
        select.select_by_value(value)
        return self

    def check_checkbox(self, locator):
        """Cocher une checkbox"""
        element = self.wait_for_element(locator)
        if not element.is_selected():
            element.click()
        return self

    def uncheck_checkbox(self, locator):
        """Décocher une checkbox"""
        element = self.wait_for_element(locator)
        if element.is_selected():
            element.click()
        return self

    def upload_file(self, locator, file_path):
        """Uploader un fichier"""
        element = self.wait_for_element(locator)
        element.send_keys(file_path)
        return self

    # ===============================================================
    # RÉCUPÉRATION DE DONNÉES
    # ===============================================================

    def get_text(self, locator):
        """Récupérer le texte d'un élément"""
        element = self.wait_for_element_visible(locator)
        return element.text

    def get_attribute(self, locator, attribute):
        """Récupérer un attribut d'un élément"""
        element = self.wait_for_element(locator)
        return element.get_attribute(attribute)

    def get_value(self, locator):
        """Récupérer la valeur d'un input"""
        return self.get_attribute(locator, 'value')

    def get_elements(self, locator):
        """Récupérer plusieurs éléments"""
        self.wait_for_element(locator)
        return self.driver.find_elements(*locator)

    def get_elements_count(self, locator):
        """Compter le nombre d'éléments"""
        return len(self.get_elements(locator))

    # ===============================================================
    # SCROLL
    # ===============================================================

    def scroll_to_element(self, locator):
        """Scroller jusqu'à un élément"""
        element = self.wait_for_element(locator)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.5)  # Attendre que scroll soit fini
        return self

    def scroll_to_top(self):
        """Scroller en haut de page"""
        self.driver.execute_script("window.scrollTo(0, 0);")
        return self

    def scroll_to_bottom(self):
        """Scroller en bas de page"""
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        return self

    # ===============================================================
    # ALERTS & NOTIFICATIONS
    # ===============================================================

    def accept_alert(self, timeout=5):
        """Accepter une alerte JavaScript"""
        try:
            wait = WebDriverWait(self.driver, timeout)
            alert = wait.until(EC.alert_is_present())
            alert.accept()
            return True
        except TimeoutException:
            return False

    def dismiss_alert(self, timeout=5):
        """Refuser une alerte"""
        try:
            wait = WebDriverWait(self.driver, timeout)
            alert = wait.until(EC.alert_is_present())
            alert.dismiss()
            return True
        except TimeoutException:
            return False

    def get_alert_text(self, timeout=5):
        """Récupérer le texte d'une alerte"""
        wait = WebDriverWait(self.driver, timeout)
        alert = wait.until(EC.alert_is_present())
        return alert.text

    def wait_for_notification(self, timeout=10):
        """
        Attendre qu'une notification Odoo apparaisse
        Retourne le texte de la notification
        """
        locator = (By.CLASS_NAME, 'o_notification')
        element = self.wait_for_element_visible(locator, timeout)
        return element.text

    def wait_for_success_notification(self, timeout=10):
        """Attendre une notification de succès"""
        locator = (By.CSS_SELECTOR, '.o_notification.o_notification_success, .alert-success')
        element = self.wait_for_element_visible(locator, timeout)
        return element.text

    def wait_for_error_notification(self, timeout=10):
        """Attendre une notification d'erreur"""
        locator = (By.CSS_SELECTOR, '.o_notification.o_notification_error, .alert-danger, .alert-error')
        element = self.wait_for_element_visible(locator, timeout)
        return element.text

    # ===============================================================
    # IFRAME
    # ===============================================================

    def switch_to_iframe(self, locator):
        """Basculer vers un iframe"""
        iframe = self.wait_for_element(locator)
        self.driver.switch_to.frame(iframe)
        return self

    def switch_to_default_content(self):
        """Retourner au contenu principal"""
        self.driver.switch_to.default_content()
        return self

    # ===============================================================
    # FENÊTRES & ONGLETS
    # ===============================================================

    def switch_to_new_window(self):
        """Basculer vers nouvelle fenêtre/onglet"""
        all_windows = self.driver.window_handles
        self.driver.switch_to.window(all_windows[-1])
        return self

    def close_current_window(self):
        """Fermer fenêtre courante"""
        self.driver.close()
        return self

    def switch_to_main_window(self):
        """Retourner à la fenêtre principale"""
        all_windows = self.driver.window_handles
        self.driver.switch_to.window(all_windows[0])
        return self

    # ===============================================================
    # JAVASCRIPT
    # ===============================================================

    def execute_script(self, script, *args):
        """Exécuter du JavaScript"""
        return self.driver.execute_script(script, *args)

    def get_page_title(self):
        """Récupérer le titre de la page"""
        return self.driver.title

    def set_window_size(self, width, height):
        """Définir taille fenêtre"""
        self.driver.set_window_size(width, height)
        return self

    # ===============================================================
    # HELPERS ODOO SPÉCIFIQUES
    # ===============================================================

    def wait_for_odoo_loading(self, timeout=30):
        """
        Attendre que le loader Odoo disparaisse
        Odoo affiche souvent un overlay de chargement
        """
        try:
            # Attendre que le loader soit présent puis disparu
            loader_locator = (By.CLASS_NAME, 'o_loading')
            if self.is_element_present(loader_locator):
                wait = WebDriverWait(self.driver, timeout)
                wait.until(EC.invisibility_of_element_located(loader_locator))
        except TimeoutException:
            pass  # Pas grave si le loader n'apparaît pas

        return self

    def click_odoo_button(self, button_text):
        """
        Cliquer sur un bouton Odoo par son texte
        Ex: "Créer", "Enregistrer", "Confirmer"
        """
        locator = (By.XPATH, f"//button[contains(text(), '{button_text}')]")
        self.click(locator)
        return self

    def open_odoo_menu(self, menu_name):
        """
        Ouvrir un menu Odoo (navigation principale)
        """
        locator = (By.XPATH, f"//a[contains(@class, 'o_menu_entry') and contains(text(), '{menu_name}')]")
        self.click(locator)
        self.wait_for_odoo_loading()
        return self

    def fill_odoo_field(self, field_name, value):
        """
        Remplir un champ Odoo par son label
        """
        locator = (By.XPATH, f"//label[contains(text(), '{field_name}')]/following-sibling::input")
        self.type_text(locator, value)
        return self

    # ===============================================================
    # DEBUGGING
    # ===============================================================

    def take_screenshot(self, filename):
        """Prendre une capture d'écran"""
        self.driver.save_screenshot(filename)
        return self

    def print_page_source(self):
        """Afficher le HTML de la page (debug)"""
        print(self.driver.page_source)
        return self

    def get_console_logs(self):
        """Récupérer les logs console du navigateur"""
        return self.driver.get_log('browser')

    # ===============================================================
    # WAIT HELPERS
    # ===============================================================

    def sleep(self, seconds):
        """Sleep explicite (à utiliser en dernier recours)"""
        time.sleep(seconds)
        return self

    def wait_for_ajax(self, timeout=10):
        """
        Attendre que les requêtes AJAX soient terminées
        (nécessite jQuery)
        """
        wait = WebDriverWait(self.driver, timeout)
        wait.until(
            lambda driver: driver.execute_script('return jQuery.active == 0')
        )
        return self
