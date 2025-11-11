# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import datetime


class BankTransaction(models.Model):
    _name = 'bank.sync.transaction'
    _description = 'Transaction Bancaire'
    _order = 'date desc, id desc'

    name = fields.Char(string='Libellé', required=True)
    transaction_id = fields.Char(string='ID Transaction', required=True, index=True)
    bank_account_id = fields.Many2one('bank.sync.account', string='Compte', required=True, ondelete='cascade')
    date = fields.Date(string='Date', required=True, index=True)
    value_date = fields.Date(string='Date de valeur')

    amount = fields.Monetary(string='Montant', currency_field='currency_id', required=True)
    currency_id = fields.Many2one(related='bank_account_id.currency_id', store=True)

    transaction_type = fields.Selection([
        ('debit', 'Débit'),
        ('credit', 'Crédit')
    ], string='Type', compute='_compute_transaction_type', store=True)

    category = fields.Selection([
        ('income', 'Revenu'),
        ('expense', 'Dépense'),
        ('transfer', 'Virement'),
        ('fee', 'Frais bancaires'),
        ('tax', 'Impôts/Taxes'),
        ('salary', 'Salaire'),
        ('refund', 'Remboursement'),
        ('other', 'Autre')
    ], string='Catégorie', default='other')

    state = fields.Selection([
        ('pending', 'En attente'),
        ('reconciled', 'Rapproché'),
        ('ignored', 'Ignoré')
    ], string='État', default='pending', required=True)

    invoice_id = fields.Many2one('account.move', string='Facture associée', domain="[('move_type', 'in', ['out_invoice', 'in_invoice'])]")
    payment_id = fields.Many2one('account.payment', string='Paiement associé')
    move_line_id = fields.Many2one('account.move.line', string='Écriture comptable')

    partner_id = fields.Many2one('res.partner', string='Partenaire')
    counterpart_name = fields.Char(string='Nom contrepartie')
    counterpart_iban = fields.Char(string='IBAN contrepartie')

    description = fields.Text(string='Description')
    notes = fields.Text(string='Notes')

    @api.depends('amount')
    def _compute_transaction_type(self):
        for trans in self:
            trans.transaction_type = 'credit' if trans.amount > 0 else 'debit'

    def action_reconcile(self):
        """Ouvrir l'assistant de rapprochement"""
        return {
            'name': _('Rapprocher transaction'),
            'type': 'ir.actions.act_window',
            'res_model': 'bank.transaction.reconcile.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_transaction_id': self.id}
        }

    def action_ignore(self):
        """Marquer comme ignoré"""
        self.write({'state': 'ignored'})

    def action_create_invoice(self):
        """Créer une facture à partir de cette transaction"""
        return {
            'name': _('Créer facture'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.move',
            'view_mode': 'form',
            'context': {
                'default_move_type': 'in_invoice' if self.amount < 0 else 'out_invoice',
                'default_partner_id': self.partner_id.id if self.partner_id else False,
                'default_invoice_date': self.date,
                'default_amount_total': abs(self.amount)
            }
        }
