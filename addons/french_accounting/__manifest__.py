# -*- coding: utf-8 -*-
{
    'name': 'French Accounting - ISEB',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Localizations/Account Charts',
    'summary': 'Comptabilit� fran�aise compl�te pour cabinets d\'expertise-comptable',
    'description': """
French Accounting Module - ISEB Platform
=========================================

Module de comptabilit� fran�aise complet incluant :

Fonctionnalit�s principales
----------------------------
* Plan Comptable G�n�ral (PCG) 2025 complet
* D�clarations de TVA automatis�es (CA3, CA12)
* Liasses fiscales (2033, 2035, 2050)
* Export FEC (Fichier des �critures Comptables)
* Gestion des immobilisations et amortissements
* Conformit� l�gale fran�aise (Code de commerce)
* R�gimes fiscaux fran�ais (r�el normal, r�el simplifi�, BNC)
* Comptes sp�ciaux fran�ais (6XX, 7XX selon PCG)

Conformit� r�glementaire
-------------------------
* Art. L123-22 du Code de commerce
* R�glement ANC 2014-03 (PCG)
* Art. A47 A-1 du LPF (FEC)
* CGI art. 242 nonies A (facturation)
* Norme EDI-TVA pour t�l�d�claration

Int�grations
------------
* Int�gration avec l'Accounting Odoo standard
* Compatible avec le module de facturation
* Support multi-soci�t�s
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
        'mail',
    ],
    'data': [
        # Security
        'security/security.xml',
        'security/ir.model.access.csv',

        # Views
        'views/fec_export_views.xml',
        'views/tva_declaration_views.xml',
        'views/menu_views.xml',
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
