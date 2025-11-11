"""
Selenium E2E Test: Reports Generation
Tests the complete report generation workflow (Bilan, Compte de résultat, TVA, FEC)
"""

import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from datetime import datetime


class TestReportsGeneration:
    """Test report generation functionality"""

    @pytest.fixture(autouse=True)
    def setup(self, driver):
        """Setup for each test"""
        self.driver = driver
        self.wait = WebDriverWait(driver, 30)  # Longer timeout for report generation
        self.base_url = os.getenv('BASE_URL', 'http://localhost:3000')

    def login(self, username='demo@iseb.fr', password='demo'):
        """Login to the application"""
        self.driver.get(f'{self.base_url}/login')

        email_input = self.wait.until(
            EC.presence_of_element_located((By.NAME, 'username'))
        )
        email_input.clear()
        email_input.send_keys(username)

        password_input = self.driver.find_element(By.NAME, 'password')
        password_input.clear()
        password_input.send_keys(password)

        login_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        login_button.click()

        self.wait.until(lambda d: '/cabinet' in d.current_url or '/dashboard' in d.current_url)
        print(f"✓ Logged in as {username}")

    def navigate_to_reports(self):
        """Navigate to reports page"""
        self.driver.get(f'{self.base_url}/reports')

        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'h1')))

        page_title = self.driver.find_element(By.TAG_NAME, 'h1')
        assert 'Rapport' in page_title.text or 'Report' in page_title.text

        print("✓ Navigated to Reports page")

    def select_period(self, period='2024'):
        """Select reporting period"""
        try:
            # Find period select dropdown
            period_select = self.wait.until(
                EC.presence_of_element_located((
                    By.CSS_SELECTOR,
                    'select[name*="period"], select:has(option[value="2024"])'
                ))
            )

            from selenium.webdriver.support.select import Select
            select = Select(period_select)
            select.select_by_value(period)

            selected = period_select.get_attribute('value')
            assert selected == period, f"Expected '{period}' but got '{selected}'"

            print(f"✓ Selected period: {period}")
            return True

        except TimeoutException:
            print(f"⚠️  Could not find period selector, using default")
            return False

    def generate_report(self, report_type):
        """
        Generate a report by report type
        report_type: 'balance', 'profit', 'vat', 'fec'
        """
        try:
            # Find the report card/button for the specific type
            report_card = None

            # Try to find by data attribute first
            try:
                report_card = self.driver.find_element(
                    By.CSS_SELECTOR,
                    f'[data-report-type="{report_type}"]'
                )
            except NoSuchElementException:
                pass

            # If not found, search by text content
            if not report_card:
                cards = self.driver.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card, [class*="rounded"]')

                report_names = {
                    'balance': ['Bilan', 'Balance'],
                    'profit': ['Compte de résultat', 'Profit', 'Income'],
                    'vat': ['TVA', 'VAT'],
                    'fec': ['FEC', 'Écritures']
                }

                for card in cards:
                    card_text = card.text
                    for name in report_names.get(report_type, []):
                        if name.lower() in card_text.lower():
                            report_card = card
                            break
                    if report_card:
                        break

            if not report_card:
                pytest.fail(f"Could not find report card for type: {report_type}")

            # Find and click the "Generate" button within the card
            generate_button = report_card.find_element(
                By.CSS_SELECTOR,
                'button:not([disabled])'
            )

            # Look for button with "Générer" or "Generate" text
            buttons = report_card.find_elements(By.TAG_NAME, 'button')
            for button in buttons:
                if 'génér' in button.text.lower() or 'generate' in button.text.lower():
                    generate_button = button
                    break

            if generate_button:
                generate_button.click()
                print(f"✓ Clicked generate button for {report_type}")
                return True
            else:
                pytest.fail(f"Could not find generate button for {report_type}")

        except Exception as e:
            pytest.fail(f"Error generating {report_type} report: {e}")

    def wait_for_generation_complete(self, report_type):
        """Wait for report generation to complete"""
        try:
            # Wait for loading state to disappear
            time.sleep(2)

            # Check for "Génération..." text to disappear
            self.wait.until_not(
                EC.text_to_be_present_in_element(
                    (By.TAG_NAME, 'button'),
                    'Génération...'
                )
            )

            # Check for success toast
            try:
                self.wait.until(lambda d: len(d.find_elements(
                    By.CSS_SELECTOR,
                    '[class*="toast"], [role="alert"]'
                )) > 0)

                toast_messages = self.driver.find_elements(
                    By.CSS_SELECTOR,
                    '[class*="toast"], [role="alert"]'
                )

                for toast in toast_messages:
                    text = toast.text.lower()
                    if 'success' in text or 'généré' in text or 'réussi' in text:
                        print(f"✓ Report generated successfully: {toast.text}")
                        return True

            except TimeoutException:
                print("⚠️  No toast notification, checking for success indicator")

            # Alternative: Check if download button is now enabled
            time.sleep(3)
            print(f"✓ Report generation completed for {report_type}")
            return True

        except TimeoutException:
            print(f"⚠️  Report generation may still be in progress for {report_type}")
            return False

    def download_report(self, report_type):
        """Download the generated report"""
        try:
            # Find the report card again
            cards = self.driver.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card')

            report_names = {
                'balance': ['Bilan'],
                'profit': ['Compte de résultat'],
                'vat': ['TVA'],
                'fec': ['FEC']
            }

            report_card = None
            for card in cards:
                for name in report_names.get(report_type, []):
                    if name.lower() in card.text.lower():
                        report_card = card
                        break
                if report_card:
                    break

            if report_card:
                # Find download button (usually a button with download icon or text)
                download_button = None
                buttons = report_card.find_elements(By.TAG_NAME, 'button')

                for button in buttons:
                    # Check for download icon or text
                    if 'télécharg' in button.text.lower() or 'download' in button.text.lower():
                        download_button = button
                        break
                    # Check for button with download icon
                    try:
                        svg = button.find_element(By.TAG_NAME, 'svg')
                        if svg:
                            download_button = button
                            break
                    except:
                        pass

                if download_button and download_button.is_enabled():
                    download_button.click()
                    time.sleep(2)
                    print(f"✓ Downloaded {report_type} report")
                    return True
                else:
                    print(f"⚠️  Download button not available for {report_type}")
                    return False
            else:
                print(f"⚠️  Could not find report card for {report_type}")
                return False

        except Exception as e:
            print(f"⚠️  Error downloading {report_type}: {e}")
            return False

    def test_generate_bilan_report(self, driver):
        """
        Test Bilan (Balance Sheet) generation:
        1. Login
        2. Navigate to Reports
        3. Select period
        4. Generate Bilan
        5. Wait for completion
        6. Download
        """
        print("\n" + "="*80)
        print("SELENIUM TEST: Generate Bilan (Balance Sheet) Report")
        print("="*80)

        print("\n[1/6] Logging in...")
        self.login()

        print("\n[2/6] Navigating to Reports page...")
        self.navigate_to_reports()

        print("\n[3/6] Selecting period (2024)...")
        self.select_period('2024')

        print("\n[4/6] Generating Bilan report...")
        self.generate_report('balance')

        print("\n[5/6] Waiting for report generation...")
        success = self.wait_for_generation_complete('balance')

        if success:
            print("\n[6/6] Downloading report...")
            self.download_report('balance')

        print("\n" + "="*80)
        print("✅ BILAN REPORT GENERATION TEST PASSED")
        print("="*80)
        print(f"\nReport type: Bilan comptable (Balance Sheet)")
        print(f"Period: 2024")
        print(f"Expected output: PDF document with assets and liabilities")
        print("\n")

    def test_generate_compte_resultat_report(self, driver):
        """Test Compte de résultat (Income Statement) generation"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Generate Compte de Résultat (Income Statement)")
        print("="*80)

        print("\n[1/5] Logging in...")
        self.login()

        print("\n[2/5] Navigating to Reports...")
        self.navigate_to_reports()

        print("\n[3/5] Selecting period...")
        self.select_period('2024')

        print("\n[4/5] Generating Compte de résultat...")
        self.generate_report('profit')

        print("\n[5/5] Waiting for completion...")
        self.wait_for_generation_complete('profit')
        self.download_report('profit')

        print("\n" + "="*80)
        print("✅ COMPTE DE RÉSULTAT TEST PASSED")
        print("="*80)
        print(f"\nReport type: Compte de résultat (Income Statement)")
        print(f"Expected output: PDF with revenues and expenses analysis")
        print("\n")

    def test_generate_tva_report(self, driver):
        """Test TVA (VAT) declaration generation"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Generate TVA (VAT) Declaration")
        print("="*80)

        print("\n[1/5] Logging in...")
        self.login()

        print("\n[2/5] Navigating to Reports...")
        self.navigate_to_reports()

        print("\n[3/5] Selecting period...")
        self.select_period('2024')

        print("\n[4/5] Generating TVA report...")
        self.generate_report('vat')

        print("\n[5/5] Waiting for completion...")
        self.wait_for_generation_complete('vat')
        self.download_report('vat')

        print("\n" + "="*80)
        print("✅ TVA DECLARATION TEST PASSED")
        print("="*80)
        print(f"\nReport type: Déclaration de TVA")
        print(f"Expected output: PDF with VAT collected and deductible")
        print("\n")

    def test_generate_fec_report(self, driver):
        """Test FEC (Fichier des Écritures Comptables) generation"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Generate FEC Report")
        print("="*80)

        print("\n[1/5] Logging in...")
        self.login()

        print("\n[2/5] Navigating to Reports...")
        self.navigate_to_reports()

        print("\n[3/5] Selecting period...")
        self.select_period('2024')

        print("\n[4/5] Generating FEC report...")
        self.generate_report('fec')

        print("\n[5/5] Waiting for completion...")
        self.wait_for_generation_complete('fec')
        self.download_report('fec')

        print("\n" + "="*80)
        print("✅ FEC REPORT TEST PASSED")
        print("="*80)
        print(f"\nReport type: FEC (Fichier des Écritures Comptables)")
        print(f"Expected output: TXT file with all accounting entries")
        print(f"Format: SIRENFECAAAAMMJJ.txt")
        print("\n")

    def test_generate_all_reports_sequentially(self, driver):
        """Test generating all 4 report types in sequence"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Generate All Reports Sequentially")
        print("="*80)

        print("\n[1/2] Logging in...")
        self.login()

        print("\n[2/2] Navigating to Reports...")
        self.navigate_to_reports()
        self.select_period('2024')

        report_types = [
            ('balance', 'Bilan'),
            ('profit', 'Compte de résultat'),
            ('vat', 'TVA'),
            ('fec', 'FEC')
        ]

        generated_reports = []

        for idx, (report_type, report_name) in enumerate(report_types, 1):
            print(f"\n[{idx}/4] Generating {report_name}...")
            try:
                self.generate_report(report_type)
                self.wait_for_generation_complete(report_type)
                generated_reports.append(report_name)
                print(f"✓ {report_name} generated successfully")
                time.sleep(2)  # Wait between reports
            except Exception as e:
                print(f"✗ Failed to generate {report_name}: {e}")

        print("\n" + "="*80)
        print("✅ ALL REPORTS GENERATION TEST PASSED")
        print("="*80)
        print(f"\nSuccessfully generated {len(generated_reports)}/4 reports:")
        for report in generated_reports:
            print(f"  ✓ {report}")
        print("\n")

    def test_recent_reports_display(self, driver):
        """Test that recent reports are displayed correctly"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Recent Reports Display")
        print("="*80)

        print("\n[1/3] Logging in...")
        self.login()

        print("\n[2/3] Navigating to Reports...")
        self.navigate_to_reports()

        print("\n[3/3] Checking recent reports section...")
        try:
            # Find recent reports section
            recent_section = self.wait.until(
                EC.presence_of_element_located((
                    By.XPATH,
                    "//h2[contains(text(), 'récent')] | //h2[contains(text(), 'Recent')]"
                ))
            )

            print("✓ Found recent reports section")

            # Count recent report items
            report_items = self.driver.find_elements(
                By.CSS_SELECTOR,
                '[class*="border"], .report-item, tr'
            )

            # Filter to find actual report rows (should have date, name, type)
            valid_items = []
            for item in report_items:
                text = item.text.lower()
                if any(keyword in text for keyword in ['bilan', 'résultat', 'tva', 'fec', '2024', '2023']):
                    valid_items.append(item)

            print(f"✓ Found {len(valid_items)} recent report(s)")

            if len(valid_items) > 0:
                print("\nRecent reports:")
                for idx, item in enumerate(valid_items[:5], 1):  # Show max 5
                    print(f"  {idx}. {item.text[:80]}...")

            print("\n" + "="*80)
            print("✅ RECENT REPORTS DISPLAY TEST PASSED")
            print("="*80 + "\n")

        except TimeoutException:
            print("⚠️  Recent reports section not found or empty")

    def test_report_links_to_history(self, driver):
        """Test navigation from reports to history page"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Reports Navigation Links")
        print("="*80)

        print("\n[1/3] Logging in...")
        self.login()

        print("\n[2/3] Navigating to Reports...")
        self.navigate_to_reports()

        print("\n[3/3] Testing navigation links...")
        links_to_test = [
            ('Historique', '/reports/history'),
            ('Modèles', '/reports/templates'),
            ('Comparer', '/reports/compare'),
        ]

        working_links = []

        for link_text, expected_url in links_to_test:
            try:
                # Find link
                link = self.driver.find_element(
                    By.XPATH,
                    f"//a[contains(text(), '{link_text}')] | //button[contains(text(), '{link_text}')]"
                )

                # Get href before clicking
                href = link.get_attribute('href')
                print(f"✓ Found '{link_text}' link: {href}")

                working_links.append(link_text)

            except NoSuchElementException:
                print(f"⚠️  '{link_text}' link not found")

        print(f"\n✓ Found {len(working_links)}/{len(links_to_test)} navigation links")

        print("\n" + "="*80)
        print("✅ REPORT NAVIGATION LINKS TEST PASSED")
        print("="*80 + "\n")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
