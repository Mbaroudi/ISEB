# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError


class CabinetClient(models.Model):
    """Extension du modèle res.partner pour la gestion cabinet"""
    _inherit = 'res.partner'

    # Informations cabinet
    cabinet_id = fields.Many2one('res.company', string='Cabinet', 
                                  help='Cabinet comptable en charge du client')
    accountant_id = fields.Many2one('res.users', string='Expert-comptable référent')
    client_since = fields.Date(string='Client depuis', default=fields.Date.today)
    contract_type = fields.Selection([
        ('liberte', 'Formule Liberté (200€/mois)'),
        ('serenite', 'Formule Sérénité (350€/mois)'),
        ('pme', 'Formule PME (500€/mois)'),
    ], string='Formule contractuelle')
    monthly_fee = fields.Monetary(string='Honoraires mensuels', currency_field='currency_id')
    
    # Indicateurs de santé client
    health_score = fields.Selection([
        ('excellent', 'Excellent'),
        ('good', 'Bon'),
        ('warning', 'Attention'),
        ('critical', 'Critique'),
    ], string='Santé financière', compute='_compute_health_score', store=True)
    
    documents_pending_count = fields.Integer('Documents en attente', 
                                              compute='_compute_pending_counts')
    expenses_pending_count = fields.Integer('Notes de frais en attente',
                                             compute='_compute_pending_counts')
    tasks_overdue_count = fields.Integer('Tâches en retard',
                                          compute='_compute_pending_counts')
    
    # Statistiques
    total_revenue_ytd = fields.Monetary('CA annuel', compute='_compute_statistics')
    total_expenses_ytd = fields.Monetary('Charges annuelles', compute='_compute_statistics')
    margin_rate = fields.Float('Taux de marge (%)', compute='_compute_statistics')
    
    # Communication
    last_contact_date = fields.Date('Dernier contact')
    next_meeting_date = fields.Date('Prochain RDV')
    internal_notes = fields.Text('Notes internes cabinet')
    
    @api.depends('dashboard_ids', 'dashboard_ids.cash_balance', 
                 'dashboard_ids.overdue_receivable', 'dashboard_ids.overdue_payable')
    def _compute_health_score(self):
        """Calcule le score de santé financière du client"""
        for partner in self:
            if not partner.is_iseb_client or not partner.latest_dashboard_id:
                partner.health_score = False
                continue
            
            dashboard = partner.latest_dashboard_id
            score = 'excellent'
            
            # Critères d'alerte
            if dashboard.cash_balance < 0:
                score = 'critical'
            elif dashboard.overdue_receivable > dashboard.revenue_mtd * 0.5:
                score = 'warning'
            elif dashboard.overdue_payable > 0:
                score = 'warning' if score == 'excellent' else score
            elif dashboard.margin_rate < 10:
                score = 'warning' if score == 'excellent' else score
            
            partner.health_score = score
    
    @api.depends('is_iseb_client')
    def _compute_pending_counts(self):
        """Compte les éléments en attente de validation"""
        for partner in self:
            if not partner.is_iseb_client:
                partner.documents_pending_count = 0
                partner.expenses_pending_count = 0
                partner.tasks_overdue_count = 0
                continue
            
            # Documents en attente
            partner.documents_pending_count = self.env['client.document'].search_count([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['pending', 'submitted']),
            ])
            
            # Notes de frais en attente
            partner.expenses_pending_count = self.env['expense.note'].search_count([
                ('partner_id', '=', partner.id),
                ('state', '=', 'submitted'),
            ])
            
            # Tâches en retard
            partner.tasks_overdue_count = self.env['cabinet.task'].search_count([
                ('partner_id', '=', partner.id),
                ('state', '!=', 'done'),
                ('deadline', '<', fields.Date.today()),
            ])
    
    @api.depends('dashboard_ids', 'is_iseb_client')
    def _compute_statistics(self):
        """Calcule les statistiques annuelles"""
        for partner in self:
            if not partner.is_iseb_client or not partner.latest_dashboard_id:
                partner.total_revenue_ytd = 0
                partner.total_expenses_ytd = 0
                partner.margin_rate = 0
                continue
            
            dashboard = partner.latest_dashboard_id
            partner.total_revenue_ytd = dashboard.revenue_ytd
            partner.total_expenses_ytd = dashboard.expenses_ytd
            partner.margin_rate = dashboard.margin_rate
    
    def action_view_client_dashboard(self):
        """Ouvre le dashboard du client"""
        self.ensure_one()
        if not self.latest_dashboard_id:
            raise UserError("Aucun dashboard disponible pour ce client")
        
        return {
            'type': 'ir.actions.act_window',
            'name': f'Dashboard - {self.name}',
            'res_model': 'client.dashboard',
            'view_mode': 'form',
            'res_id': self.latest_dashboard_id.id,
            'target': 'current',
        }
    
    def action_view_pending_documents(self):
        """Affiche les documents en attente de validation"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Documents en attente',
            'res_model': 'client.document',
            'view_mode': 'tree,form',
            'domain': [('partner_id', '=', self.id), ('state', 'in', ['pending', 'submitted'])],
            'context': {'default_partner_id': self.id},
        }
    
    def action_view_pending_expenses(self):
        """Affiche les notes de frais en attente"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Notes de frais en attente',
            'res_model': 'expense.note',
            'view_mode': 'tree,form',
            'domain': [('partner_id', '=', self.id), ('state', '=', 'submitted')],
            'context': {'default_partner_id': self.id},
        }
    
    def action_create_task(self):
        """Crée une nouvelle tâche pour ce client"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Nouvelle tâche',
            'res_model': 'cabinet.task',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_partner_id': self.id},
        }
