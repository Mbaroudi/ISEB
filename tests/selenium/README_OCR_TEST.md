# ISEB OCR Invoice Extraction - Selenium E2E Test

Test automatisé end-to-end pour valider le workflow complet d'extraction OCR de factures avec Tesseract.

## 🎯 Ce que le test valide

1. **Création d'une facture test** - Génération d'une image de facture avec données structurées
2. **Authentification** - Login sur l'interface ISEB
3. **Upload de document** - Upload de la facture via l'interface web
4. **Extraction OCR** - Déclenchement de l'OCR via le bouton UI
5. **Vérification des données** - Validation des champs extraits (N°, date, montants, fournisseur)
6. **Application des données** - Application des données OCR au document

## 🔧 Prérequis

### 1. Backend (Odoo + Tesseract)
```bash
# Vérifier que Tesseract est installé dans le container Odoo
docker exec iseb_odoo tesseract --version

# Si non installé:
docker exec -u root iseb_odoo apt-get update
docker exec -u root iseb_odoo apt-get install -y tesseract-ocr tesseract-ocr-fra
docker exec iseb_odoo pip3 install pytesseract Pillow
```

### 2. Frontend (Next.js)
```bash
# Vérifier que le frontend tourne sur http://localhost:3000
curl http://localhost:3000
```

### 3. Dépendances Python
```bash
cd /Users/malek/ISEB/ISEB
pip install -r tests/selenium/requirements.txt
```

Les dépendances incluent:
- `selenium==4.15.2` - WebDriver
- `pytest==7.4.3` - Framework de test
- `Pillow==10.1.0` - Génération d'images de test
- `webdriver-manager==4.0.1` - Gestion automatique des drivers

## 🚀 Lancement des tests

### Test complet du workflow OCR
```bash
# Depuis la racine du projet
pytest tests/selenium/test_ocr_invoice.py -v -s

# Avec mode headless (sans interface graphique)
HEADLESS=true pytest tests/selenium/test_ocr_invoice.py -v -s

# Avec rapport HTML
pytest tests/selenium/test_ocr_invoice.py -v -s --html=report_ocr.html --self-contained-html
```

### Tests individuels
```bash
# Test complet du workflow
pytest tests/selenium/test_ocr_invoice.py::TestOCRInvoiceExtraction::test_complete_ocr_workflow -v -s

# Test visibilité du bouton OCR
pytest tests/selenium/test_ocr_invoice.py::TestOCRInvoiceExtraction::test_ocr_button_visibility -v -s

# Test gestion d'erreurs OCR
pytest tests/selenium/test_ocr_invoice.py::TestOCRInvoiceExtraction::test_ocr_error_handling -v -s
```

## 📋 Structure du test

### `test_complete_ocr_workflow()`
**Durée**: ~30-60 secondes

**Étapes**:
1. Créer une facture test (image PNG 800x1000px avec texte structuré)
2. Login avec `demo@iseb.fr` / `demo`
3. Navigation vers `/documents`
4. Upload de la facture
5. Clic sur le bouton OCR (icône `Scan` violette)
6. Attente du modal de résultats OCR
7. Vérification des champs extraits:
   - N° Facture: `FAC-2024-001`
   - Date: `15/01/2024`
   - Fournisseur: `Entreprise Test SARL`
   - SIRET: `12345678901234`
   - Montant HT: `1000.00 EUR`
   - TVA 20%: `200.00 EUR`
   - Total TTC: `1200.00 EUR`
8. Application des données au document

**Assertions**:
- ✅ Modal OCR s'affiche dans les 20 secondes
- ✅ Au moins 3 champs extraits
- ✅ Champs attendus présents (Facture, Date, Total, TTC)
- ✅ Données appliquées sans erreur

### `test_ocr_button_visibility()`
**Durée**: ~15 secondes

**Vérifie**:
- Bouton OCR visible uniquement pour PDF/images
- Bouton a la bonne couleur (purple-600)
- Bouton est clickable
- Attribut `data-testid="ocr-button-{id}"` présent

### `test_ocr_error_handling()`
**Durée**: ~20 secondes

**Vérifie**:
- Gestion des documents vides/blancs
- Messages d'erreur affichés
- Toast notifications correctes
- Pas de crash de l'application

## 🎨 Facture de test générée

Le test crée dynamiquement une facture PNG contenant:

```
FACTURE

Entreprise Test SARL
123 Rue de la Paix
75001 Paris
SIRET: 12345678901234

Facture N°: FAC-2024-001
Date: 15/01/2024
Date d'échéance: 15/02/2024

─────────────────────────────────────────
Description                      Montant
─────────────────────────────────────────
Prestation de services        1000.00 EUR

─────────────────────────────────────────
Montant HT:                   1000.00 EUR
TVA 20%:                       200.00 EUR
═════════════════════════════════════════
Total TTC:                    1200.00 EUR
```

Tesseract devrait extraire ~85-90% de ces données avec un score de confiance de 70-90%.

## 📊 Résultats attendus

