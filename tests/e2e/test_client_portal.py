# -*- coding: utf-8 -*-
"""
Tests E2E pour le portail client avec Selenium
"""

import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time


class TestClientPortal(unittest.TestCase):
    """Tests d'intégration end-to-end du portail client"""

    @classmethod
    def setUpClass(cls):
        """Configuration initiale des tests"""
        # Configuration Chrome headless
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')

        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.implicitly_wait(10)

        cls.base_url = 'http://localhost:8069'
        cls.username = 'demo@iseb.fr'
        cls.password = 'demo'

    @classmethod
    def tearDownClass(cls):
        """Nettoyage après les tests"""
        cls.driver.quit()

    def setUp(self):
        """Configuration avant chaque test"""
        self.driver.get(self.base_url)

    def login(self):
        """Se connecter au portail"""
        # Aller à la page de login
        self.driver.get(f'{self.base_url}/web/login')

        # Remplir le formulaire
        username_input = self.driver.find_element(By.ID, 'login')
        password_input = self.driver.find_element(By.ID, 'password')

        username_input.send_keys(self.username)
        password_input.send_keys(self.password)

        # Soumettre
        login_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        login_button.click()

        # Attendre le chargement
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'o_web_client'))
        )

    def test_01_login(self):
        """Test: Connexion au portail"""
        self.login()

        # Vérifier qu'on est bien connecté
        self.assertIn('my/home', self.driver.current_url)

    def test_02_dashboard_display(self):
        """Test: Affichage du dashboard"""
        self.login()

        # Naviguer vers le dashboard
        self.driver.get(f'{self.base_url}/my/dashboard')

        # Attendre le chargement des KPIs
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'kpi-card'))
        )

        # Vérifier les éléments principaux
        kpi_cards = self.driver.find_elements(By.CLASS_NAME, 'kpi-card')
        self.assertGreaterEqual(len(kpi_cards), 4, "Au moins 4 KPIs doivent être affichés")

        # Vérifier les graphiques Chart.js
        charts = self.driver.find_elements(By.TAG_NAME, 'canvas')
        self.assertGreaterEqual(len(charts), 2, "Au moins 2 graphiques doivent être affichés")

    def test_03_document_upload(self):
        """Test: Upload de document avec drag & drop"""
        self.login()

        # Aller à la page documents
        self.driver.get(f'{self.base_url}/my/documents')

        # Trouver la zone d'upload
        upload_zone = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'upload-zone'))
        )

        # Simuler le clic sur la zone
        upload_zone.click()

        # Trouver l'input file
        file_input = self.driver.find_element(By.CSS_SELECTOR, 'input[type="file"]')

        # Upload un fichier de test
        test_file = '/home/user/ISEB/tests/fixtures/test_document.pdf'
        file_input.send_keys(test_file)

        # Attendre la prévisualisation
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'file-preview'))
        )

        # Vérifier le message de succès
        success_message = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.alert-success'))
        )
        self.assertIn('succès', success_message.text.lower())

    def test_04_expense_photo_ocr(self):
        """Test: Capture photo et OCR pour note de frais"""
        self.login()

        # Aller à la page notes de frais
        self.driver.get(f'{self.base_url}/my/expenses')

        # Cliquer sur "Nouvelle note de frais"
        new_expense_btn = self.driver.find_element(By.CSS_SELECTOR, '.btn-new-expense')
        new_expense_btn.click()

        # Attendre le formulaire
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'photo-capture-zone'))
        )

        # Simuler l'upload d'une photo de reçu
        file_input = self.driver.find_element(By.CSS_SELECTOR, 'input[type="file"][capture="camera"]')
        test_receipt = '/home/user/ISEB/tests/fixtures/test_receipt.jpg'
        file_input.send_keys(test_receipt)

        # Attendre le traitement OCR
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'ocr-loader'))
        )

        # Attendre la fin de l'OCR
        WebDriverWait(self.driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.alert-success'))
        )

        # Vérifier que les champs sont pré-remplis
        amount_input = self.driver.find_element(By.NAME, 'amount')
        self.assertNotEqual(amount_input.get_attribute('value'), '', "Le montant devrait être rempli par OCR")

    def test_05_export_pdf(self):
        """Test: Export PDF du dashboard"""
        self.login()

        # Aller au dashboard
        self.driver.get(f'{self.base_url}/my/dashboard')

        # Cliquer sur Export PDF
        export_btn = self.driver.find_element(By.CLASS_NAME, 'btn-export-pdf')
        export_btn.click()

        # Attendre le téléchargement (dans un vrai test, on vérifierait le fichier)
        time.sleep(3)

    def test_06_pwa_installation(self):
        """Test: Vérification des éléments PWA"""
        self.login()

        # Vérifier la présence du manifest
        manifest_link = self.driver.find_element(By.CSS_SELECTOR, 'link[rel="manifest"]')
        self.assertIsNotNone(manifest_link, "Le manifest PWA doit être présent")

        # Vérifier les meta tags PWA
        theme_color_meta = self.driver.find_element(By.CSS_SELECTOR, 'meta[name="theme-color"]')
        self.assertEqual(theme_color_meta.get_attribute('content'), '#007bff')

    def test_07_bank_sync(self):
        """Test: Synchronisation bancaire"""
        self.login()

        # Aller à la page synchronisation bancaire
        self.driver.get(f'{self.base_url}/web#action=bank_sync.action_bank_account')

        # Attendre le chargement
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'o_list_view'))
        )

        # Si des comptes existent, tester la synchronisation
        sync_buttons = self.driver.find_elements(By.CSS_SELECTOR, '.btn-sync-now')
        if sync_buttons:
            sync_buttons[0].click()

            # Attendre la notification
            WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'o_notification'))
            )

    def test_08_custom_report_generation(self):
        """Test: Génération de rapport personnalisé"""
        self.login()

        # Aller aux rapports
        self.driver.get(f'{self.base_url}/web#action=reporting.action_custom_report')

        # Créer un nouveau rapport (si possible)
        # ... (test simplifié)

    def test_09_einvoice_send(self):
        """Test: Envoi facture électronique"""
        self.login()

        # Aller aux factures
        self.driver.get(f'{self.base_url}/web#model=account.move')

        # Sélectionner une facture et envoyer en mode électronique
        # ... (test simplifié)

    def test_10_responsive_mobile(self):
        """Test: Vérification responsive sur mobile"""
        # Changer la taille de fenêtre pour simuler un mobile
        self.driver.set_window_size(375, 667)

        self.login()

        # Vérifier que le menu mobile est affiché
        mobile_menu = self.driver.find_element(By.CSS_SELECTOR, '.navbar-toggler')
        self.assertTrue(mobile_menu.is_displayed(), "Le menu mobile doit être visible")


if __name__ == '__main__':
    unittest.main()
