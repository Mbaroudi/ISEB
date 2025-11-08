# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json


class ClientDashboard(models.Model):
    _name = 'client.dashboard'
    _description = 'Dashboard Client - Indicateurs financiers'
    _order = 'compute_date desc'

    name = fields.Char(
        string='Nom',
        compute='_compute_name',
        store=True
    )

    partner_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        ondelete='cascade',
        index=True
    )

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company
    )

    compute_date = fields.Datetime(
        string='Date de calcul',
        default=fields.Datetime.now,
        readonly=True
    )

    period_start = fields.Date(
        string='Début période',
        required=True,
        default=lambda self: fields.Date.today().replace(day=1)
    )

    period_end = fields.Date(
        string='Fin période',
        required=True,
        default=fields.Date.today
    )

    # Trésorerie
    cash_balance = fields.Monetary(
        string='Solde de trésorerie',
        currency_field='currency_id',
        compute='_compute_cash_balance',
        store=True,
        help="Solde actuel des comptes bancaires"
    )

    cash_evolution_data = fields.Text(
        string='Évolution trésorerie (JSON)',
        compute='_compute_cash_evolution',
        help="Données pour graphique évolution trésorerie sur 12 mois"
    )

    # Chiffre d'affaires
    revenue_mtd = fields.Monetary(
        string='CA du mois',
        currency_field='currency_id',
        compute='_compute_revenue',
        store=True,
        help="Chiffre d'affaires month-to-date"
    )

    revenue_ytd = fields.Monetary(
        string='CA de l\'année',
        currency_field='currency_id',
        compute='_compute_revenue',
        store=True,
        help="Chiffre d'affaires year-to-date"
    )

    revenue_last_month = fields.Monetary(
        string='CA mois dernier',
        currency_field='currency_id',
        compute='_compute_revenue',
        store=True
    )

    revenue_last_year = fields.Monetary(
        string='CA année dernière',
        currency_field='currency_id',
        compute='_compute_revenue',
        store=True
    )

    revenue_growth_mtd = fields.Float(
        string='Croissance CA mois (%)',
        compute='_compute_growth',
        store=True
    )

    revenue_growth_ytd = fields.Float(
        string='Croissance CA année (%)',
        compute='_compute_growth',
        store=True
    )

    # Charges
    expenses_mtd = fields.Monetary(
        string='Charges du mois',
        currency_field='currency_id',
        compute='_compute_expenses',
        store=True
    )

    expenses_ytd = fields.Monetary(
        string='Charges de l\'année',
        currency_field='currency_id',
        compute='_compute_expenses',
        store=True
    )

    # Résultat
    net_income_mtd = fields.Monetary(
        string='Résultat du mois',
        currency_field='currency_id',
        compute='_compute_net_income',
        store=True
    )

    net_income_ytd = fields.Monetary(
        string='Résultat de l\'année',
        currency_field='currency_id',
        compute='_compute_net_income',
        store=True
    )

    # TVA
    tva_due = fields.Monetary(
        string='TVA à décaisser',
        currency_field='currency_id',
        compute='_compute_tva',
        store=True,
        help="Montant de TVA à payer pour la période"
    )

    tva_collectee = fields.Monetary(
        string='TVA collectée',
        currency_field='currency_id',
        compute='_compute_tva',
        store=True
    )

    tva_deductible = fields.Monetary(
        string='TVA déductible',
        currency_field='currency_id',
        compute='_compute_tva',
        store=True
    )

    # Indicateurs clés (KPIs)
    margin_rate = fields.Float(
        string='Taux de marge (%)',
        compute='_compute_kpis',
        store=True,
        help="(CA - Charges) / CA * 100"
    )

    receivable_amount = fields.Monetary(
        string='Créances clients',
        currency_field='currency_id',
        compute='_compute_receivables',
        store=True,
        help="Montant total des factures clients impayées"
    )

    payable_amount = fields.Monetary(
        string='Dettes fournisseurs',
        currency_field='currency_id',
        compute='_compute_payables',
        store=True,
        help="Montant total des factures fournisseurs impayées"
    )

    overdue_receivable = fields.Monetary(
        string='Créances échues',
        currency_field='currency_id',
        compute='_compute_overdue',
        store=True
    )

    overdue_payable = fields.Monetary(
        string='Dettes échues',
        currency_field='currency_id',
        compute='_compute_overdue',
        store=True
    )

    currency_id = fields.Many2one(
        'res.currency',
        related='company_id.currency_id',
        string='Devise',
        readonly=True
    )

    # Données pour graphiques
    revenue_chart_data = fields.Text(
        string='Données CA (JSON)',
        compute='_compute_chart_data'
    )

    expenses_chart_data = fields.Text(
        string='Données charges (JSON)',
        compute='_compute_chart_data'
    )

    @api.depends('partner_id', 'period_start', 'period_end')
    def _compute_name(self):
        for record in self:
            if record.partner_id:
                period = f"{record.period_start.strftime('%m/%Y')}" if record.period_start else ''
                record.name = f"Dashboard {record.partner_id.name} - {period}"
            else:
                record.name = 'Dashboard'

    @api.depends('partner_id', 'company_id', 'period_end')
    def _compute_cash_balance(self):
        """Calcule le solde de trésorerie"""
        for record in self:
            # Récupérer tous les comptes bancaires (51xxxx)
            domain = [
                ('company_id', '=', record.company_id.id),
                ('code', '=like', '51%'),
                ('account_type', '=', 'asset_current'),
            ]
            bank_accounts = self.env['account.account'].search(domain)

            # Calculer le solde
            balance = 0.0
            for account in bank_accounts:
                balance += account.current_balance

            record.cash_balance = balance

    @api.depends('partner_id', 'company_id', 'period_start', 'period_end')
    def _compute_revenue(self):
        """Calcule le chiffre d'affaires"""
        for record in self:
            # CA mois en cours (MTD - Month To Date)
            month_start = record.period_start
            month_end = record.period_end

            moves_mtd = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', 'in', ['out_invoice', 'out_refund']),
                ('state', '=', 'posted'),
                ('date', '>=', month_start),
                ('date', '<=', month_end),
            ])

            revenue_mtd = sum(
                move.amount_total_signed if move.move_type == 'out_invoice'
                else -move.amount_total_signed
                for move in moves_mtd
            )
            record.revenue_mtd = revenue_mtd

            # CA année en cours (YTD - Year To Date)
            year_start = record.period_start.replace(month=1, day=1)

            moves_ytd = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', 'in', ['out_invoice', 'out_refund']),
                ('state', '=', 'posted'),
                ('date', '>=', year_start),
                ('date', '<=', record.period_end),
            ])

            revenue_ytd = sum(
                move.amount_total_signed if move.move_type == 'out_invoice'
                else -move.amount_total_signed
                for move in moves_ytd
            )
            record.revenue_ytd = revenue_ytd

            # CA mois dernier
            last_month_start = (record.period_start - relativedelta(months=1)).replace(day=1)
            last_month_end = record.period_start - timedelta(days=1)

            moves_last_month = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', 'in', ['out_invoice', 'out_refund']),
                ('state', '=', 'posted'),
                ('date', '>=', last_month_start),
                ('date', '<=', last_month_end),
            ])

            record.revenue_last_month = sum(
                move.amount_total_signed if move.move_type == 'out_invoice'
                else -move.amount_total_signed
                for move in moves_last_month
            )

            # CA année dernière
            last_year_start = year_start - relativedelta(years=1)
            last_year_end = record.period_end - relativedelta(years=1)

            moves_last_year = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', 'in', ['out_invoice', 'out_refund']),
                ('state', '=', 'posted'),
                ('date', '>=', last_year_start),
                ('date', '<=', last_year_end),
            ])

            record.revenue_last_year = sum(
                move.amount_total_signed if move.move_type == 'out_invoice'
                else -move.amount_total_signed
                for move in moves_last_year
            )

    @api.depends('partner_id', 'company_id', 'period_start', 'period_end')
    def _compute_expenses(self):
        """Calcule les charges"""
        for record in self:
            # Charges mois en cours
            month_start = record.period_start
            month_end = record.period_end

            moves_mtd = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', 'in', ['in_invoice', 'in_refund']),
                ('state', '=', 'posted'),
                ('date', '>=', month_start),
                ('date', '<=', month_end),
            ])

            expenses_mtd = sum(
                move.amount_total_signed if move.move_type == 'in_invoice'
                else -move.amount_total_signed
                for move in moves_mtd
            )
            record.expenses_mtd = abs(expenses_mtd)

            # Charges année en cours
            year_start = record.period_start.replace(month=1, day=1)

            moves_ytd = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', 'in', ['in_invoice', 'in_refund']),
                ('state', '=', 'posted'),
                ('date', '>=', year_start),
                ('date', '<=', record.period_end),
            ])

            expenses_ytd = sum(
                move.amount_total_signed if move.move_type == 'in_invoice'
                else -move.amount_total_signed
                for move in moves_ytd
            )
            record.expenses_ytd = abs(expenses_ytd)

    @api.depends('revenue_mtd', 'revenue_last_month', 'revenue_ytd', 'revenue_last_year')
    def _compute_growth(self):
        """Calcule la croissance du CA"""
        for record in self:
            # Croissance mensuelle
            if record.revenue_last_month:
                record.revenue_growth_mtd = ((record.revenue_mtd - record.revenue_last_month) / record.revenue_last_month) * 100
            else:
                record.revenue_growth_mtd = 0.0

            # Croissance annuelle
            if record.revenue_last_year:
                record.revenue_growth_ytd = ((record.revenue_ytd - record.revenue_last_year) / record.revenue_last_year) * 100
            else:
                record.revenue_growth_ytd = 0.0

    @api.depends('revenue_mtd', 'expenses_mtd', 'revenue_ytd', 'expenses_ytd')
    def _compute_net_income(self):
        """Calcule le résultat net"""
        for record in self:
            record.net_income_mtd = record.revenue_mtd - record.expenses_mtd
            record.net_income_ytd = record.revenue_ytd - record.expenses_ytd

    @api.depends('partner_id', 'company_id', 'period_start', 'period_end')
    def _compute_tva(self):
        """Calcule la TVA"""
        for record in self:
            # Récupérer les lignes de TVA pour la période
            tva_lines = self.env['account.move.line'].search([
                ('company_id', '=', record.company_id.id),
                ('move_id.partner_id', '=', record.partner_id.id),
                ('move_id.state', '=', 'posted'),
                ('move_id.date', '>=', record.period_start),
                ('move_id.date', '<=', record.period_end),
                ('tax_line_id', '!=', False),
            ])

            tva_collectee = 0.0
            tva_deductible = 0.0

            for line in tva_lines:
                if line.move_id.move_type in ['out_invoice', 'out_refund']:
                    tva_collectee += abs(line.balance)
                elif line.move_id.move_type in ['in_invoice', 'in_refund']:
                    tva_deductible += abs(line.balance)

            record.tva_collectee = tva_collectee
            record.tva_deductible = tva_deductible
            record.tva_due = tva_collectee - tva_deductible

    @api.depends('revenue_mtd', 'expenses_mtd')
    def _compute_kpis(self):
        """Calcule les indicateurs clés"""
        for record in self:
            if record.revenue_mtd:
                record.margin_rate = ((record.revenue_mtd - record.expenses_mtd) / record.revenue_mtd) * 100
            else:
                record.margin_rate = 0.0

    @api.depends('partner_id', 'company_id')
    def _compute_receivables(self):
        """Calcule les créances clients"""
        for record in self:
            receivables = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
            ])
            record.receivable_amount = sum(receivables.mapped('amount_residual'))

    @api.depends('partner_id', 'company_id')
    def _compute_payables(self):
        """Calcule les dettes fournisseurs"""
        for record in self:
            payables = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', '=', 'in_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
            ])
            record.payable_amount = sum(payables.mapped('amount_residual'))

    @api.depends('partner_id', 'company_id')
    def _compute_overdue(self):
        """Calcule les factures échues"""
        for record in self:
            today = fields.Date.today()

            # Créances échues
            overdue_receivables = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
                ('invoice_date_due', '<', today),
            ])
            record.overdue_receivable = sum(overdue_receivables.mapped('amount_residual'))

            # Dettes échues
            overdue_payables = self.env['account.move'].search([
                ('company_id', '=', record.company_id.id),
                ('partner_id', '=', record.partner_id.id),
                ('move_type', '=', 'in_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
                ('invoice_date_due', '<', today),
            ])
            record.overdue_payable = sum(overdue_payables.mapped('amount_residual'))

    def _compute_cash_evolution(self):
        """Calcule l'évolution de la trésorerie sur 12 mois"""
        for record in self:
            # Données pour graphique (12 derniers mois)
            data = []
            for i in range(12, 0, -1):
                month_date = (fields.Date.today() - relativedelta(months=i)).replace(day=1)
                # TODO: Calculer le solde de trésorerie à cette date
                data.append({
                    'month': month_date.strftime('%b %Y'),
                    'balance': record.cash_balance  # Placeholder
                })
            record.cash_evolution_data = json.dumps(data)

    def _compute_chart_data(self):
        """Génère les données pour les graphiques"""
        for record in self:
            # Données CA par mois (12 derniers mois)
            revenue_data = []
            expenses_data = []

            for i in range(12, 0, -1):
                month_date = fields.Date.today() - relativedelta(months=i)
                month_start = month_date.replace(day=1)
                month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)

                # CA du mois
                moves_revenue = self.env['account.move'].search([
                    ('company_id', '=', record.company_id.id),
                    ('partner_id', '=', record.partner_id.id),
                    ('move_type', 'in', ['out_invoice', 'out_refund']),
                    ('state', '=', 'posted'),
                    ('date', '>=', month_start),
                    ('date', '<=', month_end),
                ])

                revenue = sum(
                    move.amount_total_signed if move.move_type == 'out_invoice'
                    else -move.amount_total_signed
                    for move in moves_revenue
                )

                revenue_data.append({
                    'month': month_start.strftime('%b %Y'),
                    'amount': revenue
                })

                # Charges du mois
                moves_expenses = self.env['account.move'].search([
                    ('company_id', '=', record.company_id.id),
                    ('partner_id', '=', record.partner_id.id),
                    ('move_type', 'in', ['in_invoice', 'in_refund']),
                    ('state', '=', 'posted'),
                    ('date', '>=', month_start),
                    ('date', '<=', month_end),
                ])

                expenses = abs(sum(
                    move.amount_total_signed if move.move_type == 'in_invoice'
                    else -move.amount_total_signed
                    for move in moves_expenses
                ))

                expenses_data.append({
                    'month': month_start.strftime('%b %Y'),
                    'amount': expenses
                })

            record.revenue_chart_data = json.dumps(revenue_data)
            record.expenses_chart_data = json.dumps(expenses_data)

    def action_refresh_dashboard(self):
        """Rafraîchit le dashboard"""
        self.ensure_one()
        self.compute_date = fields.Datetime.now()
        # Force le recalcul de tous les champs computed
        self._compute_cash_balance()
        self._compute_revenue()
        self._compute_expenses()
        self._compute_tva()

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Dashboard actualisé'),
                'message': _('Les données ont été mises à jour'),
                'type': 'success',
            }
        }
