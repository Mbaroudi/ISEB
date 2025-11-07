# -*- coding: utf-8 -*-
{
    'name': 'Client Portal - ISEB',
    'version': '17.0.1.0.0',
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
    ],
    'data': [
        # Security
        'security/security.xml',
        'security/ir.model.access.csv',
        # Views
        'views/client_dashboard_views.xml',
        'views/client_document_views.xml',
        'views/expense_note_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
