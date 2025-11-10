# -*- coding: utf-8 -*-
{
    'name': 'ISEB - Collaboration Comptable',
    'version': '17.0.1.0.0',
    'category': 'Accounting',
    'summary': 'Workflow collaboratif entre comptables et clients (questions, commentaires, tâches)',
    'description': """
Collaboration Comptable pour ISEB
==================================

Ce module facilite la collaboration entre comptables et clients en permettant
des échanges structurés sur les documents et écritures comptables.

Fonctionnalités principales :
------------------------------
* **Questions & Réponses** : Poser des questions sur des écritures, factures, relevés bancaires
* **Fil de discussion** : Historique complet des échanges par document
* **Assignation** : Assigner des questions à des utilisateurs spécifiques
* **Statuts** : Suivi de l'état (en attente, répondu, résolu, fermé)
* **Notifications** : Alertes en temps réel pour nouvelles questions
* **Pièces jointes** : Joindre des documents aux questions
* **Traçabilité** : Historique complet des modifications
* **Tableau de bord** : Vue d'ensemble des questions en attente

Types de questions supportés :
-------------------------------
* Document manquant (facture, justificatif)
* Clarification sur ligne de facture
* Question sur relevé bancaire
* Question TVA / fiscale
* Demande de correction
* Question générale

Cas d'usage :
-------------
1. **Client** : "Cette charge de 1500€ du 15/03, c'est quoi exactement ?"
   → Comptable répond et marque comme résolu

2. **Comptable** : "Il manque la facture pour l'écriture n°AC/2024/001"
   → Client télécharge le document et répond

3. **Expert-comptable** : "La TVA sur cette ligne semble incorrecte"
   → Aide-comptable corrige et confirme

Workflow :
----------
1. Création de question (par client ou comptable)
2. Assignation à la personne concernée
3. Échange de messages dans le fil de discussion
4. Résolution avec solution
5. Fermeture et archivage
6. Traçabilité complète conservée

Rôles :
-------
* **Client** : Peut créer des questions, répondre, voir ses questions
* **Aide-comptable** : Peut répondre, assigner, résoudre
* **Comptable** : Tous droits + peut fermer
* **Expert-comptable** : Tous droits + supervision

Intégrations :
--------------
* Écritures comptables (account.move)
* Documents (client_portal.document)
* Notes de frais (client_portal.expense_note)
* Relevés bancaires (account.bank.statement)

Notifications :
---------------
* Email automatique lors de nouvelle question
* Badge notifications dans l'interface
* Rappels pour questions sans réponse
* Alertes pour questions urgentes
    """,
    'author': 'ISEB',
    'website': 'https://iseb.fr',
    'depends': [
        'account',
        'base',
        'mail',
        'client_portal',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/accounting_question_views.xml',
        'views/accounting_message_views.xml',
        'views/account_move_views.xml',
        'views/menu_views.xml',
        'data/question_types_data.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
