# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class DocumentBridge(models.AbstractModel):
    """
    Bridge intelligent pour utiliser soit:
    - Module 'documents' d'Odoo Enterprise (GED natif)
    - Module 'dms' Community (Document Management System)
    - Notre implémentation custom 'client.document'
    """
    _name = 'document.bridge'
    _description = 'Document Management Bridge'

    @api.model
    def get_document_model(self):
        """
        Détecte et retourne le modèle de document à utiliser

        Priorité:
        1. documents.document (Odoo Enterprise)
        2. dms.file (DMS Community)
        3. client.document (Notre implémentation)

        :return: Nom du modèle à utiliser
        """
        IrModule = self.env['ir.module.module']

        # Check si module 'documents' est installé (Enterprise)
        documents_module = IrModule.search([
            ('name', '=', 'documents'),
            ('state', '=', 'installed')
        ], limit=1)

        if documents_module:
            return 'documents.document'

        # Check si module 'dms' est installé (Community)
        dms_module = IrModule.search([
            ('name', '=', 'dms'),
            ('state', '=', 'installed')
        ], limit=1)

        if dms_module:
            return 'dms.file'

        # Fallback sur notre implémentation
        return 'client.document'

    @api.model
    def create_document(self, vals):
        """
        Crée un document en utilisant le système disponible

        :param vals: Dictionnaire de valeurs
        :return: Recordset du document créé
        """
        model_name = self.get_document_model()
        DocumentModel = self.env[model_name]

        # Adapter les champs selon le modèle
        if model_name == 'documents.document':
            adapted_vals = self._adapt_vals_for_odoo_documents(vals)
        elif model_name == 'dms.file':
            adapted_vals = self._adapt_vals_for_dms(vals)
        else:
            adapted_vals = vals

        return DocumentModel.create(adapted_vals)

    @api.model
    def search_documents(self, domain=None, order=None, limit=None):
        """
        Recherche des documents

        :param domain: Domaine de recherche
        :param order: Ordre de tri
        :param limit: Limite de résultats
        :return: Recordset de documents
        """
        model_name = self.get_document_model()
        DocumentModel = self.env[model_name]

        if domain:
            # Adapter le domaine selon le modèle
            if model_name == 'documents.document':
                domain = self._adapt_domain_for_odoo_documents(domain)
            elif model_name == 'dms.file':
                domain = self._adapt_domain_for_dms(domain)

        return DocumentModel.search(domain or [], order=order, limit=limit)

    def _adapt_vals_for_odoo_documents(self, vals):
        """
        Adapte les valeurs pour le module documents d'Odoo Enterprise

        Mapping:
        - name -> name
        - partner_id -> partner_id
        - file -> datas
        - filename -> name (si name vide)
        - document_type -> folder_id (via mapping)
        - notes -> description
        - tag_ids -> tag_ids
        """
        adapted = {
            'name': vals.get('filename') or vals.get('name'),
            'partner_id': vals.get('partner_id'),
            'datas': vals.get('file') or vals.get('file_data'),
            'description': vals.get('notes') or vals.get('description'),
        }

        # Mapping des tags si présents
        if vals.get('tag_ids'):
            adapted['tag_ids'] = vals['tag_ids']

        # Mapping du type de document vers folder
        if vals.get('document_type'):
            folder_id = self._get_documents_folder_for_type(vals['document_type'])
            if folder_id:
                adapted['folder_id'] = folder_id

        # Mapping de la catégorie vers folder
        if vals.get('category_id'):
            adapted['folder_id'] = vals['category_id']

        return adapted

    def _adapt_vals_for_dms(self, vals):
        """
        Adapte les valeurs pour le module DMS Community

        Mapping:
        - name -> name
        - partner_id -> partner_id (si supporté)
        - file -> content
        - filename -> name (si name vide)
        - document_type -> directory_id (via mapping)
        - notes -> comment
        - tag_ids -> tag_ids
        """
        adapted = {
            'name': vals.get('filename') or vals.get('name'),
            'content': vals.get('file') or vals.get('file_data'),
        }

        # DMS peut ne pas avoir partner_id
        if vals.get('partner_id') and 'partner_id' in self.env['dms.file']._fields:
            adapted['partner_id'] = vals['partner_id']

        # Mapping des notes
        if vals.get('notes') or vals.get('description'):
            adapted['comment'] = vals.get('notes') or vals.get('description')

        # Mapping du type de document vers directory
        if vals.get('document_type'):
            directory_id = self._get_dms_directory_for_type(vals['document_type'])
            if directory_id:
                adapted['directory_id'] = directory_id

        # Mapping de la catégorie vers directory
        if vals.get('category_id'):
            adapted['directory_id'] = vals['category_id']

        return adapted

    def _adapt_domain_for_odoo_documents(self, domain):
        """Adapte un domaine de recherche pour documents.document"""
        adapted_domain = []
        field_mapping = {
            'filename': 'name',
            'notes': 'description',
            'file': 'datas',
        }

        for item in domain:
            if isinstance(item, (list, tuple)) and len(item) >= 3:
                field, operator, value = item[0], item[1], item[2]
                adapted_field = field_mapping.get(field, field)
                adapted_domain.append((adapted_field, operator, value))
            else:
                adapted_domain.append(item)

        return adapted_domain

    def _adapt_domain_for_dms(self, domain):
        """Adapte un domaine de recherche pour dms.file"""
        adapted_domain = []
        field_mapping = {
            'filename': 'name',
            'notes': 'comment',
            'file': 'content',
        }

        for item in domain:
            if isinstance(item, (list, tuple)) and len(item) >= 3:
                field, operator, value = item[0], item[1], item[2]
                adapted_field = field_mapping.get(field, field)
                # Ignorer les champs qui n'existent pas dans DMS
                if adapted_field in self.env['dms.file']._fields:
                    adapted_domain.append((adapted_field, operator, value))
            else:
                adapted_domain.append(item)

        return adapted_domain

    def _get_documents_folder_for_type(self, document_type):
        """
        Retourne le folder_id correspondant au type de document

        :param document_type: Type de document (invoice, contract, etc.)
        :return: ID du folder ou False
        """
        folder_mapping = {
            'invoice': 'Factures',
            'contract': 'Contrats',
            'receipt': 'Reçus',
            'expense': 'Notes de frais',
        }

        folder_name = folder_mapping.get(document_type)
        if not folder_name:
            return False

        folder = self.env['documents.folder'].search([
            ('name', '=', folder_name)
        ], limit=1)

        return folder.id if folder else False

    def _get_dms_directory_for_type(self, document_type):
        """
        Retourne le directory_id correspondant au type de document

        :param document_type: Type de document
        :return: ID du directory ou False
        """
        directory_mapping = {
            'invoice': 'Factures',
            'contract': 'Contrats',
            'receipt': 'Reçus',
            'expense': 'Notes de frais',
        }

        directory_name = directory_mapping.get(document_type)
        if not directory_name:
            return False

        directory = self.env['dms.directory'].search([
            ('name', '=', directory_name)
        ], limit=1)

        return directory.id if directory else False

    @api.model
    def get_available_system(self):
        """
        Retourne des informations sur le système de GED disponible

        :return: Dict avec info sur le système
        """
        model_name = self.get_document_model()

        system_info = {
            'documents.document': {
                'name': 'Odoo Documents (Enterprise)',
                'type': 'enterprise',
                'features': ['tags', 'workflow', 'ocr', 'folders', 'sharing'],
            },
            'dms.file': {
                'name': 'DMS (Community)',
                'type': 'community',
                'features': ['directories', 'versioning', 'access_control'],
            },
            'client.document': {
                'name': 'ISEB Documents (Custom)',
                'type': 'custom',
                'features': ['basic_storage', 'categories', 'tags'],
            },
        }

        return {
            'model': model_name,
            'info': system_info.get(model_name, {}),
        }
