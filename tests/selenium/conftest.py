# -*- coding: utf-8 -*-
"""
Configuration pytest pour les tests Selenium
Fixtures partagées et setup/teardown
"""

import pytest
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime


# ===================================================================
# CONFIGURATION
# ===================================================================

BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8069')
HEADLESS = os.getenv('HEADLESS', 'true').lower() == 'true'
SCREENSHOTS_DIR = 'tests/selenium/screenshots'
IMPLICIT_WAIT = 10  # secondes


# ===================================================================
# FIXTURES - BROWSER
# ===================================================================

@pytest.fixture(scope='session')
def chrome_options():
    """Options Chrome pour les tests"""
    options = Options()

    if HEADLESS:
        options.add_argument('--headless')

    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option('excludeSwitches', ['enable-logging'])

    # Performance optimizations
    options.add_argument('--disable-extensions')
    options.add_argument('--disable-infobars')

    return options


@pytest.fixture(scope='function')
def driver(chrome_options):
    """
    WebDriver Chrome pour chaque test
    Scope: function = nouveau driver par test (isolation)
    """
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(IMPLICIT_WAIT)
    driver.maximize_window()

    yield driver

    # Teardown
    driver.quit()


@pytest.fixture(scope='function')
def authenticated_driver(driver, login_user):
    """
    WebDriver déjà authentifié
    Utile pour tests qui ne testent pas le login
    """
    login_user(driver)
    yield driver


# ===================================================================
# FIXTURES - AUTHENTICATION
# ===================================================================

@pytest.fixture(scope='session')
def test_credentials():
    """Credentials de test"""
    return {
        'admin': {
            'username': os.getenv('TEST_ADMIN_USER', 'admin@iseb.fr'),
            'password': os.getenv('TEST_ADMIN_PASSWORD', 'admin'),
        },
        'user': {
            'username': os.getenv('TEST_USER', 'demo@iseb.fr'),
            'password': os.getenv('TEST_USER_PASSWORD', 'demo'),
        },
        'accountant': {
            'username': os.getenv('TEST_ACCOUNTANT', 'comptable@iseb.fr'),
            'password': os.getenv('TEST_ACCOUNTANT_PASSWORD', 'demo'),
        }
    }


@pytest.fixture(scope='function')
def login_user(test_credentials):
    """
    Fonction helper pour login
    Usage: login_user(driver, role='user')
    """
    def _login(driver, role='user'):
        from tests.selenium.pages.login_page import LoginPage

        credentials = test_credentials.get(role, test_credentials['user'])
        login_page = LoginPage(driver, BASE_URL)
        login_page.load()
        login_page.login(credentials['username'], credentials['password'])

        return driver

    return _login


# ===================================================================
# FIXTURES - DATA
# ===================================================================

@pytest.fixture(scope='function')
def test_files():
    """Fichiers de test pour uploads"""
    import tempfile

    files = {}

    # PDF de test
    pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.pdf', delete=False) as f:
        f.write(pdf_content)
        files['pdf'] = f.name

    # Image de test (reçu)
    from PIL import Image
    img = Image.new('RGB', (800, 600), color='white')
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.jpg', delete=False) as f:
        img.save(f, 'JPEG')
        files['receipt'] = f.name

    # Document texte
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write('Test document content\nLine 2\nLine 3')
        files['txt'] = f.name

    yield files

    # Cleanup
    for filepath in files.values():
        try:
            os.remove(filepath)
        except:
            pass


@pytest.fixture(scope='function')
def test_expense_data():
    """Données de test pour notes de frais"""
    return {
        'name': f'Test Expense {datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'amount': '45.67',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'category': 'meal',
        'description': 'Déjeuner client test Selenium'
    }


@pytest.fixture(scope='function')
def test_invoice_data():
    """Données de test pour factures"""
    return {
        'partner_name': 'Client Test Selenium',
        'amount': '1234.56',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'reference': f'FACT-TEST-{datetime.now().strftime("%Y%m%d")}'
    }


