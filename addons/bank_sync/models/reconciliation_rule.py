# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ReconciliationRule(models.Model):
    _name = 'bank.sync.reconciliation.rule'
    _description = 'Règle de Rapprochement Bancaire'
    _order = 'sequence, name'

    name = fields.Char(string='Nom', required=True)
    sequence = fields.Integer(string='Séquence', default=10)
    active = fields.Boolean(default=True)

    match_type = fields.Selection([
        ('amount', 'Montant exact'),
        ('amount_range', 'Plage de montant'),
        ('counterpart', 'Nom contrepartie'),
        ('reference', 'Référence'),
        ('iban', 'IBAN'),
        ('combined', 'Combiné')
    ], string='Type de correspondance', required=True, default='amount')

    match_value = fields.Char(string='Valeur')
    match_amount_min = fields.Float(string='Montant min')
    match_amount_max = fields.Float(string='Montant max')

    partner_id = fields.Many2one('res.partner', string='Partenaire par défaut')
    account_id = fields.Many2one('account.account', string='Compte comptable')
    category = fields.Selection([
        ('income', 'Revenu'),
        ('expense', 'Dépense'),
        ('transfer', 'Virement'),
        ('fee', 'Frais'),
        ('tax', 'Impôts'),
        ('other', 'Autre')
    ], string='Catégorie')

    auto_reconcile = fields.Boolean(string='Rapprochement automatique', default=False)
    company_id = fields.Many2one('res.company', string='Société', default=lambda self: self.env.company)

    @api.model
    def find_matching_rule(self, transaction):
        """Trouver une règle correspondant à une transaction"""
        rules = self.search([('active', '=', True)], order='sequence')

        for rule in rules:
            if rule._matches_transaction(transaction):
                return rule

        return self.env['bank.sync.reconciliation.rule']

    def _matches_transaction(self, transaction):
        """Vérifier si cette règle correspond à la transaction"""
        if self.match_type == 'amount':
            return abs(transaction.amount) == float(self.match_value or 0)

        elif self.match_type == 'amount_range':
            amount = abs(transaction.amount)
            return self.match_amount_min <= amount <= self.match_amount_max

        elif self.match_type == 'counterpart':
            return self.match_value.lower() in (transaction.counterpart_name or '').lower()

        elif self.match_type == 'iban':
            return self.match_value == transaction.counterpart_iban

        return False
