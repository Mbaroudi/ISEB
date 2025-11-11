# -*- coding: utf-8 -*-

from odoo import models, fields


class BankSyncLog(models.Model):
    _name = 'bank.sync.log'
    _description = 'Log de Synchronisation Bancaire'
    _order = 'sync_date desc'

    bank_account_id = fields.Many2one('bank.sync.account', string='Compte', required=True, ondelete='cascade')
    sync_date = fields.Datetime(string='Date', required=True, default=fields.Datetime.now)

    state = fields.Selection([
        ('in_progress', 'En cours'),
        ('success', 'Succès'),
        ('error', 'Erreur')
    ], string='État', default='in_progress', required=True)

    transactions_imported = fields.Integer(string='Transactions importées', default=0)
    transactions_updated = fields.Integer(string='Transactions mises à jour', default=0)
    message = fields.Text(string='Message')
    error_details = fields.Text(string='Détails erreur')
