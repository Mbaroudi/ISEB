# -*- coding: utf-8 -*-
{
    'name': 'Invoice OCR Configuration Helper',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Accounting',
    'summary': 'Configuration helper for Invoice OCR setup',
    'description': """
Invoice OCR Configuration Helper
=================================

This module helps configure OCR settings for automatic invoice processing.

Features:
---------
* System parameters configuration for OCR APIs
* Default account mapping for common suppliers
* Email routing rules for invoice inbox
* Workflow validation rules
* OCR field mapping templates

Supported OCR Providers:
------------------------
* Google Vision AI
* AWS Textract
* Azure Computer Vision

Usage:
------
1. Install this module
2. Go to Settings → Invoice OCR Configuration
3. Configure your OCR provider and API keys
4. Set up supplier templates
5. Start processing invoices

    """,
    'author': 'ISEB',
    'website': 'https://www.iseb.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'account',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/ocr_config_data.xml',
        'views/ocr_config_views.xml',
        'views/res_config_settings_views.xml',
    ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}
