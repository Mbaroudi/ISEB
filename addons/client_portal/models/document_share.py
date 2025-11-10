# -*- coding: utf-8 -*-

import uuid
import logging
from datetime import datetime, timedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError, AccessError

_logger = logging.getLogger(__name__)


class DocumentShare(models.Model):
    """Partage externe de documents avec liens temporaires"""
    _name = 'client.document.share'
    _description = 'Partage de documents'
    _order = 'create_date desc'

    name = fields.Char(
        string='Nom',
        compute='_compute_name',
        store=True
    )

    document_id = fields.Many2one(
        'client.document',
        string='Document',
        required=True,
        ondelete='cascade'
    )

    # Lien de partage
    access_token = fields.Char(
        string='Token d\'accès',
        required=True,
        default=lambda self: str(uuid.uuid4()),
        copy=False,
        readonly=True
    )

    share_url = fields.Char(
        string='URL de partage',
        compute='_compute_share_url',
        readonly=True
    )

    # Paramètres de partage
    expiration_date = fields.Datetime(
        string='Date d\'expiration',
        required=True,
        default=lambda self: fields.Datetime.now() + timedelta(days=7)
    )

    is_expired = fields.Boolean(
        string='Expiré',
        compute='_compute_is_expired',
        store=True
    )

    access_count = fields.Integer(
        string='Nombre d\'accès',
        default=0,
        readonly=True
    )

    max_access_count = fields.Integer(
        string='Nombre d\'accès maximum',
        default=0,
        help="0 = illimité"
    )

    is_access_limited = fields.Boolean(
        string='Limite d\'accès atteinte',
        compute='_compute_is_access_limited',
        store=True
    )

    # Protection
    password = fields.Char(
        string='Mot de passe',
        help="Optionnel : protection par mot de passe"
    )

    has_password = fields.Boolean(
        string='Protégé par mot de passe',
        compute='_compute_has_password'
    )

    # Permissions
    can_download = fields.Boolean(
        string='Autoriser téléchargement',
        default=True
    )

    can_preview = fields.Boolean(
        string='Autoriser prévisualisation',
        default=True
    )

    # Traçabilité
    shared_by_id = fields.Many2one(
        'res.users',
        string='Partagé par',
        default=lambda self: self.env.user,
        readonly=True
    )

    shared_with_email = fields.Char(
        string='Partagé avec (email)',
        help="Email du destinataire (optionnel)"
    )

    shared_with_name = fields.Char(
        string='Partagé avec (nom)',
        help="Nom du destinataire (optionnel)"
    )

    last_access_date = fields.Datetime(
        string='Dernier accès',
        readonly=True
    )

    last_access_ip = fields.Char(
        string='Dernière IP',
        readonly=True
    )

    # État
    state = fields.Selection([
        ('active', 'Actif'),
        ('expired', 'Expiré'),
        ('revoked', 'Révoqué'),
    ], string='État', default='active', required=True)

    active = fields.Boolean(default=True)

    # Méta
    notes = fields.Text(string='Notes')
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )

    @api.depends('document_id.name')
    def _compute_name(self):
        """Génère un nom pour le partage"""
        for share in self:
            if share.document_id:
                share.name = _("Partage de %s") % share.document_id.name
            else:
                share.name = _("Nouveau partage")

    @api.depends('access_token')
    def _compute_share_url(self):
        """Génère l'URL de partage"""
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for share in self:
            if share.access_token:
                share.share_url = f"{base_url}/document/share/{share.access_token}"
            else:
                share.share_url = False

    @api.depends('expiration_date')
    def _compute_is_expired(self):
        """Vérifie si le partage est expiré"""
        now = fields.Datetime.now()
        for share in self:
            share.is_expired = share.expiration_date and share.expiration_date < now

    @api.depends('access_count', 'max_access_count')
    def _compute_is_access_limited(self):
        """Vérifie si la limite d\'accès est atteinte"""
        for share in self:
            share.is_access_limited = (
                share.max_access_count > 0 and
                share.access_count >= share.max_access_count
            )

    @api.depends('password')
    def _compute_has_password(self):
        """Vérifie si le partage a un mot de passe"""
        for share in self:
            share.has_password = bool(share.password)

    @api.constrains('expiration_date')
    def _check_expiration_date(self):
        """Vérifie que la date d\'expiration est dans le futur"""
        for share in self:
            if share.expiration_date and share.expiration_date < fields.Datetime.now():
                raise ValidationError(_(
                    "La date d'expiration doit être dans le futur."
                ))

    def check_access(self, password=None, ip_address=None):
        """
        Vérifie si l'accès est autorisé

        :param password: Mot de passe fourni (si requis)
        :param ip_address: Adresse IP du demandeur
        :return: True si accès autorisé
        :raises: AccessError si accès refusé
        """
        self.ensure_one()

        # Vérifier l'état
        if self.state == 'revoked':
            raise AccessError(_("Ce lien de partage a été révoqué."))

        if self.state == 'expired':
            raise AccessError(_("Ce lien de partage a expiré."))

        # Vérifier l'expiration
        if self.is_expired:
            self.write({'state': 'expired'})
            raise AccessError(_("Ce lien de partage a expiré."))

        # Vérifier la limite d'accès
        if self.is_access_limited:
            raise AccessError(_(
                "La limite d'accès pour ce lien a été atteinte."
            ))

        # Vérifier le mot de passe
        if self.has_password:
            if not password:
                raise AccessError(_("Ce lien nécessite un mot de passe."))
            if password != self.password:
                raise AccessError(_("Mot de passe incorrect."))

        # Enregistrer l'accès
        self.sudo().write({
            'access_count': self.access_count + 1,
            'last_access_date': fields.Datetime.now(),
            'last_access_ip': ip_address or False,
        })

        _logger.info(
            f"Document share {self.id} accessed. "
            f"Count: {self.access_count}, IP: {ip_address}"
        )

        return True

    def action_revoke(self):
        """Révoque le partage"""
        self.write({'state': 'revoked'})
        return True

    def action_extend_expiration(self, days=7):
        """Prolonge la date d\'expiration"""
        self.ensure_one()

        new_expiration = fields.Datetime.now() + timedelta(days=days)
        self.write({
            'expiration_date': new_expiration,
            'state': 'active' if self.state == 'expired' else self.state
        })

        return True

    def action_send_by_email(self):
        """Envoie le lien de partage par email"""
        self.ensure_one()

        if not self.shared_with_email:
            raise UserError(_(
                "Veuillez renseigner l'email du destinataire."
            ))

        # Composer email
        template = self.env.ref(
            'client_portal.email_template_document_share',
            raise_if_not_found=False
        )

        if template:
            template.send_mail(self.id, force_send=True)
        else:
            # Email par défaut
            subject = _("Document partagé: %s") % self.document_id.name
            body = _(
                "Bonjour,<br/><br/>"
                "Un document a été partagé avec vous: <b>%s</b><br/><br/>"
                "Accédez au document via ce lien:<br/>"
                "<a href='%s'>%s</a><br/><br/>"
                "Ce lien expire le %s.<br/>"
            ) % (
                self.document_id.name,
                self.share_url,
                self.share_url,
                self.expiration_date.strftime('%d/%m/%Y à %H:%M') if self.expiration_date else 'N/A'
            )

            if self.has_password:
                body += _("<br/>Mot de passe requis pour accéder au document.")

            # Envoyer email
            mail_values = {
                'subject': subject,
                'body_html': body,
                'email_to': self.shared_with_email,
                'auto_delete': False,
            }

            mail = self.env['mail.mail'].sudo().create(mail_values)
            mail.send()

        _logger.info(f"Share link sent by email to {self.shared_with_email}")

        return True

    @api.model
    def get_share_by_token(self, token):
        """
        Récupère un partage par son token

        :param token: Token d'accès
        :return: Recordset document.share ou False
        """
        share = self.search([
            ('access_token', '=', token),
            ('active', '=', True),
        ], limit=1)

        return share if share else False

    @api.model
    def cleanup_expired_shares(self):
        """
        Nettoie les partages expirés (cron)

        Met à jour l'état des partages expirés
        """
        expired_shares = self.search([
            ('state', '=', 'active'),
            ('expiration_date', '<', fields.Datetime.now())
        ])

        if expired_shares:
            expired_shares.write({'state': 'expired'})
            _logger.info(f"Marked {len(expired_shares)} shares as expired")

        return True


