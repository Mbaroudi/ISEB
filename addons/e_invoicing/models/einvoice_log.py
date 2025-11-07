# -*- coding: utf-8 -*-

from odoo import models, fields


class EInvoiceLog(models.Model):
    _name = 'einvoice.log'
    _description = 'Log Facture Électronique'
    _order = 'create_date desc'

    move_id = fields.Many2one('account.move', string='Facture', required=True, ondelete='cascade')
    action = fields.Selection([
        ('send', 'Envoi'),
        ('receive_ack', 'Accusé réception'),
        ('accept', 'Acceptation'),
        ('reject', 'Rejet')
    ], string='Action', required=True)

    state = fields.Selection([
        ('success', 'Succès'),
        ('error', 'Erreur'),
        ('warning', 'Avertissement')
    ], string='État', required=True)

    format_id = fields.Many2one('einvoice.format', string='Format')
    message = fields.Text(string='Message')
    technical_details = fields.Text(string='Détails techniques')
