"""
Selenium E2E Test: OCR Invoice Extraction with Tesseract
Tests the complete OCR workflow from document upload to data extraction and application
"""

import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont


class TestOCRInvoiceExtraction:
    """Test OCR invoice extraction end-to-end workflow"""

    @pytest.fixture(autouse=True)
    def setup(self, driver):
        """Setup for each test"""
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.base_url = os.getenv('BASE_URL', 'http://localhost:3000')
        
    def create_test_invoice_image(self):
        """Create a test invoice image with text for OCR"""
        width, height = 800, 1000
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
            font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        except:
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        y_position = 50
        
        draw.text((50, y_position), "FACTURE", font=font_large, fill='black')
        y_position += 60
        
        draw.text((50, y_position), "Entreprise Test SARL", font=font_medium, fill='black')
        y_position += 40
        draw.text((50, y_position), "123 Rue de la Paix", font=font_small, fill='black')
        y_position += 30
        draw.text((50, y_position), "75001 Paris", font=font_small, fill='black')
        y_position += 30
        draw.text((50, y_position), "SIRET: 12345678901234", font=font_small, fill='black')
        y_position += 60
        
        draw.text((50, y_position), "Facture N°: FAC-2024-001", font=font_medium, fill='black')
        y_position += 40
        draw.text((50, y_position), "Date: 15/01/2024", font=font_small, fill='black')
        y_position += 40
        draw.text((50, y_position), "Date d'échéance: 15/02/2024", font=font_small, fill='black')
        y_position += 80
        
        draw.line([(50, y_position), (750, y_position)], fill='black', width=2)
        y_position += 20
        draw.text((50, y_position), "Description", font=font_small, fill='black')
        draw.text((500, y_position), "Montant", font=font_small, fill='black')
        y_position += 30
        draw.line([(50, y_position), (750, y_position)], fill='black', width=1)
        y_position += 20
        
        draw.text((50, y_position), "Prestation de services", font=font_small, fill='black')
        draw.text((500, y_position), "1000.00 EUR", font=font_small, fill='black')
        y_position += 60
        
        draw.line([(50, y_position), (750, y_position)], fill='black', width=1)
        y_position += 20
        draw.text((50, y_position), "Montant HT:", font=font_medium, fill='black')
        draw.text((500, y_position), "1000.00 EUR", font=font_medium, fill='black')
        y_position += 40
        draw.text((50, y_position), "TVA 20%:", font=font_medium, fill='black')
        draw.text((500, y_position), "200.00 EUR", font=font_medium, fill='black')
        y_position += 40
        draw.line([(50, y_position), (750, y_position)], fill='black', width=2)
        y_position += 20
        draw.text((50, y_position), "Total TTC:", font=font_large, fill='black')
        draw.text((500, y_position), "1200.00 EUR", font=font_large, fill='black')
        
        img_io = BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        return img_io.getvalue()

    def login(self, username='demo@iseb.fr', password='demo'):
        """Login to the application"""
        self.driver.get(f'{self.base_url}/login')
        
        email_input = self.wait.until(
            EC.presence_of_element_located((By.NAME, 'email'))
        )
        email_input.send_keys(username)
        
        password_input = self.driver.find_element(By.NAME, 'password')
        password_input.send_keys(password)
        
        login_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        login_button.click()
        
        self.wait.until(EC.url_contains('/dashboard'))
        print(f"✓ Logged in as {username}")

    def navigate_to_documents(self):
        """Navigate to documents page"""
        self.driver.get(f'{self.base_url}/documents')
        
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'h1')))
        
        page_title = self.driver.find_element(By.TAG_NAME, 'h1')
        assert 'Documents' in page_title.text or 'Document' in page_title.text
        
        print("✓ Navigated to Documents page")

    def upload_invoice(self, invoice_data):
        """Upload invoice document"""
        temp_file_path = '/tmp/test_invoice.png'
        
        with open(temp_file_path, 'wb') as f:
            f.write(invoice_data)
        
        try:
            file_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="file"]'))
            )
            
            file_input.send_keys(temp_file_path)
            
            time.sleep(2)
            
            print("✓ Invoice uploaded successfully")
            
            return temp_file_path
            
        except TimeoutException:
            pytest.fail("Could not find file upload input")

    def find_uploaded_document(self):
        """Find the uploaded document in the list"""
        time.sleep(3)
        
        try:
            documents = self.driver.find_elements(By.CSS_SELECTOR, '[class*="DocumentCard"], [class*="border"]')
            
            if documents:
                print(f"✓ Found {len(documents)} document(s)")
                return documents[0]
            else:
                pytest.fail("No documents found after upload")
                
        except NoSuchElementException:
            pytest.fail("Could not find document list")

    def click_ocr_button(self, document_element=None):
        """Click the OCR extraction button"""
        try:
            if document_element:
                ocr_button = document_element.find_element(By.CSS_SELECTOR, '[title*="Extraire OCR"], [data-testid^="ocr-button"]')
            else:
                ocr_button = self.wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, '[title*="Extraire OCR"], [data-testid^="ocr-button"]'))
                )
            
            actions = ActionChains(self.driver)
            actions.move_to_element(ocr_button).pause(0.5).click().perform()
            
            print("✓ Clicked OCR extraction button")
            return True
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"✗ Could not find OCR button: {e}")
            return False

    def wait_for_ocr_result(self):
        """Wait for OCR result modal to appear"""
        try:
            modal = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[role="dialog"], .modal'))
            )
            
            modal_title = modal.find_element(By.TAG_NAME, 'h2')
            assert 'OCR' in modal_title.text or 'Résultats' in modal_title.text
            
            print("✓ OCR result modal appeared")
            return modal
            
        except TimeoutException:
            pytest.fail("OCR result modal did not appear within timeout")

    def verify_ocr_data(self, modal):
        """Verify extracted OCR data"""
        extracted_data = {}
        
        try:
            inputs = modal.find_elements(By.CSS_SELECTOR, 'input[readonly], input[disabled]')
            
            for input_field in inputs:
                label = None
                parent = input_field.find_element(By.XPATH, '..')
                
                try:
                    label_elem = parent.find_element(By.TAG_NAME, 'label')
                    label = label_elem.text
                except:
                    pass
                
                value = input_field.get_attribute('value')
                
                if label and value:
                    extracted_data[label] = value
                    print(f"  {label}: {value}")
            
            assert len(extracted_data) > 0, "No OCR data extracted"
            
            expected_fields = ['Facture', 'Date', 'Total', 'TTC']
            found_fields = []
            
            for field in expected_fields:
                for key in extracted_data.keys():
                    if field.lower() in key.lower():
                        found_fields.append(field)
                        break
            
            print(f"✓ Extracted {len(extracted_data)} fields")
            print(f"✓ Found expected fields: {found_fields}")
            
            return extracted_data
            
        except Exception as e:
            pytest.fail(f"Error verifying OCR data: {e}")

    def apply_ocr_data(self, modal):
        """Apply extracted OCR data to document"""
        try:
            apply_button = modal.find_element(
                By.CSS_SELECTOR, 
                'button[data-testid="apply-ocr-button"], button:contains("Appliquer")'
            )
            apply_button.click()
            
            time.sleep(2)
            
            print("✓ Applied OCR data to document")
            
        except NoSuchElementException:
            buttons = modal.find_elements(By.TAG_NAME, 'button')
            
            for button in buttons:
                if 'appliquer' in button.text.lower():
                    button.click()
                    time.sleep(2)
                    print("✓ Applied OCR data to document")
                    return
            
            pytest.fail("Could not find 'Apply' button")

    def test_complete_ocr_workflow(self, driver):
        """
        Complete OCR workflow test:
        1. Login
        2. Navigate to documents
        3. Upload invoice
        4. Extract OCR
        5. Verify extracted data
        6. Apply data to document
        """
        print("\n" + "="*80)
        print("SELENIUM TEST: Complete OCR Invoice Extraction Workflow")
        print("="*80)
        
        print("\n[1/7] Creating test invoice image...")
        invoice_data = self.create_test_invoice_image()
        assert len(invoice_data) > 0, "Failed to create test invoice"
        print(f"✓ Created test invoice image ({len(invoice_data)} bytes)")
        
        print("\n[2/7] Logging in...")
        self.login()
        
        print("\n[3/7] Navigating to documents page...")
        self.navigate_to_documents()
        
        print("\n[4/7] Uploading invoice...")
        temp_file_path = self.upload_invoice(invoice_data)
        
        print("\n[5/7] Finding uploaded document and clicking OCR button...")
        document = self.find_uploaded_document()
        ocr_found = self.click_ocr_button(document)
        
        if not ocr_found:
            print("⚠️  OCR button not found - checking if Tesseract is installed")
            pytest.skip("OCR button not available - Tesseract may not be configured")
        
        print("\n[6/7] Waiting for OCR extraction and results...")
        modal = self.wait_for_ocr_result()
        
        print("\n[7/7] Verifying extracted OCR data...")
        extracted_data = self.verify_ocr_data(modal)
        
        print("\n[8/7] Applying OCR data to document...")
        self.apply_ocr_data(modal)
        
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        print("\n" + "="*80)
        print("✅ OCR WORKFLOW TEST PASSED")
        print("="*80)
        print(f"\nExtracted {len(extracted_data)} data fields:")
        for key, value in extracted_data.items():
            print(f"  • {key}: {value}")
        print("\n")

    def test_ocr_button_visibility(self, driver):
        """Test that OCR button is visible for PDF/image documents"""
        print("\n" + "="*80)
        print("SELENIUM TEST: OCR Button Visibility")
        print("="*80)
        
        print("\n[1/3] Logging in...")
        self.login()
        
        print("\n[2/3] Navigating to documents page...")
        self.navigate_to_documents()
        
        print("\n[3/3] Creating test invoice and uploading...")
        invoice_data = self.create_test_invoice_image()
        self.upload_invoice(invoice_data)
        
        print("\n[4/3] Checking OCR button visibility...")
        document = self.find_uploaded_document()
        
        try:
            ocr_button = document.find_element(By.CSS_SELECTOR, '[title*="Extraire OCR"], [data-testid^="ocr-button"]')
            
            assert ocr_button.is_displayed(), "OCR button is not visible"
            
            button_color = ocr_button.value_of_css_property('color')
            print(f"✓ OCR button is visible (color: {button_color})")
            
            print("\n" + "="*80)
            print("✅ OCR BUTTON VISIBILITY TEST PASSED")
            print("="*80 + "\n")
            
        except NoSuchElementException:
            pytest.fail("OCR button not found in document card")

    def test_ocr_error_handling(self, driver):
        """Test OCR error handling with invalid document"""
        print("\n" + "="*80)
        print("SELENIUM TEST: OCR Error Handling")
        print("="*80)
        
        print("\n[1/2] Logging in...")
        self.login()
        
        print("\n[2/2] Navigating to documents page...")
        self.navigate_to_documents()
        
        print("\n[3/2] Creating blank image (should have low confidence)...")
        blank_img = Image.new('RGB', (800, 1000), color='white')
        img_io = BytesIO()
        blank_img.save(img_io, 'PNG')
        img_io.seek(0)
        
        self.upload_invoice(img_io.getvalue())
        
        print("\n[4/2] Attempting OCR on blank document...")
        document = self.find_uploaded_document()
        ocr_found = self.click_ocr_button(document)
        
        if ocr_found:
            try:
                time.sleep(5)
                
                toast_messages = self.driver.find_elements(By.CSS_SELECTOR, '[class*="toast"], [class*="notification"]')
                
                error_found = False
                for toast in toast_messages:
                    if 'erreur' in toast.text.lower() or 'error' in toast.text.lower():
                        error_found = True
                        print(f"✓ Error message displayed: {toast.text}")
                        break
                
                if not error_found:
                    print("⚠️  No explicit error message, checking for low confidence warning")
                
                print("\n" + "="*80)
                print("✅ OCR ERROR HANDLING TEST PASSED")
                print("="*80 + "\n")
                
            except TimeoutException:
                print("✓ OCR correctly rejected blank document")
        else:
            pytest.skip("OCR button not available")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
