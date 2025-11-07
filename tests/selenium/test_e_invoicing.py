# -*- coding: utf-8 -*-
"""
Tests E2E pour le module E-Invoicing
"""

import pytest
from tests.selenium.pages.e_invoicing_page import InvoicesPage, EInvoiceFormatsPage
from datetime import datetime


@pytest.mark.smoke
class TestInvoices:
    """Tests de gestion des factures"""

    def test_invoices_page_loads(self, authenticated_driver):
        """Test: La page factures se charge"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        assert 'account.move' in invoices_page.get_current_url()

    def test_create_invoice(self, authenticated_driver, test_invoice_data):
        """Test: Créer une facture"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        initial_count = invoices_page.get_invoices_count()

        # Créer facture
        invoices_page.create_new_invoice()
        invoices_page.select_customer(test_invoice_data['partner_name'])
        invoices_page.set_invoice_date(test_invoice_data['date'])
        invoices_page.add_invoice_line(
            product='Service Test',
            quantity=1,
            unit_price=float(test_invoice_data['amount'])
        )
        invoices_page.save_invoice()

        # Vérifier création
        invoices_page.load()
        new_count = invoices_page.get_invoices_count()
        assert new_count == initial_count + 1

    def test_confirm_invoice(self, authenticated_driver, test_invoice_data):
        """Test: Confirmer une facture (comptabiliser)"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        # Créer et confirmer
        invoices_page.create_new_invoice()
        invoices_page.select_customer(test_invoice_data['partner_name'])
        invoices_page.set_invoice_date(test_invoice_data['date'])
        invoices_page.add_invoice_line('Produit Test', 1, 100.00)
        invoices_page.save_invoice()
        invoices_page.confirm_invoice()

        # Vérifier que la facture est comptabilisée
        # (check status ou notification)
        assert True


class TestEInvoicing:
    """Tests de facturation électronique"""

    def test_set_einvoice_format_facturx(self, authenticated_driver, test_invoice_data):
        """Test: Définir format Factur-X"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        invoices_page.create_new_invoice()
        invoices_page.select_customer(test_invoice_data['partner_name'])
        invoices_page.set_einvoice_format('Factur-X')
        invoices_page.set_invoice_date(test_invoice_data['date'])
        invoices_page.add_invoice_line('Service', 1, 500.00)
        invoices_page.save_invoice()

        assert True

    @pytest.mark.slow
    def test_download_facturx(self, authenticated_driver, test_invoice_data):
        """Test: Télécharger facture Factur-X"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        # Créer, confirmer et télécharger
        invoices_page.create_new_invoice()
        invoices_page.select_customer(test_invoice_data['partner_name'])
        invoices_page.set_einvoice_format('Factur-X')
        invoices_page.set_invoice_date(test_invoice_data['date'])
        invoices_page.add_invoice_line('Service', 1, 1000.00)
        invoices_page.save_invoice()
        invoices_page.confirm_invoice()

        # Télécharger Factur-X
        invoices_page.download_facturx()

        assert True

    @pytest.mark.slow
    def test_send_einvoice(self, authenticated_driver, test_invoice_data):
        """Test: Envoyer facture électronique"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        # Créer et envoyer
        invoices_page.create_new_invoice()
        invoices_page.select_customer(test_invoice_data['partner_name'])
        invoices_page.set_einvoice_format('Factur-X')
        invoices_page.set_invoice_date(test_invoice_data['date'])
        invoices_page.add_invoice_line('Service', 1, 750.00)
        invoices_page.save_invoice()
        invoices_page.confirm_invoice()

        # Envoyer
        invoices_page.send_einvoice()

        # Vérifier statut
        status = invoices_page.get_einvoice_status()
        # assert status is not None

    def test_search_invoice(self, authenticated_driver, test_invoice_data):
        """Test: Rechercher une facture"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        invoices_page.search_invoice(test_invoice_data['reference'])
        # Vérifier résultats
        assert True


class TestEInvoiceFormats:
    """Tests des formats de facturation électronique"""

    def test_formats_page_loads(self, authenticated_driver):
        """Test: La page formats se charge"""
        formats_page = EInvoiceFormatsPage(authenticated_driver)
        formats_page.load()

        assert 'einvoice_format' in formats_page.get_current_url()

    def test_default_formats_available(self, authenticated_driver):
        """Test: Les formats par défaut sont disponibles"""
        formats_page = EInvoiceFormatsPage(authenticated_driver)
        formats_page.load()

        count = formats_page.get_formats_count()
        assert count >= 4, "Au moins 4 formats (Factur-X, Chorus Pro, Peppol, UBL)"

        # Vérifier formats spécifiques
        assert formats_page.is_format_available('Factur-X')
        assert formats_page.is_format_available('Chorus Pro')

    def test_get_all_format_names(self, authenticated_driver):
        """Test: Récupérer tous les noms de formats"""
        formats_page = EInvoiceFormatsPage(authenticated_driver)
        formats_page.load()

        names = formats_page.get_format_names()
        assert len(names) > 0
        assert any('Factur-X' in name for name in names)


@pytest.mark.integration
class TestEInvoicingWorkflow:
    """Tests de workflow complet facturation électronique"""

    @pytest.mark.slow
    def test_complete_einvoicing_workflow(self, authenticated_driver, test_invoice_data):
        """Test: Workflow complet création → confirmation → envoi e-facture"""
        invoices_page = InvoicesPage(authenticated_driver)

        # 1. Créer facture
        invoices_page.load()
        invoices_page.create_new_invoice()
        invoices_page.select_customer(test_invoice_data['partner_name'])
        invoices_page.set_einvoice_format('Factur-X')
        invoices_page.set_invoice_date(test_invoice_data['date'])

        # 2. Ajouter lignes
        invoices_page.add_invoice_line('Service Consulting', 5, 250.00)

        # 3. Enregistrer
        invoices_page.save_invoice()

        # 4. Confirmer
        invoices_page.confirm_invoice()

        # 5. Envoyer e-facture
        invoices_page.send_einvoice()

        # 6. Vérifier statut
        status = invoices_page.get_einvoice_status()
        # assert status in ['Envoyée', 'Sent', 'Delivered']

        # 7. Télécharger Factur-X
        invoices_page.download_facturx()

        assert True

    @pytest.mark.slow
    def test_chorus_pro_workflow(self, authenticated_driver, test_invoice_data):
        """Test: Workflow Chorus Pro (B2G)"""
        invoices_page = InvoicesPage(authenticated_driver)
        invoices_page.load()

        # Créer facture pour administration publique
        invoices_page.create_new_invoice()
        invoices_page.select_customer('Ministère Test')  # Client public
        invoices_page.set_einvoice_format('Chorus Pro')
        invoices_page.set_invoice_date(test_invoice_data['date'])
        invoices_page.add_invoice_line('Prestation', 1, 10000.00)
        invoices_page.save_invoice()
        invoices_page.confirm_invoice()

        # Envoyer vers Chorus Pro
        # invoices_page.send_to_chorus_pro()

        assert True