### ✅ Test PASS (succès)
```
========================= SELENIUM TEST =========================
SELENIUM TEST: Complete OCR Invoice Extraction Workflow
================================================================

[1/7] Creating test invoice image...
✓ Created test invoice image (45231 bytes)

[2/7] Logging in...
✓ Logged in as demo@iseb.fr

[3/7] Navigating to documents page...
✓ Navigated to Documents page

[4/7] Uploading invoice...
✓ Invoice uploaded successfully

[5/7] Finding uploaded document and clicking OCR button...
✓ Found 1 document(s)
✓ Clicked OCR extraction button

[6/7] Waiting for OCR extraction and results...
✓ OCR result modal appeared

[7/7] Verifying extracted OCR data...
  N° Facture: FAC-2024-001
  Date: 15/01/2024
  Fournisseur: Entreprise Test SARL
  SIRET: 12345678901234
  Montant HT: 1000.00
  TVA: 200.00
  Total TTC: 1200.00
  Confiance: 87%
✓ Extracted 8 fields
✓ Found expected fields: ['Facture', 'Date', 'Total', 'TTC']

[8/7] Applying OCR data to document...
✓ Applied OCR data to document

================================================================
✅ OCR WORKFLOW TEST PASSED
================================================================

Extracted 8 data fields:
  • N° Facture: FAC-2024-001
  • Date: 15/01/2024
  • Fournisseur: Entreprise Test SARL
  • SIRET: 12345678901234
  • Montant HT: 1000.00
  • TVA: 200.00
  • Total TTC: 1200.00
  • Confiance: 87%

======================= 1 passed in 45.23s =======================
```

### ❌ Test FAIL (échec)

**Scénarios d'échec possibles**:

1. **Tesseract non installé**:
```
⚠️  OCR button not found - checking if Tesseract is installed
SKIPPED [1] - OCR button not available - Tesseract may not be configured
```

2. **Frontend non accessible**:
```
ERROR - Could not connect to http://localhost:3000
```

3. **Timeout OCR**:
```
FAILED - OCR result modal did not appear within timeout (20s)
```

4. **Données mal extraites**:
```
FAILED - Expected field 'Total TTC' not found in extracted data
```

## 🐛 Debugging

### Voir les logs en temps réel
```bash
pytest tests/selenium/test_ocr_invoice.py -v -s --log-cli-level=DEBUG
```

### Capturer des screenshots
Les screenshots sont automatiquement capturés en cas d'échec dans:
```
tests/selenium/screenshots/FAILED_test_complete_ocr_workflow_20241110_153045.png
```

### Mode non-headless (voir le navigateur)
```bash
HEADLESS=false pytest tests/selenium/test_ocr_invoice.py -v -s
```

### Vérifier l'API OCR backend
```bash
# Test direct de l'API OCR
curl -X POST http://localhost:8070/my/document/ocr \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data"}'
```

## 🔧 Configuration

### Variables d'environnement

```bash
# URL du frontend
export TEST_BASE_URL=http://localhost:3000

# Mode headless
export HEADLESS=true

# Credentials de test
export TEST_USER=demo@iseb.fr
export TEST_USER_PASSWORD=demo

# Timeout personnalisé (secondes)
export SELENIUM_TIMEOUT=30
```

### Fichier `.env` (optionnel)
```bash
# tests/selenium/.env
TEST_BASE_URL=http://localhost:3000
HEADLESS=false
TEST_USER=demo@iseb.fr
TEST_USER_PASSWORD=demo
```

## 📈 Performance

- **Test complet**: ~30-60s
- **Upload document**: ~2-5s
- **Extraction OCR**: ~10-20s (dépend de Tesseract)
- **Application données**: ~1-2s

**Note**: Le premier run peut être plus lent (téléchargement ChromeDriver).

## 🎯 CI/CD Integration

### GitHub Actions
```yaml
name: Selenium OCR Tests

on: [push, pull_request]

jobs:
  test-ocr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Tesseract
        run: |
          sudo apt-get update
          sudo apt-get install -y tesseract-ocr tesseract-ocr-fra
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r tests/selenium/requirements.txt
      
      - name: Start services
        run: |
          docker-compose up -d
          sleep 30  # Wait for services
      
      - name: Run OCR tests
        run: |
          HEADLESS=true pytest tests/selenium/test_ocr_invoice.py -v --html=report.html
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: selenium-report
          path: report.html
```

## 📚 Ressources

- [Selenium Python Docs](https://selenium-python.readthedocs.io/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Tesseract OCR Documentation](https://tesseract-ocr.github.io/)
- [ISEB OCR Backend Code](/addons/client_portal/models/document_ocr.py)
- [ISEB OCR Controller](/addons/client_portal/controllers/ocr.py)

## 🆘 Support

En cas de problème:
1. Vérifier que tous les services sont démarrés (`docker-compose ps`)
2. Vérifier Tesseract: `docker exec iseb_odoo tesseract --version`
3. Vérifier le frontend: `curl http://localhost:3000`
4. Consulter les logs: `docker-compose logs odoo frontend`
5. Lancer en mode debug: `pytest tests/selenium/test_ocr_invoice.py -v -s --pdb`
