# -*- coding: utf-8 -*-
{
    'name': 'French Accounting - ISEB',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Localizations/Account Charts',
    'summary': 'Comptabilité française complète pour cabinets d\'expertise-comptable',
    'description': """
French Accounting Module - ISEB Platform
=========================================

Module de comptabilité française complet incluant :

Fonctionnalités principales
----------------------------
* Plan Comptable Général (PCG) 2025 complet
* Déclarations de TVA automatisées (CA3, CA12)
* Liasses fiscales (2033, 2035, 2050)
* Export FEC (Fichier des Écritures Comptables)
* Gestion des immobilisations et amortissements
* Conformité légale française (Code de commerce)
* Régimes fiscaux français (réel normal, réel simplifié, BNC)
* Comptes spéciaux français (6XX, 7XX selon PCG)

Conformité réglementaire
-------------------------
* Art. L123-22 du Code de commerce
* Règlement ANC 2014-03 (PCG)
* Art. A47 A-1 du LPF (FEC)
* CGI art. 242 nonies A (facturation)
* Norme EDI-TVA pour télédéclaration

Intégrations
------------
* Intégration avec l'Accounting Odoo standard
* Compatible avec le module de facturation
* Support multi-sociétés
* API pour connexions externes

Auteur
------
ISEB Dev Team

License
-------
AGPL-3
    """,
    'author': 'ISEB',
    'website': 'https://www.iseb-accounting.fr',
    'license': 'AGPL-3',
    'depends': [
        'base',
        'account',
        'account_accountant',
        'l10n_fr',
        'account_asset',
        'account_reports',
    ],
    'data': [
        # Security
        'security/ir.model.access.csv',
        'security/security.xml',

        # Data
        'data/account_chart_template_data.xml',
        'data/account.account.template.csv',
        'data/account_tax_data.xml',
        'data/fiscal_position_data.xml',
        'data/fec_export_data.xml',

        # Views
        'views/account_move_views.xml',
        'views/account_journal_views.xml',
        'views/res_company_views.xml',
        'views/account_tax_views.xml',
        'views/fec_export_views.xml',
        'views/fiscal_declaration_views.xml',
        'views/liasse_fiscale_views.xml',
        'views/menu_views.xml',

        # Wizards
        'wizard/fec_export_wizard_views.xml',
        'wizard/tva_declaration_wizard_views.xml',
        'wizard/liasse_fiscale_wizard_views.xml',

        # Reports
        'reports/report_templates.xml',
        'reports/fec_report.xml',
        'reports/tva_report.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'french_accounting/static/src/js/fec_export.js',
            'french_accounting/static/src/js/tva_dashboard.js',
            'french_accounting/static/src/css/french_accounting.css',
        ],
    },
    'demo': [
        'demo/demo_data.xml',
    ],
    'images': [
        'static/description/icon.png',
        'static/description/banner.png',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'price': 0.00,
    'currency': 'EUR',
}
