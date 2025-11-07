# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class ClientDocument(models.Model):
    _name = 'client.document'
    _description = 'Documents clients'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'upload_date desc'

    name = fields.Char(string='Nom', required=True, tracking=True)
    partner_id = fields.Many2one('res.partner', string='Client', required=True, ondelete='cascade')
    company_id = fields.Many2one('res.company', string='Société', required=True, default=lambda self: self.env.company)
    document_type = fields.Selection([
        ('invoice', 'Facture fournisseur'),
        ('contract', 'Contrat'),
        ('justificatif', 'Justificatif'),
        ('other', 'Autre'),
    ], string='Type', default='justificatif', required=True)
    file = fields.Binary(string='Fichier', required=True, attachment=True)
    filename = fields.Char(string='Nom fichier')
    upload_date = fields.Datetime(string='Date upload', default=fields.Datetime.now, readonly=True)
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('pending', 'En attente validation'),
        ('validated', 'Validé'),
        ('rejected', 'Rejeté'),
    ], default='draft', tracking=True)
    notes = fields.Text(string='Notes')
