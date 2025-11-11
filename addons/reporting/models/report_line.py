# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ReportLine(models.Model):
    _name = 'custom.report.line'
    _description = 'Ligne de Rapport'
    _order = 'sequence'

    report_id = fields.Many2one('custom.report', string='Rapport', required=True, ondelete='cascade')
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

    def _compute_value(self, date_from, date_to):
        """Calculer la valeur de cette ligne"""
        self.ensure_one()

        if self.computation_type == 'account_balance':
            domain = [
                ('account_id', 'in', self.account_ids.ids),
                ('date', '>=', date_from),
                ('date', '<=', date_to)
            ]
            move_lines = self.env['account.move.line'].search(domain)
            return sum(move_lines.mapped('balance'))

        elif self.computation_type == 'formula':
            # Évaluer la formule
            return self._eval_formula(date_from, date_to)

        return 0.0

    def _eval_formula(self, date_from, date_to):
        """Évaluer une formule"""
        # Placeholder pour évaluation de formules
        return 0.0
