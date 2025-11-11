# -*- coding: utf-8 -*-
{
    'name': 'Electronic Invoicing - ISEB',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Accounting',
    'summary': 'Facturation électronique Factur-X, Chorus Pro, Peppol',
    'description': """
Electronic Invoicing Module
============================

Génération et envoi de factures électroniques conformes aux normes françaises
et européennes (Factur-X, Chorus Pro, Peppol).

Fonctionnalités principales
----------------------------
* **Factur-X**: Génération PDF/A-3 avec XML embarqué (EN 16931)
* **Chorus Pro**: Envoi automatique aux administrations françaises
* **Peppol**: Échange B2B via réseau Peppol
* **Signature électronique**: Cachet serveur RGS ou eIDAS
* **Archivage légal**: SAE conforme (10 ans)
* **Workflows**: Validation, envoi, accusés de réception
* **Statuts**: Brouillon, envoyée, acceptée, rejetée, payée
* **Notifications**: Email, SMS pour changements de statut

Formats supportés
-----------------
* Factur-X (FR) - Format hybride PDF + XML
* Chorus Pro (FR) - Plateforme publique française
* Peppol BIS 3.0 (EU) - Standard européen
* UBL 2.1 - Universal Business Language
* CII D16B - Cross Industry Invoice

Conformité
----------
* Obligation de facturation électronique B2B (2026)
* Norme sémantique EN 16931
* Format syntaxique Factur-X
* Archivage fiscal (CGI art. 289)
* RGPD pour données personnelles

Intégrations
------------
* Chorus Pro API v2
* Peppol Access Points (OpenPeppol)
* Services de signature (Universign, DocuSign)
* Archivage (Arkevia, Locarchives)

Technologies
------------
* lxml pour génération XML
* reportlab pour PDF/A-3
* cryptography pour signatures
* requests pour APIs

License: AGPL-3
    """,
    'author': 'ISEB',
    'website': 'https://www.iseb-accounting.fr',
    'license': 'AGPL-3',
    'depends': ['base', 'account', 'mail'],
    'external_dependencies': {
        'python': ['lxml', 'reportlab', 'cryptography', 'zeep'],
    },
    'data': [
        'security/security.xml',
        'views/account_move_views.xml',
    ],
    'installable': True,
    'application': False,
}
