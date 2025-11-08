# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import datetime
import json


class CustomReport(models.Model):
    _name = 'custom.report'
    _description = 'Rapport Personnalisé'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    name = fields.Char(string='Nom', required=True, tracking=True)
    code = fields.Char(string='Code', required=True, index=True)
    template_id = fields.Many2one('custom.report.template', string='Template', tracking=True)

    report_type = fields.Selection([
        ('balance_sheet', 'Bilan'),
        ('income_statement', 'Compte de résultat'),
        ('cash_flow', 'Flux de trésorerie'),
        ('vat', 'Déclaration TVA'),
        ('aged_balance', 'Balance âgée'),
        ('custom', 'Personnalisé')
    ], string='Type', required=True, default='custom')

    period_type = fields.Selection([
        ('month', 'Mensuel'),
        ('quarter', 'Trimestriel'),
        ('year', 'Annuel'),
        ('custom', 'Personnalisé')
    ], string='Période', default='month')

    date_from = fields.Date(string='Du')
    date_to = fields.Date(string='Au')

    comparison_enabled = fields.Boolean(string='Comparaison N-1', default=False)
    budget_comparison = fields.Boolean(string='Comparaison budget', default=False)

    line_ids = fields.One2many('custom.report.line', 'report_id', string='Lignes')
    company_id = fields.Many2one('res.company', string='Société', default=lambda self: self.env.company)

    output_format = fields.Selection([
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
        ('json', 'JSON')
    ], string='Format', default='pdf')

    auto_send = fields.Boolean(string='Envoi automatique')
    recipient_ids = fields.Many2many('res.partner', string='Destinataires')
    schedule_frequency = fields.Selection([
        ('daily', 'Quotidien'),
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel')
    ], string='Fréquence')

    last_generated = fields.Datetime(string='Dernière génération', readonly=True)
    active = fields.Boolean(default=True)

    def action_generate(self):
        """Générer le rapport"""
        self.ensure_one()

        # Calculer les données
        data = self._compute_report_data()

        # Générer selon le format
        if self.output_format == 'pdf':
            return self._generate_pdf(data)
        elif self.output_format == 'excel':
            return self._generate_excel(data)
        elif self.output_format == 'csv':
            return self._generate_csv(data)
        else:
            return {'data': data}

    def _compute_report_data(self):
        """Calculer les données du rapport"""
        lines_data = []

        for line in self.line_ids:
            value = line._compute_value(self.date_from, self.date_to)
            lines_data.append({
                'name': line.name,
                'value': value,
                'level': line.level
            })

        return {
            'name': self.name,
            'period': f"{self.date_from} - {self.date_to}",
            'lines': lines_data
        }

    def _generate_pdf(self, data):
        """Générer PDF avec QWeb"""
        return self.env.ref('reporting.report_custom_pdf').report_action(self, data=data)

    def _generate_excel(self, data):
        """Générer Excel avec xlsxwriter"""
        import io
        import xlsxwriter

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet(self.name[:31])

        row = 0
        worksheet.write(row, 0, self.name)
        row += 2

        for line in data['lines']:
            worksheet.write(row, 0, line['name'])
            worksheet.write(row, 1, line['value'])
            row += 1

        workbook.close()
        output.seek(0)

        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/?data={output.getvalue().hex()}&filename={self.name}.xlsx',
            'target': 'self'
        }

    @api.model
    def cron_generate_scheduled_reports(self):
        """Cron pour génération automatique"""
        reports = self.search([('auto_send', '=', True), ('schedule_frequency', '!=', False)])

        for report in reports:
            # Vérifier si c'est le moment de générer
            if report._should_generate():
                report.action_generate()
                report.last_generated = fields.Datetime.now()

    def _should_generate(self):
        """Vérifier si le rapport doit être généré"""
        if not self.last_generated:
            return True

        delta = datetime.now() - self.last_generated

        if self.schedule_frequency == 'daily' and delta.days >= 1:
            return True
        elif self.schedule_frequency == 'weekly' and delta.days >= 7:
            return True
        elif self.schedule_frequency == 'monthly' and delta.days >= 30:
            return True

        return False
