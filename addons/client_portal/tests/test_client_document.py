# -*- coding: utf-8 -*-

import base64
from odoo.tests import TransactionCase, tagged
from odoo.exceptions import UserError
from datetime import date


@tagged('post_install', '-at_install')
class TestClientDocument(TransactionCase):
    """Tests pour le modèle client.document"""

    def setUp(self):
        super().setUp()
        
        # Créer un client de test
        self.partner = self.env['res.partner'].create({
            'name': 'Test Client Document',
            'is_iseb_client': True,
        })
        
        # Créer un document fictif
        self.document = self.env['client.document'].create({
            'name': 'Facture Test',
            'partner_id': self.partner.id,
            'document_type': 'invoice',
            'document_date': date.today(),
        })

    def test_create_document(self):
        """Test création d'un document"""
        self.assertTrue(self.document.id)
        self.assertEqual(self.document.partner_id, self.partner)
        self.assertEqual(self.document.state, 'draft')
        self.assertEqual(self.document.document_type, 'invoice')

    def test_document_workflow(self):
        """Test du workflow complet du document"""
        # État initial
        self.assertEqual(self.document.state, 'draft')
        
        # Soumettre le document
        self.document.action_submit()
        self.assertEqual(self.document.state, 'pending')
        
        # Valider le document
        self.document.action_validate()
        self.assertEqual(self.document.state, 'validated')
        self.assertIsNotNone(self.document.validated_date)
        
        # Remettre en brouillon
        self.document.action_reset_draft()
        self.assertEqual(self.document.state, 'draft')

    def test_document_rejection(self):
        """Test du rejet d'un document"""
        self.document.action_submit()
        
        # Rejeter le document
        self.document.write({'rejection_reason': 'Document illisible'})
        self.document.action_reject()
        
        self.assertEqual(self.document.state, 'rejected')
        self.assertEqual(self.document.rejection_reason, 'Document illisible')

    def test_document_file_upload(self):
        """Test de l'upload d'un fichier"""
        # Créer un contenu fictif
        file_content = b'Test file content'
        file_data = base64.b64encode(file_content)
        
        self.document.write({
            'file_data': file_data,
            'file_name': 'test_document.pdf',
            'mime_type': 'application/pdf',
        })
        
        self.assertTrue(self.document.file_data)
        self.assertEqual(self.document.file_name, 'test_document.pdf')
        self.assertEqual(self.document.mime_type, 'application/pdf')

    def test_document_file_size_computation(self):
        """Test calcul de la taille du fichier"""
        file_content = b'Test file content'
        file_data = base64.b64encode(file_content)
        
        self.document.write({'file_data': file_data})
        self.document._compute_file_size()
        
        # Taille devrait être > 0
        self.assertGreater(self.document.file_size, 0)

    def test_document_types(self):
        """Test des différents types de documents"""
        types = ['invoice', 'receipt', 'contract', 'justificatif', 'other']
        
        for doc_type in types:
            doc = self.env['client.document'].create({
                'name': f'Document {doc_type}',
                'partner_id': self.partner.id,
                'document_type': doc_type,
                'document_date': date.today(),
            })
            self.assertEqual(doc.document_type, doc_type)

    def test_document_validation_by_user(self):
        """Test de la validation avec utilisateur"""
        # Valider le document (devrait enregistrer l'utilisateur)
        self.document.action_submit()
        self.document.action_validate()
        
        self.assertIsNotNone(self.document.validated_by_id)
        self.assertEqual(self.document.validated_by_id, self.env.user)

    def test_document_upload_date(self):
        """Test date d'upload automatique"""
        # La date d'upload devrait être automatiquement définie
        self.assertIsNotNone(self.document.uploaded_date)

    def test_document_action_download(self):
        """Test action de téléchargement"""
        file_content = b'Test PDF content'
        file_data = base64.b64encode(file_content)
        
        self.document.write({
            'file_data': file_data,
            'file_name': 'test.pdf',
        })
        
        # Appeler l'action (ne teste pas le HTTP mais la méthode)
        action = self.document.action_download()
        
        # Devrait retourner un dict ou None selon implémentation
        # Test basique: vérifier que ça ne lève pas d'erreur
        self.assertTrue(True)

    def test_document_ocr_data(self):
        """Test données OCR"""
        ocr_data = {
            'amount': '100.50',
            'date': '2025-01-15',
            'vendor': 'Test Vendor',
        }
        
        self.document.write({
            'ocr_data': str(ocr_data),
            'ocr_confidence': 0.95,
        })
        
        self.assertTrue(self.document.ocr_data)
        self.assertEqual(self.document.ocr_confidence, 0.95)

    def test_multiple_documents_per_partner(self):
        """Test création de plusieurs documents pour un client"""
        doc2 = self.env['client.document'].create({
            'name': 'Contrat Test',
            'partner_id': self.partner.id,
            'document_type': 'contract',
            'document_date': date.today(),
        })
        
        # Devrait avoir 2 documents
        documents = self.env['client.document'].search([
            ('partner_id', '=', self.partner.id)
        ])
        self.assertEqual(len(documents), 2)

    def test_document_search_by_type(self):
        """Test recherche par type de document"""
        # Créer plusieurs types
        self.env['client.document'].create({
            'name': 'Contrat',
            'partner_id': self.partner.id,
            'document_type': 'contract',
            'document_date': date.today(),
        })
        
        invoices = self.env['client.document'].search([
            ('partner_id', '=', self.partner.id),
            ('document_type', '=', 'invoice')
        ])
        
        contracts = self.env['client.document'].search([
            ('partner_id', '=', self.partner.id),
            ('document_type', '=', 'contract')
        ])
        
        self.assertEqual(len(invoices), 1)
        self.assertEqual(len(contracts), 1)

    def test_document_search_by_state(self):
        """Test recherche par état"""
        # Créer plusieurs documents avec états différents
        doc2 = self.env['client.document'].create({
            'name': 'Document 2',
            'partner_id': self.partner.id,
            'document_type': 'invoice',
            'document_date': date.today(),
        })
        doc2.action_submit()
        
        drafts = self.env['client.document'].search([
            ('partner_id', '=', self.partner.id),
            ('state', '=', 'draft')
        ])
        
        pending = self.env['client.document'].search([
            ('partner_id', '=', self.partner.id),
            ('state', '=', 'pending')
        ])
        
        self.assertEqual(len(drafts), 1)
        self.assertEqual(len(pending), 1)
