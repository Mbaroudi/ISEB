# -*- coding: utf-8 -*-

import boto3
import logging
from odoo import models, fields, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class IrAttachmentStorage(models.Model):
    """Configuration du stockage objet pour les documents"""
    _inherit = 'ir.attachment'

    storage_backend = fields.Selection([
        ('db', 'Base de données PostgreSQL'),
        ('file', 'Système de fichiers local'),
        ('s3', 'Amazon S3'),
        ('minio', 'MinIO (S3-compatible)'),
    ], string='Backend de stockage', default='db')

    @api.model
    def _get_s3_config(self):
        """Récupère la configuration S3/MinIO depuis ir.config_parameter"""
        get_param = self.env['ir.config_parameter'].sudo().get_param

        return {
            'endpoint_url': get_param('document.storage.endpoint_url', False),
            'aws_access_key_id': get_param('document.storage.access_key', False),
            'aws_secret_access_key': get_param('document.storage.secret_key', False),
            'bucket_name': get_param('document.storage.bucket_name', 'iseb-documents'),
            'region_name': get_param('document.storage.region', 'eu-west-1'),
            'use_ssl': get_param('document.storage.use_ssl', 'True') == 'True',
        }

    @api.model
    def _get_s3_client(self):
        """Crée un client S3/MinIO"""
        config = self._get_s3_config()

        if not config['aws_access_key_id'] or not config['aws_secret_access_key']:
            raise UserError(_(
                "Les clés d'accès S3/MinIO ne sont pas configurées.\n"
                "Veuillez configurer les paramètres système :\n"
                "- document.storage.access_key\n"
                "- document.storage.secret_key"
            ))

        session = boto3.session.Session()

        s3_client = session.client(
            's3',
            endpoint_url=config['endpoint_url'],
            aws_access_key_id=config['aws_access_key_id'],
            aws_secret_access_key=config['aws_secret_access_key'],
            region_name=config['region_name'],
            use_ssl=config['use_ssl'],
        )

        return s3_client, config['bucket_name']

    def _upload_to_s3(self, data, object_name):
        """Upload un fichier vers S3/MinIO"""
        try:
            s3_client, bucket_name = self._get_s3_client()

            # Vérifier si le bucket existe, sinon le créer
            try:
                s3_client.head_bucket(Bucket=bucket_name)
            except:
                _logger.info(f"Creating bucket {bucket_name}")
                s3_client.create_bucket(Bucket=bucket_name)

            # Upload le fichier
            s3_client.put_object(
                Bucket=bucket_name,
                Key=object_name,
                Body=data,
            )

            _logger.info(f"Successfully uploaded {object_name} to {bucket_name}")
            return True

        except Exception as e:
            _logger.error(f"Error uploading to S3/MinIO: {str(e)}")
            raise UserError(_(
                "Erreur lors de l'upload vers le stockage objet: %s"
            ) % str(e))

    def _download_from_s3(self, object_name):
        """Télécharge un fichier depuis S3/MinIO"""
        try:
            s3_client, bucket_name = self._get_s3_client()

            response = s3_client.get_object(
                Bucket=bucket_name,
                Key=object_name
            )

            return response['Body'].read()

        except Exception as e:
            _logger.error(f"Error downloading from S3/MinIO: {str(e)}")
            raise UserError(_(
                "Erreur lors du téléchargement depuis le stockage objet: %s"
            ) % str(e))

    def _delete_from_s3(self, object_name):
        """Supprime un fichier depuis S3/MinIO"""
        try:
            s3_client, bucket_name = self._get_s3_client()

            s3_client.delete_object(
                Bucket=bucket_name,
                Key=object_name
            )

            _logger.info(f"Successfully deleted {object_name} from {bucket_name}")
            return True

        except Exception as e:
            _logger.error(f"Error deleting from S3/MinIO: {str(e)}")
            return False


class ResConfigSettings(models.TransientModel):
    """Configuration du stockage objet dans les paramètres système"""
    _inherit = 'res.config.settings'

    document_storage_type = fields.Selection([
        ('db', 'Base de données PostgreSQL'),
        ('file', 'Système de fichiers local'),
        ('s3', 'Amazon S3'),
        ('minio', 'MinIO (S3-compatible)'),
    ], string='Type de stockage', default='db',
       config_parameter='document.storage.type')

    document_storage_endpoint = fields.Char(
        string='Endpoint URL',
        help="URL du endpoint S3/MinIO (ex: https://s3.amazonaws.com ou http://minio:9000)",
        config_parameter='document.storage.endpoint_url'
    )

    document_storage_access_key = fields.Char(
        string='Access Key ID',
        config_parameter='document.storage.access_key'
    )

    document_storage_secret_key = fields.Char(
        string='Secret Access Key',
        config_parameter='document.storage.secret_key'
    )

    document_storage_bucket = fields.Char(
        string='Bucket Name',
        default='iseb-documents',
        config_parameter='document.storage.bucket_name'
    )

    document_storage_region = fields.Char(
        string='Region',
        default='eu-west-1',
        config_parameter='document.storage.region'
    )

    document_storage_use_ssl = fields.Boolean(
        string='Use SSL',
        default=True,
        config_parameter='document.storage.use_ssl'
    )

    def action_test_storage_connection(self):
        """Teste la connexion au stockage objet"""
        self.ensure_one()

        if self.document_storage_type in ['s3', 'minio']:
            try:
                attachment_obj = self.env['ir.attachment']
                s3_client, bucket_name = attachment_obj._get_s3_client()

                # Test de connexion
                s3_client.head_bucket(Bucket=bucket_name)

                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Succès'),
                        'message': _('Connexion au stockage objet réussie!'),
                        'type': 'success',
                        'sticky': False,
                    }
                }

            except Exception as e:
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Erreur'),
                        'message': _('Erreur de connexion: %s') % str(e),
                        'type': 'danger',
                        'sticky': True,
                    }
                }
