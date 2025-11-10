# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class ClientDocumentExtended(models.Model):
    """Extension du modèle de document avec gestion avancée"""
    _inherit = 'client.document'

    # Champs de base étendus
    reference = fields.Char(
        string='Référence',
        copy=False,
        readonly=True,
        default=lambda self: _('Nouveau')
    )
    description = fields.Html(string='Description détaillée')

    # Catégorisation et organisation
    category_id = fields.Many2one(
        'client.document.category',
        string='Catégorie',
        ondelete='restrict',
        index=True
    )
    tag_ids = fields.Many2many(
        'client.document.tag',
        'document_tag_rel',
        'document_id',
        'tag_id',
        string='Tags'
    )

    # Métadonnées financières
    document_date = fields.Date(
        string='Date du document',
        help="Date de la facture, du contrat, etc."
    )
    amount_total = fields.Monetary(
        string='Montant total',
        currency_field='currency_id',
        help="Montant du document (facture, dépense, etc.)"
    )
    currency_id = fields.Many2one(
        'res.currency',
        string='Devise',
        default=lambda self: self.env.company.currency_id
    )
    supplier_id = fields.Many2one(
        'res.partner',
        string='Fournisseur',
        domain=[('supplier_rank', '>', 0)],
        help="Fournisseur pour les factures d'achat"
    )

    # Archivage et cycle de vie
    active = fields.Boolean(default=True)
    archived_date = fields.Datetime(string='Date d\'archivage', readonly=True)
    expiration_date = fields.Date(
        string='Date d\'expiration',
        help="Pour les contrats, assurances, etc."
    )
    is_expired = fields.Boolean(
        string='Expiré',
        compute='_compute_is_expired',
        store=False
    )

    # Liens avec autres modèles Odoo
    invoice_id = fields.Many2one(
        'account.move',
        string='Facture liée',
        domain=[('move_type', 'in', ['in_invoice', 'in_refund', 'out_invoice', 'out_refund'])],
        ondelete='set null'
    )
    expense_id = fields.Many2one(
        'hr.expense',
        string='Note de frais liée',
        ondelete='set null'
    )

    # Recherche et indexation
    search_keywords = fields.Text(
        string='Mots-clés de recherche',
        help="Mots-clés pour faciliter la recherche"
    )

    # Statistiques
    download_count = fields.Integer(
        string='Nombre de téléchargements',
        default=0,
        readonly=True
    )
    last_download_date = fields.Datetime(
        string='Dernier téléchargement',
        readonly=True
    )
    view_count = fields.Integer(
        string='Nombre de vues',
        default=0,
        readonly=True
    )

    # Propriétés avancées
    file_size = fields.Integer(
        string='Taille du fichier',
        readonly=True,
        help="Taille en octets"
    )
    mime_type = fields.Char(
        string='Type MIME',
        readonly=True
    )
    checksum = fields.Char(
        string='Checksum',
        readonly=True,
        help="Hash SHA256 du fichier"
    )

    @api.depends('expiration_date')
    def _compute_is_expired(self):
        """Vérifie si le document est expiré"""
        today = fields.Date.today()
        for doc in self:
            doc.is_expired = doc.expiration_date and doc.expiration_date < today

    @api.model_create_multi
    def create(self, vals_list):
        """Génère une référence unique à la création"""
        for vals in vals_list:
            if vals.get('reference', _('Nouveau')) == _('Nouveau'):
                vals['reference'] = self.env['ir.sequence'].next_by_code(
                    'client.document'
                ) or _('Nouveau')
        return super().create(vals_list)

    def action_archive(self):
        """Archive le document"""
        self.write({
            'active': False,
            'archived_date': fields.Datetime.now()
        })

    def action_unarchive(self):
        """Désarchive le document"""
        self.write({
            'active': True,
            'archived_date': False
        })

    def action_download(self):
        """Override pour tracker les téléchargements"""
        self.ensure_one()
        self.sudo().write({
            'download_count': self.download_count + 1,
            'last_download_date': fields.Datetime.now()
        })
        return super().action_download()

    def action_increment_view(self):
        """Incrémente le compteur de vues"""
        self.ensure_one()
        self.sudo().write({
            'view_count': self.view_count + 1
        })

    def action_link_to_invoice(self):
        """Ouvre un wizard pour lier à une facture"""
        self.ensure_one()
        return {
            'name': _('Lier à une facture'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.move',
            'view_mode': 'tree,form',
            'domain': [
                ('partner_id', '=', self.partner_id.id),
                ('move_type', 'in', ['in_invoice', 'in_refund'])
            ],
            'target': 'new',
        }

    @api.model
    def search_documents(self, search_term, filters=None):
        """
        Recherche avancée de documents

        :param search_term: Terme de recherche
        :param filters: Dictionnaire de filtres additionnels
        :return: Recordset de documents trouvés
        """
        domain = []

        if search_term:
            domain = [
                '|', '|', '|', '|',
                ('name', 'ilike', search_term),
                ('reference', 'ilike', search_term),
                ('notes', 'ilike', search_term),
                ('search_keywords', 'ilike', search_term),
                ('description', 'ilike', search_term)
            ]

        if filters:
            if filters.get('partner_id'):
                domain.append(('partner_id', '=', filters['partner_id']))
            if filters.get('document_type'):
                domain.append(('document_type', '=', filters['document_type']))
            if filters.get('category_id'):
                domain.append(('category_id', '=', filters['category_id']))
            if filters.get('tag_ids'):
                domain.append(('tag_ids', 'in', filters['tag_ids']))
            if filters.get('date_from'):
                domain.append(('document_date', '>=', filters['date_from']))
            if filters.get('date_to'):
                domain.append(('document_date', '<=', filters['date_to']))
            if filters.get('amount_min'):
                domain.append(('amount_total', '>=', filters['amount_min']))
            if filters.get('amount_max'):
                domain.append(('amount_total', '<=', filters['amount_max']))
            if filters.get('state'):
                domain.append(('state', '=', filters['state']))
            if filters.get('is_expired') is not None:
                domain.append(('is_expired', '=', filters['is_expired']))

        return self.search(domain, order='document_date desc, upload_date desc')
