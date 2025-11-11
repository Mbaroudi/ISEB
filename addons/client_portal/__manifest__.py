# -*- coding: utf-8 -*-
{
    'name': 'Client Portal - ISEB',
    'version': '17.0.1.0.3',
    'category': 'Accounting/Accounting',
    'summary': 'Portail client pour suivi comptable en temps r�el',
    'description': """
Client Portal - ISEB Platform
==============================

Portail client permettant aux entrepreneurs de suivre leur situation
comptable et financi�re en temps r�el.

Fonctionnalit�s principales
----------------------------
* Dashboard temps r�el (tr�sorerie, CA, charges, r�sultats)
* Visualisation des factures clients et fournisseurs
* Suivi des paiements et encaissements
* Notes de frais avec upload photos (OCR)
* D�p�t de documents (justificatifs, contrats)
* Simulation d'imp�t
* Pr�vision de tr�sorerie
* Communication avec le cabinet comptable
* Notifications automatiques

Tableaux de bord
----------------
* Tr�sorerie (solde actuel, �volution 12 mois)
* Chiffre d'affaires (mensuel, annuel, comparaisons N-1)
* Charges (r�partition par cat�gorie)
* R�sultat net (mensuel, cumul�)
* TVA � d�caisser
* Indicateurs cl�s (CA/charges, taux de marge, BFR)

Interface
---------
* Design moderne et responsive
* Mobile-first (iOS/Android)
* Graphiques interactifs
* Export PDF/Excel

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
        'portal',
        'mail',
        'web',
        'website',  # Required for frontend assets (website.assets_frontend)
    ],
    # Intégration optionnelle avec le module Documents (Enterprise) ou DMS (Community)
    'auto_install_depends': [
        'documents',  # Odoo Enterprise GED
        'dms',  # Document Management System (Community alternative)
    ],
    'external_dependencies': {
        'python': [
            'xlsxwriter',
            'reportlab',
            'pytesseract',
            'PIL',
            'pdf2image',
            'boto3',
        ],
    },
    'data': [
        # Security
        'security/security.xml',
        'security/ir.model.access.csv',
        # Data
        'data/document_data.xml',
        'data/fiscal_data.xml',
        # Views - Core
        'views/client_dashboard_views.xml',
        'views/client_document_views.xml',
        'views/expense_note_views.xml',
        'views/res_config_settings_views.xml',
        'views/menu_views.xml',
        # Views - OCR & Documents
        'views/document_ocr_views.xml',
        'views/document_workflow_views.xml',
        'views/document_share_views.xml',
        'views/document_tag_views.xml',
        # Views - Fiscal
        'views/fiscal_obligation_views.xml',
        'views/fiscal_delegation_views.xml',
        'views/fiscal_risk_score_views.xml',
        # Portal Templates
        'views/portal_templates.xml',
        'views/portal_templates_enhanced.xml',
        # Assets - temporarily disabled due to web.assets_backend lookup error
        # 'views/assets.xml',
        # Data
        # 'data/email_templates.xml',  # TODO: Fix RNG validation issue
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
