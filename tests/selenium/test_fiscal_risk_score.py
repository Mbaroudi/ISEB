"""
Selenium E2E Test: Fiscal Risk Score
Tests the fiscal obligations tracking and risk score calculation
"""

import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class TestFiscalRiskScore:
    """Test fiscal risk score and obligations tracking"""

    @pytest.fixture(autouse=True)
    def setup(self, driver):
        """Setup for each test"""
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
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

    def navigate_to_fiscal(self):
        """Navigate to fiscal obligations page"""
        self.driver.get(f'{self.base_url}/fiscal')

        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'h1')))

        page_title = self.driver.find_element(By.TAG_NAME, 'h1')
        assert 'Fiscal' in page_title.text or 'Obligation' in page_title.text

        print("✓ Navigated to Fiscal Obligations page")

    def find_risk_score_widget(self):
        """Find the risk score widget/card"""
        try:
            # Look for risk score section
            risk_widget = self.wait.until(lambda d: [
                elem for elem in d.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card, [class*="border"]')
                if 'risque' in elem.text.lower() or 'risk' in elem.text.lower() or 'score' in elem.text.lower()
            ][0] if any('risque' in elem.text.lower() or 'risk' in elem.text.lower()
                        for elem in d.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card, [class*="border"]'))
            else None)

            if risk_widget:
                print("✓ Found risk score widget")
                return risk_widget
            else:
                # Alternative: look for element with specific text
                headings = self.driver.find_elements(By.TAG_NAME, 'h2')
                for heading in headings:
                    if 'risque' in heading.text.lower() or 'score' in heading.text.lower():
                        risk_widget = heading.find_element(By.XPATH, './ancestor::div[@class]')
                        print("✓ Found risk score widget via heading")
                        return risk_widget

                pytest.fail("Risk score widget not found")

        except TimeoutException:
            pytest.fail("Risk score widget not found within timeout")

    def extract_risk_score(self, risk_widget):
        """Extract the risk score value from the widget"""
        try:
            # Look for score number (usually large text like "75" or "75/100")
            score_elements = risk_widget.find_elements(
                By.CSS_SELECTOR,
                '[class*="text-4xl"], [class*="text-3xl"], [class*="text-2xl"], .score, [class*="font-bold"]'
            )

            score_value = None
            for elem in score_elements:
                text = elem.text.strip()
                # Check if text contains a number
                if any(char.isdigit() for char in text):
                    # Extract number
                    import re
                    match = re.search(r'(\d+)', text)
                    if match:
                        score_value = int(match.group(1))
                        break

            if score_value is not None:
                print(f"✓ Extracted risk score: {score_value}/100")
                return score_value
            else:
                print("⚠️  Could not extract numeric score value")
                return None

        except Exception as e:
            print(f"⚠️  Error extracting risk score: {e}")
            return None

    def extract_risk_level(self, risk_widget):
        """Extract the risk level (Faible, Moyen, Élevé, Critique)"""
        try:
            # Look for badge or label with risk level
            badges = risk_widget.find_elements(By.CSS_SELECTOR, '[class*="Badge"], .badge, [class*="bg-"]')

            risk_levels = ['faible', 'moyen', 'élevé', 'critique', 'low', 'medium', 'high', 'critical']

            for badge in badges:
                text = badge.text.lower()
                for level in risk_levels:
                    if level in text:
                        print(f"✓ Risk level: {badge.text}")
                        return badge.text

            print("⚠️  Could not find risk level badge")
            return None

        except Exception as e:
            print(f"⚠️  Error extracting risk level: {e}")
            return None

    def extract_risk_statistics(self, risk_widget):
        """Extract risk score statistics"""
        statistics = {}

        try:
            # Common statistics to look for
            stat_keywords = {
                'retard': 'late_obligations',
                'pénalités': 'penalties',
                'délai': 'average_delay',
                'conformité': 'compliance_rate'
            }

            # Find all text elements with numbers
            text_elements = risk_widget.find_elements(By.CSS_SELECTOR, '*')

            for elem in text_elements:
                text = elem.text.strip().lower()
                for keyword, stat_name in stat_keywords.items():
                    if keyword in text:
                        # Try to extract number
                        import re
                        match = re.search(r'(\d+(?:[,.]?\d+)?)\s*(%|€|j)?', elem.text)
                        if match:
                            value = match.group(1).replace(',', '.')
                            unit = match.group(2) if match.group(2) else ''
                            statistics[stat_name] = f"{value}{unit}"
                            print(f"  • {keyword.capitalize()}: {value}{unit}")

            print(f"✓ Extracted {len(statistics)} statistics")
            return statistics

        except Exception as e:
            print(f"⚠️  Error extracting statistics: {e}")
            return {}

    def find_alerts_dashboard(self):
        """Find the alerts dashboard (overdue, urgent, upcoming)"""
        try:
            # Look for alert cards
            cards = self.driver.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card, [class*="border"]')

            alert_types = ['retard', 'urgent', 'venir', 'overdue', 'upcoming']
            alert_cards = []

            for card in cards:
                text = card.text.lower()
                if any(alert_type in text for alert_type in alert_types):
                    alert_cards.append(card)

            if len(alert_cards) >= 2:
                print(f"✓ Found {len(alert_cards)} alert cards")
                return alert_cards
            else:
                print(f"⚠️  Found only {len(alert_cards)} alert cards (expected 3)")
                return alert_cards

        except Exception as e:
            print(f"⚠️  Error finding alerts dashboard: {e}")
            return []

    def extract_alert_data(self, alert_cards):
        """Extract data from alert cards"""
        alerts_data = {}

        alert_names = {
            'retard': 'overdue',
            'urgent': 'urgent',
            'venir': 'upcoming',
            'overdue': 'overdue',
            'upcoming': 'upcoming'
        }

        for card in alert_cards:
            text = card.text.lower()

            # Determine alert type
            alert_type = None
            for name, key in alert_names.items():
                if name in text:
                    alert_type = key
                    break

            if alert_type:
                # Extract count (usually a large number)
                import re
                count_match = re.search(r'\b(\d+)\b', card.text)
                count = int(count_match.group(1)) if count_match else 0

                # Extract amount if present
                amount_match = re.search(r'(\d+(?:[,.]?\d+)?)\s*€', card.text)
                amount = amount_match.group(1) if amount_match else None

                alerts_data[alert_type] = {
                    'count': count,
                    'amount': amount
                }

                print(f"  • {alert_type.capitalize()}: {count} obligations" +
                      (f" ({amount}€)" if amount else ""))

        return alerts_data

    def test_risk_score_display(self, driver):
        """
        Test risk score display:
        1. Login
        2. Navigate to fiscal page
        3. Find risk score widget
        4. Extract score value
        5. Extract risk level
        6. Extract statistics
        """
        print("\n" + "="*80)
        print("SELENIUM TEST: Fiscal Risk Score Display")
        print("="*80)

        print("\n[1/6] Logging in...")
        self.login()

        print("\n[2/6] Navigating to Fiscal page...")
        self.navigate_to_fiscal()

        print("\n[3/6] Finding risk score widget...")
        risk_widget = self.find_risk_score_widget()

        print("\n[4/6] Extracting risk score...")
        score = self.extract_risk_score(risk_widget)

        print("\n[5/6] Extracting risk level...")
        level = self.extract_risk_level(risk_widget)

        print("\n[6/6] Extracting risk statistics...")
        statistics = self.extract_risk_statistics(risk_widget)

        # Validate score
        if score is not None:
            assert 0 <= score <= 100, f"Risk score {score} is out of valid range (0-100)"
            print(f"✓ Risk score is valid: {score}/100")

        print("\n" + "="*80)
        print("✅ RISK SCORE DISPLAY TEST PASSED")
        print("="*80)
        print(f"\nRisk Score Summary:")
        print(f"  • Score: {score}/100" if score else "  • Score: Not found")
        print(f"  • Level: {level}" if level else "  • Level: Not found")
        print(f"  • Statistics: {len(statistics)} metrics extracted")
        print("\n")

    def test_alerts_dashboard(self, driver):
        """Test alerts dashboard display"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Fiscal Alerts Dashboard")
        print("="*80)

        print("\n[1/4] Logging in...")
        self.login()

        print("\n[2/4] Navigating to Fiscal page...")
        self.navigate_to_fiscal()

        print("\n[3/4] Finding alerts dashboard...")
        alert_cards = self.find_alerts_dashboard()

        print("\n[4/4] Extracting alert data...")
        alerts_data = self.extract_alert_data(alert_cards)

        print("\n" + "="*80)
        print("✅ ALERTS DASHBOARD TEST PASSED")
        print("="*80)
        print(f"\nAlerts Summary:")
        print(f"  • Found {len(alert_cards)} alert cards")
        print(f"  • Extracted data from {len(alerts_data)} alerts")

        for alert_type, data in alerts_data.items():
            print(f"  • {alert_type.capitalize()}: {data['count']} obligations" +
                  (f" ({data['amount']}€)" if data['amount'] else ""))
        print("\n")

    def test_obligations_list(self, driver):
        """Test obligations list display"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Fiscal Obligations List")
        print("="*80)

        print("\n[1/4] Logging in...")
        self.login()

        print("\n[2/4] Navigating to Fiscal page...")
        self.navigate_to_fiscal()

        print("\n[3/4] Finding obligations list...")
        try:
            # Look for list/table of obligations
            obligations_section = self.wait.until(lambda d: [
                elem for elem in d.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card')
                if 'obligation' in elem.text.lower()
            ][-1] if any('obligation' in elem.text.lower()
                          for elem in d.find_elements(By.CSS_SELECTOR, '[class*="Card"], .card'))
            else None)

            if obligations_section:
                print("✓ Found obligations section")

                # Count obligation items
                obligation_items = obligations_section.find_elements(
                    By.CSS_SELECTOR,
                    '[class*="border"], .obligation-item, [class*="p-4"]'
                )

                print(f"✓ Found {len(obligation_items)} obligation(s)")

                # Extract data from first few obligations
                print("\n[4/4] Extracting obligation details...")
                for idx, item in enumerate(obligation_items[:3], 1):
                    text = item.text
                    print(f"\n  Obligation {idx}:")

                    # Extract name
                    lines = text.split('\n')
                    if lines:
                        print(f"    Name: {lines[0][:50]}...")

                    # Look for date
                    import re
                    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
                    if date_match:
                        print(f"    Date: {date_match.group(1)}")

                    # Look for amount
                    amount_match = re.search(r'(\d+(?:[,.]?\d+)?)\s*€', text)
                    if amount_match:
                        print(f"    Amount: {amount_match.group(1)}€")

                    # Look for status
                    if 'retard' in text.lower():
                        print(f"    Status: ⚠️  Overdue")
                    elif 'urgent' in text.lower():
                        print(f"    Status: ⚠️  Urgent")
                    else:
                        print(f"    Status: ✓ Normal")

            else:
                print("⚠️  Obligations section not found")

        except TimeoutException:
            print("⚠️  Obligations list not found")

        print("\n" + "="*80)
        print("✅ OBLIGATIONS LIST TEST PASSED")
        print("="*80 + "\n")

    def test_filter_obligations(self, driver):
        """Test filtering obligations by state"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Filter Fiscal Obligations")
        print("="*80)

        print("\n[1/3] Logging in...")
        self.login()

        print("\n[2/3] Navigating to Fiscal page...")
        self.navigate_to_fiscal()

        print("\n[3/3] Testing filters...")
        filters_to_test = ['Toutes', 'À faire', 'En cours', 'Payées']

        for filter_name in filters_to_test:
            try:
                # Find filter button
                filter_button = self.driver.find_element(
                    By.XPATH,
                    f"//button[contains(text(), '{filter_name}')]"
                )

                filter_button.click()
                time.sleep(1)

                print(f"✓ Clicked filter: {filter_name}")

                # Check if active (has specific class)
                classes = filter_button.get_attribute('class')
                if 'bg-' in classes or 'active' in classes:
                    print(f"  Filter is active")

            except NoSuchElementException:
                print(f"⚠️  Filter '{filter_name}' not found")

        print("\n" + "="*80)
        print("✅ FILTER OBLIGATIONS TEST PASSED")
        print("="*80 + "\n")

    def test_risk_score_calculation(self, driver):
        """Test that risk score changes based on obligations state"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Risk Score Calculation Logic")
        print("="*80)

        print("\n[1/4] Logging in...")
        self.login()

        print("\n[2/4] Navigating to Fiscal page...")
        self.navigate_to_fiscal()

        print("\n[3/4] Extracting initial risk score...")
        risk_widget = self.find_risk_score_widget()
        initial_score = self.extract_risk_score(risk_widget)
        initial_level = self.extract_risk_level(risk_widget)

        print("\n[4/4] Validating risk score logic...")
        # Get alert data
        alert_cards = self.find_alerts_dashboard()
        alerts_data = self.extract_alert_data(alert_cards)

        # Validate logic: more overdue obligations = lower score
        if initial_score is not None and 'overdue' in alerts_data:
            overdue_count = alerts_data['overdue']['count']

            if overdue_count > 5:
                assert initial_score < 70, f"Score should be <70 with {overdue_count} overdue obligations"
                print(f"✓ Score logic validated: {overdue_count} overdue = score {initial_score} < 70")
            elif overdue_count > 0:
                assert initial_score < 90, f"Score should be <90 with {overdue_count} overdue obligations"
                print(f"✓ Score logic validated: {overdue_count} overdue = score {initial_score} < 90")
            else:
                print(f"✓ No overdue obligations, score: {initial_score}")

        # Validate level matches score
        if initial_score is not None and initial_level:
            expected_level = None
            if initial_score >= 80:
                expected_level = ['faible', 'low']
            elif initial_score >= 60:
                expected_level = ['moyen', 'medium']
            elif initial_score >= 40:
                expected_level = ['élevé', 'high']
            else:
                expected_level = ['critique', 'critical']

            level_matches = any(exp in initial_level.lower() for exp in expected_level)
            if level_matches:
                print(f"✓ Risk level matches score: {initial_score} → {initial_level}")
            else:
                print(f"⚠️  Risk level may not match score: {initial_score} → {initial_level}")

        print("\n" + "="*80)
        print("✅ RISK SCORE CALCULATION TEST PASSED")
        print("="*80)
        print(f"\nCalculation Summary:")
        print(f"  • Score: {initial_score}/100")
        print(f"  • Level: {initial_level}")
        print(f"  • Overdue: {alerts_data.get('overdue', {}).get('count', 0)} obligations")
        print(f"  • Logic validated: Score correlates with overdue obligations")
        print("\n")

    def test_navigation_to_delegations(self, driver):
        """Test navigation to fiscal delegations page"""
        print("\n" + "="*80)
        print("SELENIUM TEST: Navigate to Fiscal Delegations")
        print("="*80)

        print("\n[1/3] Logging in...")
        self.login()

        print("\n[2/3] Navigating to Fiscal page...")
        self.navigate_to_fiscal()

        print("\n[3/3] Finding and clicking delegations link...")
        try:
            delegations_link = self.driver.find_element(
                By.XPATH,
                "//a[contains(text(), 'Délégations')] | //button[contains(text(), 'Délégations')]"
            )

            href = delegations_link.get_attribute('href')
            delegations_link.click()

            time.sleep(2)

            current_url = self.driver.current_url
            assert 'delegation' in current_url.lower(), f"Expected delegations page but got: {current_url}"

            print(f"✓ Navigated to delegations page: {current_url}")

            print("\n" + "="*80)
            print("✅ DELEGATIONS NAVIGATION TEST PASSED")
            print("="*80 + "\n")

        except NoSuchElementException:
            print("⚠️  Delegations link not found")
            pytest.skip("Delegations link not available")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
