# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class ExpenseNote(models.Model):
    _name = 'expense.note'
    _description = 'Notes de frais'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'expense_date desc'

    name = fields.Char(string='Libellé', required=True, tracking=True)
    partner_id = fields.Many2one('res.partner', string='Client', required=True, ondelete='cascade')
    company_id = fields.Many2one('res.company', string='Société', required=True, default=lambda self: self.env.company)
    expense_date = fields.Date(string='Date dépense', required=True, default=fields.Date.today)
    category = fields.Selection([
        ('meal', 'Repas'),
        ('transport', 'Transport'),
        ('accommodation', 'Hébergement'),
        ('fuel', 'Carburant'),
        ('parking', 'Stationnement'),
        ('other', 'Autre'),
    ], string='Catégorie', required=True)
    amount = fields.Monetary(string='Montant TTC', required=True, currency_field='currency_id')
    tva_amount = fields.Monetary(string='Montant TVA', currency_field='currency_id')
    receipt_image = fields.Binary(string='Photo justificatif', attachment=True)
    receipt_filename = fields.Char(string='Nom fichier')
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('submitted', 'Soumis'),
        ('approved', 'Approuvé'),
        ('paid', 'Remboursé'),
        ('rejected', 'Rejeté'),
    ], default='draft', tracking=True)
    currency_id = fields.Many2one('res.currency', related='company_id.currency_id', readonly=True)
    notes = fields.Text(string='Notes')

    def action_submit(self):
        self.write({'state': 'submitted'})

    def action_approve(self):
        self.write({'state': 'approved'})

    def action_pay(self):
        self.write({'state': 'paid'})

    def action_reject(self):
        self.write({'state': 'rejected'})

    def action_reset_draft(self):
        self.write({'state': 'draft'})

    def action_view_receipt(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/image?model=expense.note&field=receipt_image&id={self.id}',
            'target': 'new',
        }
