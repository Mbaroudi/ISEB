# -*- coding: utf-8 -*-

from odoo import models, fields, api


class CabinetDashboard(models.Model):
    """Dashboard agrégé pour le cabinet - vue d'ensemble de tous les clients"""
    _name = 'cabinet.dashboard'
    _description = 'Dashboard Cabinet'
    _order = 'compute_date desc'

    name = fields.Char('Nom', compute='_compute_name', store=True)
    company_id = fields.Many2one('res.company', string='Cabinet',
                                  default=lambda self: self.env.company,
                                  required=True)
    compute_date = fields.Datetime('Date de calcul', default=fields.Datetime.now,
                                     required=True)
    period_start = fields.Date('Début période', required=True)
    period_end = fields.Date('Fin période', required=True)
    
    # Statistiques clients
    total_clients = fields.Integer('Nombre de clients', compute='_compute_client_stats',
                                     store=True)
    active_clients = fields.Integer('Clients actifs', compute='_compute_client_stats',
                                      store=True)
    clients_excellent = fields.Integer('Clients excellents', compute='_compute_client_stats',
                                         store=True)
    clients_warning = fields.Integer('Clients en alerte', compute='_compute_client_stats',
                                       store=True)
    clients_critical = fields.Integer('Clients critiques', compute='_compute_client_stats',
                                        store=True)
    
    # Agrégation financière de tous les clients
    total_revenue_all = fields.Monetary('CA total clients', compute='_compute_financial_stats',
                                         store=True, currency_field='currency_id')
    total_expenses_all = fields.Monetary('Charges totales clients', compute='_compute_financial_stats',
                                          store=True, currency_field='currency_id')
    total_net_income = fields.Monetary('Résultat net total', compute='_compute_financial_stats',
                                        store=True, currency_field='currency_id')
    average_margin_rate = fields.Float('Taux de marge moyen (%)', compute='_compute_financial_stats',
                                        store=True)
    
    # Chiffre d'affaires du cabinet
    cabinet_revenue_mtd = fields.Monetary('CA cabinet mensuel', compute='_compute_cabinet_revenue',
                                           store=True, currency_field='currency_id')
    cabinet_revenue_ytd = fields.Monetary('CA cabinet annuel', compute='_compute_cabinet_revenue',
                                           store=True, currency_field='currency_id')
    
    # Tâches et validations en attente
    total_tasks = fields.Integer('Tâches totales', compute='_compute_task_stats',
                                   store=True)
    tasks_overdue = fields.Integer('Tâches en retard', compute='_compute_task_stats',
                                     store=True)
    tasks_this_week = fields.Integer('Tâches cette semaine', compute='_compute_task_stats',
                                       store=True)
    
    documents_pending = fields.Integer('Documents à valider', compute='_compute_validation_stats',
                                         store=True)
    expenses_pending = fields.Integer('Notes de frais à valider', compute='_compute_validation_stats',
                                        store=True)
    
    currency_id = fields.Many2one('res.currency', string='Devise',
                                   default=lambda self: self.env.company.currency_id)
    
    @api.depends('period_start', 'period_end', 'company_id')
    def _compute_name(self):
        """Génère le nom du dashboard"""
        for record in self:
            if record.period_start and record.period_end:
                record.name = f"Dashboard Cabinet {record.period_start.strftime('%m/%Y')}"
            else:
                record.name = f"Dashboard Cabinet {fields.Date.today().strftime('%m/%Y')}"
    
    @api.depends('company_id', 'compute_date')
    def _compute_client_stats(self):
        """Calcule les statistiques clients"""
        for record in self:
            clients = self.env['res.partner'].search([
                ('is_iseb_client', '=', True),
                ('cabinet_id', '=', record.company_id.id),
            ])
            
            record.total_clients = len(clients)
            record.active_clients = len(clients.filtered(lambda c: c.active))
            record.clients_excellent = len(clients.filtered(lambda c: c.health_score == 'excellent'))
            record.clients_warning = len(clients.filtered(lambda c: c.health_score == 'warning'))
            record.clients_critical = len(clients.filtered(lambda c: c.health_score == 'critical'))
    
    @api.depends('company_id', 'period_start', 'period_end')
    def _compute_financial_stats(self):
        """Calcule les statistiques financières agrégées"""
        for record in self:
            clients = self.env['res.partner'].search([
                ('is_iseb_client', '=', True),
                ('cabinet_id', '=', record.company_id.id),
            ])
            
            # Agrégation des dashboards clients
            dashboards = self.env['client.dashboard'].search([
                ('partner_id', 'in', clients.ids),
                ('period_start', '>=', record.period_start),
                ('period_end', '<=', record.period_end),
            ])
            
            record.total_revenue_all = sum(dashboards.mapped('revenue_mtd'))
            record.total_expenses_all = sum(dashboards.mapped('expenses_mtd'))
            record.total_net_income = sum(dashboards.mapped('net_income_mtd'))
            
            # Calcul de la marge moyenne
            if dashboards:
                margins = dashboards.filtered(lambda d: d.margin_rate).mapped('margin_rate')
                record.average_margin_rate = sum(margins) / len(margins) if margins else 0
            else:
                record.average_margin_rate = 0
    
    @api.depends('company_id', 'period_start', 'period_end')
    def _compute_cabinet_revenue(self):
        """Calcule le CA du cabinet (honoraires clients)"""
        for record in self:
            clients = self.env['res.partner'].search([
                ('is_iseb_client', '=', True),
                ('cabinet_id', '=', record.company_id.id),
            ])
            
            # Honoraires mensuels
            record.cabinet_revenue_mtd = sum(clients.mapped('monthly_fee'))
            
            # Honoraires annuels (mensuel * 12)
            record.cabinet_revenue_ytd = record.cabinet_revenue_mtd * 12
    
    @api.depends('company_id', 'period_start', 'period_end')
    def _compute_task_stats(self):
        """Calcule les statistiques de tâches"""
        for record in self:
            clients = self.env['res.partner'].search([
                ('is_iseb_client', '=', True),
                ('cabinet_id', '=', record.company_id.id),
            ])
            
            # Toutes les tâches non terminées
            all_tasks = self.env['cabinet.task'].search([
                ('partner_id', 'in', clients.ids),
                ('state', 'not in', ['done', 'cancelled']),
            ])
            
            record.total_tasks = len(all_tasks)
            record.tasks_overdue = len(all_tasks.filtered('is_overdue'))
            
            # Tâches de cette semaine
            from datetime import datetime, timedelta
            week_end = fields.Date.today() + timedelta(days=7)
            record.tasks_this_week = len(all_tasks.filtered(
                lambda t: t.deadline and t.deadline <= week_end
            ))
    
    @api.depends('company_id')
    def _compute_validation_stats(self):
        """Calcule les éléments en attente de validation"""
        for record in self:
            clients = self.env['res.partner'].search([
                ('is_iseb_client', '=', True),
                ('cabinet_id', '=', record.company_id.id),
            ])
            
            # Documents en attente
            record.documents_pending = self.env['client.document'].search_count([
                ('partner_id', 'in', clients.ids),
                ('state', 'in', ['pending', 'submitted']),
            ])
            
            # Notes de frais en attente
            record.expenses_pending = self.env['expense.note'].search_count([
                ('partner_id', 'in', clients.ids),
                ('state', '=', 'submitted'),
            ])
    
    def action_refresh(self):
        """Recalcule toutes les statistiques"""
        self.ensure_one()
        self.compute_date = fields.Datetime.now()
        # Force recalculation of all computed fields
        self._compute_client_stats()
        self._compute_financial_stats()
        self._compute_cabinet_revenue()
        self._compute_task_stats()
        self._compute_validation_stats()
    
    def action_view_clients(self):
        """Affiche la liste des clients"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Clients',
            'res_model': 'res.partner',
            'view_mode': 'tree,form',
            'domain': [('is_iseb_client', '=', True), ('cabinet_id', '=', self.company_id.id)],
            'context': {'default_is_iseb_client': True, 'default_cabinet_id': self.company_id.id},
        }
    
    def action_view_tasks(self):
        """Affiche toutes les tâches"""
        self.ensure_one()
        clients = self.env['res.partner'].search([
            ('is_iseb_client', '=', True),
            ('cabinet_id', '=', self.company_id.id),
        ])
        return {
            'type': 'ir.actions.act_window',
            'name': 'Tâches',
            'res_model': 'cabinet.task',
            'view_mode': 'tree,form',
            'domain': [('partner_id', 'in', clients.ids)],
        }
    
    def action_view_pending_validations(self):
        """Affiche les éléments à valider"""
        self.ensure_one()
        clients = self.env['res.partner'].search([
            ('is_iseb_client', '=', True),
            ('cabinet_id', '=', self.company_id.id),
        ])
        
        # Retourne une action avec plusieurs vues possibles
        return {
            'type': 'ir.actions.act_window',
            'name': 'Documents à valider',
            'res_model': 'client.document',
            'view_mode': 'tree,form',
            'domain': [('partner_id', 'in', clients.ids), ('state', 'in', ['pending', 'submitted'])],
        }
