# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class DocumentTag(models.Model):
    """Tags pour organiser et catégoriser les documents"""
    _name = 'client.document.tag'
    _description = 'Tags de documents'
    _order = 'name'

    name = fields.Char(string='Nom', required=True, translate=True)
    color = fields.Integer(string='Couleur', default=0)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )

    _sql_constraints = [
        ('name_company_uniq', 'unique (name, company_id)',
         'Le nom du tag doit être unique par société!')
    ]


class DocumentCategory(models.Model):
    """Catégories de documents (hiérarchiques)"""
    _name = 'client.document.category'
    _description = 'Catégories de documents'
    _parent_name = 'parent_id'
    _parent_store = True
    _order = 'complete_name'

    name = fields.Char(string='Nom', required=True, translate=True)
    complete_name = fields.Char(
        string='Nom complet',
        compute='_compute_complete_name',
        recursive=True,
        store=True
    )
    parent_id = fields.Many2one(
        'client.document.category',
        string='Catégorie parente',
        ondelete='cascade',
        index=True
    )
    parent_path = fields.Char(index=True)
    child_ids = fields.One2many(
        'client.document.category',
        'parent_id',
        string='Sous-catégories'
    )
    document_count = fields.Integer(
        string='Nombre de documents',
        compute='_compute_document_count'
    )
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )

    @api.depends('name', 'parent_id.complete_name')
    def _compute_complete_name(self):
        for category in self:
            if category.parent_id:
                category.complete_name = f"{category.parent_id.complete_name} / {category.name}"
            else:
                category.complete_name = category.name

    def _compute_document_count(self):
        for category in self:
            category.document_count = self.env['client.document'].search_count([
                ('category_id', '=', category.id)
            ])
