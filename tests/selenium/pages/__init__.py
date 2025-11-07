# -*- coding: utf-8 -*-
"""
Page Objects pour tests Selenium ISEB Platform
"""

from .base_page import BasePage
from .login_page import LoginPage
from .client_portal_page import DashboardPage, DocumentsPage, ExpensesPage, PWAPage
from .bank_sync_page import BankAccountsPage, BankTransactionsPage, ReconciliationRulesPage
from .reporting_page import CustomReportsPage, ReportViewerPage
from .e_invoicing_page import InvoicesPage, EInvoiceFormatsPage

__all__ = [
    'BasePage',
    'LoginPage',
    'DashboardPage',
    'DocumentsPage',
    'ExpensesPage',
    'PWAPage',
    'BankAccountsPage',
    'BankTransactionsPage',
    'ReconciliationRulesPage',
    'CustomReportsPage',
    'ReportViewerPage',
    'InvoicesPage',
    'EInvoiceFormatsPage',
]
