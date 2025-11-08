# -*- coding: utf-8 -*-

from odoo import models, fields, api


class BankProvider(models.Model):
    _name = 'bank.sync.provider'
    _description = 'Fournisseur Bancaire'
    _order = 'name'

    name = fields.Char(string='Nom', required=True)
    code = fields.Char(string='Code', required=True)
    logo = fields.Binary(string='Logo')
    country_id = fields.Many2one('res.country', string='Pays', default=lambda self: self.env.ref('base.fr'))

    api_type = fields.Selection([
        ('budget_insight', 'Budget Insight'),
        ('psd2', 'PSD2 Direct'),
        ('plaid', 'Plaid'),
        ('nordigen', 'Nordigen/GoCardless'),
        ('manual', 'Manuel')
    ], string='Type d\'API', default='budget_insight', required=True)

    api_endpoint = fields.Char(string='Endpoint API')
    api_credentials = fields.Text(string='Credentials (chiffrées)')
    active = fields.Boolean(default=True)

    supported_features = fields.Selection([
        ('basic', 'Basique (solde + transactions)'),
        ('advanced', 'Avancé (catégories + insights)'),
        ('full', 'Complet (investissements + prêts)')
    ], string='Fonctionnalités', default='basic')

    account_ids = fields.One2many('bank.sync.account', 'provider_id', string='Comptes')
    account_count = fields.Integer(string='Nombre de comptes', compute='_compute_account_count')

    @api.depends('account_ids')
    def _compute_account_count(self):
        for provider in self:
            provider.account_count = len(provider.account_ids)

    def _get_sync_service(self):
        """Retourner le service de synchronisation approprié"""
        raise NotImplementedError("Sync services not yet implemented")
