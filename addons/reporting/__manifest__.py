# -*- coding: utf-8 -*-
{
    'name': 'Custom Reporting - ISEB',
    'version': '17.0.1.0.0',
    'category': 'Reporting',
    'summary': 'Rapports financiers personnalisés et tableaux de bord avancés',
    'description': """
Custom Reporting Module
========================

Système de rapports personnalisés avec générateur drag & drop,
exports multi-formats, et tableaux de bord interactifs.

Fonctionnalités
---------------
* **Générateur de rapports**: Créez vos rapports par drag & drop
* **Templates prédéfinis**: Bilan, compte de résultat, flux de trésorerie, TVA
* **Exports multiples**: PDF, Excel, CSV, JSON
* **Tableaux de bord**: Widgets interactifs avec drill-down
* **Planification**: Génération automatique programmée
* **Comparaisons**: N vs N-1, budget vs réalisé
* **Graphiques**: Chart.js, Plotly, tables pivot
* **Filtres avancés**: Par période, entité, projet, analytique
* **Partage**: Email automatique, portail partenaires
* **API**: RESTful pour intégrations externes

Technologies
------------
* QWeb pour templates PDF
* Pandas pour calculs
* Chart.js / Plotly pour graphiques
* Celery pour génération asynchrone

License: AGPL-3
    """,
    'author': 'ISEB',
    'website': 'https://www.iseb-accounting.fr',
    'license': 'AGPL-3',
    'depends': ['base', 'account', 'web', 'mail'],
    'external_dependencies': {
        'python': ['pandas', 'openpyxl', 'plotly'],
    },
    'data': [
        'security/security.xml',
        'views/custom_report_views.xml',
        'views/report_template_views.xml',
        'views/menu_views.xml',
    ],
    'installable': True,
    'application': False,
}
