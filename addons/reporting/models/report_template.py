# -*- coding: utf-8 -*-

from odoo import models, fields


class ReportTemplate(models.Model):
    _name = 'custom.report.template'
    _description = 'Template de Rapport'

    name = fields.Char(string='Nom', required=True)
    code = fields.Char(string='Code', required=True)
    report_type = fields.Selection([
        ('balance_sheet', 'Bilan'),
        ('income_statement', 'Compte de résultat'),
        ('cash_flow', 'Flux de trésorerie'),
        ('vat', 'TVA'),
        ('custom', 'Personnalisé')
    ], string='Type', required=True)

    line_ids = fields.One2many('custom.report.template.line', 'template_id', string='Lignes')
    description = fields.Text(string='Description')
    active = fields.Boolean(default=True)
