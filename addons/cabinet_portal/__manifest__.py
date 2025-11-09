# -*- coding: utf-8 -*-
{
    'name': 'Cabinet Portal - ISEB',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Accounting',
    'summary': 'Portail cabinet comptable pour gestion multi-clients',
    'description': """
Cabinet Portal - ISEB Platform
===============================

Portail de gestion pour les cabinets d'expertise comptable permettant
de suivre et gérer tous leurs clients depuis une interface centralisée.

Fonctionnalités principales
----------------------------
* Dashboard multi-clients avec indicateurs agrégés
* Liste des clients avec filtres et recherche avancée
* Gestion des tâches et deadlines par client
* Validation centralisée des documents et notes de frais
* Suivi du chiffre d'affaires du cabinet
* Alertes et notifications automatiques
* Rapports consolidés

Tableaux de bord
----------------
* Vue d'ensemble : tous les clients en un coup d'œil
* Indicateurs clés : CA total clients, marges moyennes, taux de croissance
* Tâches en cours : deadlines, documents à valider
* Alertes : clients en retard, documents expirés

Gestion des clients
-------------------
* Fiche client complète avec historique
* Accès direct aux dashboards clients
* Notes internes et communications
* Documents et justificatifs partagés

Workflow de validation
----------------------
* File d'attente des documents à valider
* Validation/rejet en un clic
* Commentaires et demandes de corrections
* Historique des validations

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
        'client_portal',
    ],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/cabinet_client_views.xml',
        'views/cabinet_task_views.xml',
        'views/cabinet_dashboard_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
