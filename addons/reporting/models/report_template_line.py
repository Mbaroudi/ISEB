# -*- coding: utf-8 -*-

from odoo import models, fields


class ReportTemplateLine(models.Model):
    _name = 'custom.report.template.line'
    _description = 'Ligne de Template de Rapport'
    _order = 'sequence'

    template_id = fields.Many2one('custom.report.template', string='Template', required=True, ondelete='cascade')
    sequence = fields.Integer(string='Séquence', default=10)
    name = fields.Char(string='Libellé', required=True)

    computation_type = fields.Selection([
        ('account_balance', 'Solde de comptes'),
        ('sum', 'Somme'),
        ('formula', 'Formule'),
        ('python', 'Code Python')
    ], string='Type de calcul', required=True, default='account_balance')

    account_ids = fields.Many2many('account.account', string='Comptes')
    formula = fields.Char(string='Formule')
    python_code = fields.Text(string='Code Python')

    level = fields.Integer(string='Niveau', default=0)
    style = fields.Selection([
        ('normal', 'Normal'),
        ('bold', 'Gras'),
        ('total', 'Total'),
        ('title', 'Titre')
    ], string='Style', default='normal')
