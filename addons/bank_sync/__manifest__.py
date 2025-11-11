# -*- coding: utf-8 -*-
{
    'name': 'Bank Synchronization - ISEB',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Accounting',
    'summary': 'Synchronisation automatique des transactions bancaires',
    'description': """
Bank Synchronization Module
============================

Synchronisation automatique des comptes bancaires français avec agrégation
des transactions en temps réel.

Fonctionnalités principales
----------------------------
* Connexion sécurisée aux banques françaises (PSD2)
* Synchronisation automatique des transactions
* Rapprochement bancaire automatique
* Réconciliation intelligente avec factures
* Catégorisation automatique des dépenses
* Alertes de solde et seuils personnalisables
* Support multi-comptes et multi-banques
* Historique complet des synchronisations

Connecteurs bancaires
----------------------
* Budget Insight API (agrégateur français)
* PSD2 API pour banques principales :
  - BNP Paribas
  - Crédit Agricole
  - Société Générale
  - La Banque Postale
  - Crédit Mutuel / CIC
  - Boursorama
  - ING
  - Hello bank!
  - N26
  - Revolut

Catégorisation intelligente
----------------------------
* ML-based classification des transactions
* Règles personnalisables par utilisateur
* Apprentissage automatique basé sur l'historique
* Détection des doublons
* Identification des virements internes

Sécurité
--------
* Chiffrement AES-256 des credentials bancaires
* Conformité PSD2
* Authentification forte (SCA)
* Stockage sécurisé via keyring
* Logs d'audit complets
* Révocation instantanée des accès

Rapprochement bancaire
-----------------------
* Matching automatique factures ↔ paiements
* Suggestions intelligentes de rapprochement
* Validation manuelle si nécessaire
* Historique des rapprochements
* Génération d'écritures comptables automatiques

Technologies
------------
* Budget Insight API v2
* PSD2 Open Banking APIs
* Celery pour jobs asynchrones
* Redis pour cache
* Cryptography pour chiffrement

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
    'external_dependencies': {
        'python': [
            'requests',
            'cryptography',
            'celery',
            'redis',
        ],
    },
    'data': [
        # Security
        'security/security.xml',
        'security/ir.model.access.csv',
        # Data
        'data/bank_providers.xml',
        # Views
        'views/bank_sync_log_views.xml',
        'views/bank_transaction_views.xml',
        'views/bank_provider_views.xml',
        'views/reconciliation_rule_views.xml',
        'views/bank_account_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}
