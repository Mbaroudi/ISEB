# 🧪 Suite de Tests Selenium E2E - ISEB Platform

Tests End-to-End automatisés pour la plateforme ISEB utilisant Selenium WebDriver et pytest.

---

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Lancement des Tests](#lancement-des-tests)
5. [Structure des Tests](#structure-des-tests)
6. [Page Object Model](#page-object-model)
7. [Fixtures](#fixtures)
8. [Bonnes Pratiques](#bonnes-pratiques)
9. [CI/CD](#cicd)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Pattern Page Object Model (POM)

Les tests suivent le pattern **Page Object Model** pour:
- Séparer la logique métier (tests) de l'implémentation UI (pages)
- Faciliter la maintenance
- Réutiliser les composants
- Améliorer la lisibilité

```
tests/selenium/
├── conftest.py               # Configuration pytest & fixtures
├── requirements.txt          # Dépendances Python
├── pages/                    # Page Objects
│   ├── base_page.py         # Classe parente
│   ├── login_page.py        # Page de login
│   ├── client_portal_page.py
│   ├── bank_sync_page.py
│   ├── reporting_page.py
│   └── e_invoicing_page.py
└── test_*.py                 # Tests E2E
    ├── test_client_portal.py
    ├── test_bank_sync.py
    ├── test_reporting.py
    ├── test_e_invoicing.py
    └── test_integration.py
```

---

## 🚀 Installation

### Prérequis

- **Python** : 3.10+
- **Chrome** : Latest (téléchargé automatiquement)
- **ISEB Platform** : Running sur `http://localhost:8069`

### Installation des dépendances

```bash
# Depuis la racine du projet
cd tests/selenium

# Créer environnement virtuel (recommandé)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer dépendances
pip install -r requirements.txt
```

### Vérification

```bash
# Vérifier Selenium
python -c "import selenium; print(selenium.__version__)"

# Vérifier pytest
pytest --version
```

---

## ⚙️ Configuration

### Variables d'environnement

Créer un fichier `.env` dans `tests/selenium/`:

```bash
# Base URL de l'application
TEST_BASE_URL=http://localhost:8069

# Mode headless (true/false)
HEADLESS=true

# Credentials de test
TEST_ADMIN_USER=admin@iseb.fr
TEST_ADMIN_PASSWORD=admin

TEST_USER=demo@iseb.fr
TEST_USER_PASSWORD=demo

TEST_ACCOUNTANT=comptable@iseb.fr
TEST_ACCOUNTANT_PASSWORD=demo
```

### Configuration pytest

Le fichier `pytest.ini` (à créer à la racine du projet):

```ini
[pytest]
# Répertoire des tests
testpaths = tests/selenium

# Pattern de fichiers de tests
python_files = test_*.py

# Pattern de classes de tests
python_classes = Test*

# Pattern de méthodes de tests
python_functions = test_*

# Markers personnalisés
markers =
    smoke: Tests critiques (smoke tests)
    regression: Tests de non-régression
    slow: Tests lents (> 30s)
    integration: Tests d'intégration cross-modules

# Options par défaut
addopts =
    -v
    --strict-markers
    --tb=short
    --disable-warnings

# Timeout global (10 minutes)
timeout = 600
```

---

## 🎯 Lancement des Tests

### Commandes de base

```bash
# Tous les tests
pytest tests/selenium/ -v

# Tests d'un module spécifique
pytest tests/selenium/test_client_portal.py -v

# Test spécifique
pytest tests/selenium/test_client_portal.py::TestLogin::test_login_success -v

# Avec rapport HTML
pytest tests/selenium/ -v --html=report.html --self-contained-html
```

### Par markers

```bash
# Smoke tests uniquement (tests critiques)
pytest tests/selenium/ -v -m smoke

# Tests lents uniquement
pytest tests/selenium/ -v -m slow

# Tests d'intégration
pytest tests/selenium/ -v -m integration

# Exclure tests lents
pytest tests/selenium/ -v -m "not slow"

# Combiner markers
pytest tests/selenium/ -v -m "smoke and not slow"
```

### Par nom de test

```bash
# Tests contenant "login"
pytest tests/selenium/ -v -k "login"

# Tests contenant "dashboard" ou "expense"
pytest tests/selenium/ -v -k "dashboard or expense"

# Tests ne contenant pas "slow"
pytest tests/selenium/ -v -k "not slow"
```

### Mode headless

```bash
# Mode headless (sans interface)
HEADLESS=true pytest tests/selenium/ -v

# Mode visible (pour debug)
HEADLESS=false pytest tests/selenium/ -v
```

### Parallélisation

```bash
# Lancer tests en parallèle (nécessite pytest-xdist)
pytest tests/selenium/ -v -n auto  # Auto détecte nb CPUs
pytest tests/selenium/ -v -n 4     # 4 workers
```

### Relancer tests échoués

```bash
# Relancer une fois les tests échoués
pytest tests/selenium/ -v --reruns 1

# Relancer jusqu'à 3 fois avec délai
pytest tests/selenium/ -v --reruns 3 --reruns-delay 2
```

### Mode verbeux

```bash
# Verbosité maximale
pytest tests/selenium/ -vv

# Afficher print() dans les tests
pytest tests/selenium/ -v -s

# Afficher durée des 10 tests les plus lents
pytest tests/selenium/ -v --durations=10
```

---

## 📁 Structure des Tests

### Hiérarchie des tests

```python
# test_client_portal.py

@pytest.mark.smoke
class TestLogin:
    """Tests de connexion"""

    def test_login_success(self, driver, test_credentials):
        """Test: Connexion réussie"""
        # Arrange
        credentials = test_credentials['user']
        login_page = LoginPage(driver)

        # Act
        login_page.load()
        success = login_page.login(
            credentials['username'],
            credentials['password']
        )

        # Assert
        assert success
        assert '/web' in login_page.get_current_url()
```

### Organisation recommandée

**1 classe = 1 fonctionnalité**

```python
class TestDashboard:
    """Tests du dashboard"""
    def test_dashboard_loads(self): ...
    def test_dashboard_charts(self): ...
    def test_dashboard_export_pdf(self): ...
```

**Groupement par type**
- `@pytest.mark.smoke` : Tests critiques (CI rapide)
- `@pytest.mark.regression` : Tests de non-régression
- `@pytest.mark.slow` : Tests lents (exclus du CI rapide)
- `@pytest.mark.integration` : Tests cross-modules

---

## 📄 Page Object Model

### Base Page

Toutes les pages héritent de `BasePage`:

```python
from tests.selenium.pages.base_page import BasePage

class MyPage(BasePage):
    # Locators
    MY_BUTTON = (By.ID, 'my-button')

    def __init__(self, driver, base_url='http://localhost:8069'):
        super().__init__(driver, base_url)
        self.path = '/my/path'

    def click_my_button(self):
        self.click(self.MY_BUTTON)
        return self
```

### Méthodes disponibles

**Navigation**:
- `load(path)` : Charger une URL
- `refresh()` : Rafraîchir
- `go_back()` : Retour arrière

**Attentes**:
- `wait_for_element(locator)` : Attendre présence
- `wait_for_element_visible(locator)` : Attendre visibilité
- `wait_for_element_clickable(locator)` : Attendre cliquable
- `wait_for_text_in_element(locator, text)` : Attendre texte
- `wait_for_url_contains(text)` : Attendre URL

**Interactions**:
- `click(locator)` : Cliquer
- `type_text(locator, text)` : Taper texte
- `select_dropdown_by_text(locator, text)` : Sélectionner dropdown
- `check_checkbox(locator)` : Cocher checkbox
- `upload_file(locator, file_path)` : Uploader fichier

**Récupération**:
- `get_text(locator)` : Récupérer texte
- `get_attribute(locator, attr)` : Récupérer attribut
- `get_value(locator)` : Récupérer valeur input
- `get_elements(locator)` : Récupérer plusieurs éléments

**Odoo spécifiques**:
- `wait_for_odoo_loading()` : Attendre loader Odoo
- `click_odoo_button(text)` : Cliquer bouton par texte
- `open_odoo_menu(name)` : Ouvrir menu
- `fill_odoo_field(name, value)` : Remplir champ

---

## 🔧 Fixtures

### Fixtures disponibles

#### `driver`
WebDriver Chrome configuré pour chaque test.

```python
def test_example(driver):
    driver.get('http://localhost:8069')
    assert 'ISEB' in driver.title
```

#### `authenticated_driver`
WebDriver déjà authentifié (gain de temps).

```python
def test_dashboard(authenticated_driver):
    dashboard = DashboardPage(authenticated_driver)
    dashboard.load()
    # Déjà connecté!
```

#### `test_credentials`
Dictionnaire des credentials de test.

```python
def test_login(driver, test_credentials):
    creds = test_credentials['user']
    # creds['username'], creds['password']
```

#### `test_files`
Fichiers de test temporaires (PDF, image, texte).

```python
def test_upload(authenticated_driver, test_files):
    upload_page.upload_file(test_files['pdf'])
```

#### `test_expense_data`
Données de test pour notes de frais.

```python
def test_create_expense(authenticated_driver, test_expense_data):
    # test_expense_data['name'], ['amount'], ['date'], etc.
```

#### `test_invoice_data`
Données de test pour factures.

```python
def test_create_invoice(authenticated_driver, test_invoice_data):
    # test_invoice_data['partner_name'], ['amount'], etc.
```

#### `take_screenshot`
Helper pour capturer screenshots.

```python
def test_example(driver, take_screenshot):
    take_screenshot(driver, 'my_test_screenshot')
```

#### Auto-screenshot sur échec
Automatique ! Screenshot capturé si test échoue.

---

## ✅ Bonnes Pratiques

### 1. Nommage

```python
# ✅ Bon
def test_login_success_with_valid_credentials(self):
    """Test: Connexion réussie avec credentials valides"""

# ❌ Mauvais
def test1(self):
    pass
```

### 2. Assertions claires

```python
# ✅ Bon
assert kpi_count >= 4, f"Au moins 4 KPIs attendues, {kpi_count} trouvées"

# ❌ Mauvais
assert kpi_count >= 4
```

### 3. Arrange-Act-Assert

```python
def test_example(self):
    # Arrange (préparer)
    page = MyPage(driver)

    # Act (agir)
    page.load()
    page.click_button()

    # Assert (vérifier)
    assert page.is_success_displayed()
```

### 4. Réutilisation

```python
# ✅ Bon : utiliser Page Object
def test_login(driver):
    login_page = LoginPage(driver)
    login_page.load()
    login_page.login('user', 'pass')

# ❌ Mauvais : logique UI dans test
def test_login(driver):
    driver.get('http://localhost:8069/web/login')
    driver.find_element(By.ID, 'login').send_keys('user')
    driver.find_element(By.ID, 'password').send_keys('pass')
    driver.find_element(By.CSS_SELECTOR, 'button').click()
```

### 5. Indépendance des tests

```python
# ✅ Bon : chaque test est autonome
def test_a(authenticated_driver):
    # Setup propre à ce test

# ❌ Mauvais : dépendance entre tests
test_order = ['test_a', 'test_b', 'test_c']  # NEVER!
```

### 6. Cleanup

```python
# ✅ Bon : utiliser fixture pour cleanup
@pytest.fixture
def created_expense(authenticated_driver):
    expense = create_expense()
    yield expense
    delete_expense(expense.id)  # Cleanup automatique
```

---

## 🔄 CI/CD

### GitHub Actions

Le workflow `.github/workflows/ci-cd.yml` lance les tests E2E:

```yaml
e2e-tests:
  name: Tests E2E
  runs-on: ubuntu-latest
  needs: unit-tests

  steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Install Chrome
      uses: browser-actions/setup-chrome@latest

    - name: Install Dependencies
      run: |
        pip install -r tests/selenium/requirements.txt

    - name: Start Odoo
      run: |
        docker-compose up -d odoo
        sleep 30

    - name: Run E2E Tests
      run: |
        pytest tests/selenium/ -v -m smoke --html=report.html

    - name: Upload Screenshots on Failure
      if: failure()
      uses: actions/upload-artifact@v3
      with:
        name: test-screenshots
        path: tests/selenium/screenshots/
```

### Stratégie CI

**CI Rapide (Pull Request)**:
```bash
pytest tests/selenium/ -v -m smoke -n auto
```
- Seulement smoke tests
- Parallélisé
- ~5 minutes

**CI Complète (Push main)**:
```bash
pytest tests/selenium/ -v -n auto
```
- Tous les tests
- ~20 minutes

**Nightly Build**:
```bash
pytest tests/selenium/ -v -m "slow or integration"
```
- Tests lents et intégration
- ~1 heure

---

## 🐛 Troubleshooting

### Problème: "Element not found"

**Cause**: L'élément n'est pas encore chargé.

**Solution**:
```python
# ❌ Mauvais
element = driver.find_element(By.ID, 'my-id')

# ✅ Bon : attendre l'élément
page.wait_for_element((By.ID, 'my-id'))
element = driver.find_element(By.ID, 'my-id')
```

### Problème: "Element not clickable"

**Cause**: Élément caché par overlay, scroll nécessaire, etc.

**Solution**:
```python
# Option 1: Attendre qu'il soit cliquable
page.wait_for_element_clickable(locator)
page.click(locator)

# Option 2: Click JavaScript
page.click_with_js(locator)

# Option 3: Scroller vers élément
page.scroll_to_element(locator)
page.click(locator)
```

### Problème: "Stale element reference"

**Cause**: L'élément a été recréé (AJAX, page refresh).

**Solution**:
```python
# ❌ Mauvais
element = page.wait_for_element(locator)
# ... page refresh ...
element.click()  # Stale!

# ✅ Bon : refetch l'élément
element = page.wait_for_element(locator)
# ... page refresh ...
element = page.wait_for_element(locator)  # Re-fetch
element.click()
```

### Problème: Tests lents

**Solutions**:
- Utiliser `authenticated_driver` au lieu de `driver`
- Paralléliser: `pytest -n auto`
- Exclure tests lents: `pytest -m "not slow"`
- Augmenter implicit wait: `driver.implicitly_wait(15)`

### Problème: Flaky tests

**Causes communes**:
- Waits insuffisants
- Dépendances entre tests
- Données non nettoyées

**Solutions**:
- Utiliser waits explicites
- Isoler chaque test
- Fixtures de cleanup
- Relancer: `pytest --reruns 2`

---

## 📊 Rapports

### Rapport HTML

```bash
pytest tests/selenium/ -v --html=report.html --self-contained-html
```

Ouvrir `report.html` dans navigateur.

### Rapport JUnit (pour CI)

```bash
pytest tests/selenium/ -v --junitxml=junit-report.xml
```

### Rapport Allure (avancé)

```bash
# Générer résultats
pytest tests/selenium/ -v --alluredir=allure-results

# Servir rapport
allure serve allure-results
```

---

## 📚 Ressources

- **Selenium Docs**: https://www.selenium.dev/documentation/
- **Pytest Docs**: https://docs.pytest.org/
- **WebDriver Manager**: https://github.com/SergeyPirogov/webdriver_manager
- **POM Pattern**: https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/

---

## 🤝 Contribution

### Ajouter un nouveau test

1. **Créer Page Object** (si nécessaire):
```python
# tests/selenium/pages/my_module_page.py
from tests.selenium.pages.base_page import BasePage

class MyModulePage(BasePage):
    MY_ELEMENT = (By.ID, 'element-id')

    def my_action(self):
        self.click(self.MY_ELEMENT)
        return self
```

2. **Écrire test**:
```python
# tests/selenium/test_my_module.py
from tests.selenium.pages.my_module_page import MyModulePage

@pytest.mark.smoke
def test_my_feature(authenticated_driver):
    """Test: Ma nouvelle fonctionnalité"""
    page = MyModulePage(authenticated_driver)
    page.load()
    page.my_action()

    assert page.is_success()
```

3. **Lancer test**:
```bash
pytest tests/selenium/test_my_module.py::test_my_feature -v
```

4. **Ajouter aux markers si nécessaire**:
```python
@pytest.mark.slow
@pytest.mark.integration
def test_complex_feature(): ...
```

---

## 📞 Support

**Questions** : Ouvrir une issue GitHub
**Bugs** : Créer un ticket avec screenshots et logs

---

**✅ Happy Testing! 🧪**

*Documentation maintenue par l'équipe ISEB - Janvier 2025*
