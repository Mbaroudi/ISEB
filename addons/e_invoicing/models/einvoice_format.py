# -*- coding: utf-8 -*-

from odoo import models, fields


class EInvoiceFormat(models.Model):
    _name = 'einvoice.format'
    _description = 'Format de Facture Électronique'

    name = fields.Char(string='Nom', required=True)
    code = fields.Char(string='Code', required=True)

    format_type = fields.Selection([
        ('facturx', 'Factur-X (FR)'),
        ('chorus_pro', 'Chorus Pro (FR)'),
        ('peppol', 'Peppol (EU)'),
        ('ubl', 'UBL 2.1'),
        ('cii', 'CII D16B')
    ], string='Type', required=True)

    description = fields.Text(string='Description')
    active = fields.Boolean(default=True)
