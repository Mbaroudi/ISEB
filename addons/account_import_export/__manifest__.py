# -*- coding: utf-8 -*-
{
    'name': 'ISEB - Import/Export Comptable',
    'version': '17.0.1.0.0',
    'category': 'Accounting',
    'summary': 'Import/Export de données comptables depuis/vers EBP, Sage, Ciel (FEC, XIMPORT)',
    'description': """
Import/Export Comptable pour ISEB
==================================

Ce module permet l'import et l'export de données comptables dans les formats standards français :

Formats supportés :
-------------------
* **FEC (Fichier des Écritures Comptables)** - Format officiel obligatoire depuis 2014
* **XIMPORT** - Format universel compatible Ciel, EBP, Sage
* **Sage PNM** - Format Sage
* **EBP ASCII** - Format EBP
* **CSV** - Format universel

Fonctionnalités :
-----------------
* Export FEC conforme à la réglementation française
* Import d'écritures depuis autres logiciels comptables
* Migration facilitée depuis/vers EBP, Sage, Ciel
* Validation des données importées
* Détection automatique du format
* Rapport d'import détaillé
* Gestion des erreurs avec correction guidée

Conformité :
------------
* Conforme à l'article L47 A du LPF
* Validation avec Test Compta Demat (DGFIP)
* 18 champs obligatoires du FEC respectés
* Encodage UTF-8 / ISO-8859-15
    """,
    'author': 'ISEB',
    'website': 'https://iseb.fr',
    'depends': [
        'account',
        'base',
    ],
    'data': [
        'security/ir.model.access.csv',
        'wizards/account_import_wizard_view.xml',
        'wizards/account_export_wizard_view.xml',
        'views/account_move_views.xml',
        'views/menu_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