# ===================================================================
# FIXTURES - UTILITIES
# ===================================================================

@pytest.fixture(scope='function')
def take_screenshot():
    """
    Helper pour capturer des screenshots
    Usage: take_screenshot(driver, 'test_name')
    """
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

    def _screenshot(driver, name):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{name}_{timestamp}.png"
        filepath = os.path.join(SCREENSHOTS_DIR, filename)
        driver.save_screenshot(filepath)
        return filepath

    return _screenshot


@pytest.fixture(scope='function', autouse=True)
def screenshot_on_failure(request, driver, take_screenshot):
    """
    Capture automatique screenshot en cas d'échec
    autouse=True : s'applique à tous les tests
    """
    yield

    if request.node.rep_call.failed:
        test_name = request.node.name
        screenshot_path = take_screenshot(driver, f'FAILED_{test_name}')
        print(f"\n📸 Screenshot capturé: {screenshot_path}")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Hook pytest pour capturer le résultat du test
    Nécessaire pour screenshot_on_failure
    """
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)


@pytest.fixture(scope='function')
def wait_helper():
    """
    Helper pour waits custom
    Usage: wait = wait_helper(driver); wait.until(condition)
    """
    from selenium.webdriver.support.ui import WebDriverWait

    def _wait(driver, timeout=10):
        return WebDriverWait(driver, timeout)

    return _wait


# ===================================================================
# FIXTURES - DATABASE CLEANUP
# ===================================================================

@pytest.fixture(scope='function')
def cleanup_test_data():
    """
    Cleanup des données de test après chaque test
    À implémenter selon votre architecture DB
    """
    yield

    # TODO: Implémenter cleanup si nécessaire
    # Ex: Supprimer les expenses/invoices créés pendant le test
    pass


# ===================================================================
# HOOKS PYTEST
# ===================================================================

def pytest_configure(config):
    """Configuration globale pytest"""
    # Créer répertoire screenshots
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

    # Markers custom
    config.addinivalue_line(
        "markers", "smoke: Tests critiques (smoke tests)"
    )
    config.addinivalue_line(
        "markers", "regression: Tests de non-régression"
    )
    config.addinivalue_line(
        "markers", "slow: Tests lents (> 30s)"
    )
    config.addinivalue_line(
        "markers", "integration: Tests d'intégration"
    )


def pytest_collection_modifyitems(config, items):
    """Modifier la collection de tests"""
    # Ajouter marker 'slow' automatiquement si pas spécifié
    for item in items:
        if 'slow' not in item.keywords and 'integration' in item.keywords:
            item.add_marker(pytest.mark.slow)


# ===================================================================
# CONFIGURATION REPORT HTML
# ===================================================================

@pytest.fixture(scope='session', autouse=True)
def configure_html_report(request):
    """Configure pytest-html report"""
    if hasattr(request.config, '_metadata'):
        request.config._metadata['Project'] = 'ISEB Platform'
        request.config._metadata['Base URL'] = BASE_URL
        request.config._metadata['Headless'] = HEADLESS
        request.config._metadata['Browser'] = 'Chrome'
        request.config._metadata['Python Version'] = os.popen('python --version').read()


# ===================================================================
# NOTES
# ===================================================================
#
# Pour lancer les tests:
#   pytest tests/selenium/ -v
#   pytest tests/selenium/ -v -k "login"  # Seulement tests login
#   pytest tests/selenium/ -v -m smoke    # Seulement smoke tests
#   pytest tests/selenium/ -v --headless  # Mode headless
#   pytest tests/selenium/ -v --html=report.html  # Avec report HTML
#
# Variables d'environnement:
#   TEST_BASE_URL=http://localhost:8069
#   HEADLESS=true
#   TEST_ADMIN_USER=admin@iseb.fr
#   TEST_ADMIN_PASSWORD=admin
#
# ===================================================================