class ClientDocumentShare(models.Model):
    """Extension du modèle document avec partage"""
    _inherit = 'client.document'

    share_ids = fields.One2many(
        'client.document.share',
        'document_id',
        string='Partages'
    )

    share_count = fields.Integer(
        string='Nombre de partages',
        compute='_compute_share_count'
    )

    active_share_count = fields.Integer(
        string='Partages actifs',
        compute='_compute_active_share_count'
    )

    @api.depends('share_ids')
    def _compute_share_count(self):
        """Compte le nombre de partages"""
        for doc in self:
            doc.share_count = len(doc.share_ids)

    @api.depends('share_ids.state')
    def _compute_active_share_count(self):
        """Compte le nombre de partages actifs"""
        for doc in self:
            doc.active_share_count = len(doc.share_ids.filtered(
                lambda s: s.state == 'active' and not s.is_expired
            ))

    def action_create_share(self):
        """Crée un nouveau partage pour ce document"""
        self.ensure_one()

        return {
            'name': _('Créer un partage'),
            'type': 'ir.actions.act_window',
            'res_model': 'client.document.share',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_document_id': self.id,
            }
        }

    def action_view_shares(self):
        """Affiche les partages du document"""
        self.ensure_one()

        return {
            'name': _('Partages'),
            'type': 'ir.actions.act_window',
            'res_model': 'client.document.share',
            'domain': [('document_id', '=', self.id)],
            'view_mode': 'tree,form',
            'context': {
                'default_document_id': self.id,
            }
        }
