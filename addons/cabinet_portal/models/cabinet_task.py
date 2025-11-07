# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError


class CabinetTask(models.Model):
    """Gestion des tâches cabinet pour le suivi client"""
    _name = 'cabinet.task'
    _description = 'Tâche Cabinet'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'deadline asc, priority desc, id desc'

    name = fields.Char('Titre', required=True, tracking=True)
    description = fields.Text('Description')
    
    # Relations
    partner_id = fields.Many2one('res.partner', string='Client', required=True,
                                  domain="[('is_iseb_client', '=', True)]",
                                  tracking=True)
    assigned_to_id = fields.Many2one('res.users', string='Assigné à', 
                                      default=lambda self: self.env.user,
                                      tracking=True)
    company_id = fields.Many2one('res.company', string='Cabinet',
                                  default=lambda self: self.env.company)
    
    # Workflow
    state = fields.Selection([
        ('todo', 'À faire'),
        ('in_progress', 'En cours'),
        ('done', 'Terminé'),
        ('cancelled', 'Annulé'),
    ], string='État', default='todo', required=True, tracking=True)
    
    # Priorité et dates
    priority = fields.Selection([
        ('0', 'Basse'),
        ('1', 'Normale'),
        ('2', 'Haute'),
        ('3', 'Urgente'),
    ], string='Priorité', default='1', tracking=True)
    
    deadline = fields.Date('Échéance', tracking=True)
    is_overdue = fields.Boolean('En retard', compute='_compute_overdue', store=True)
    started_date = fields.Datetime('Démarré le', readonly=True)
    completed_date = fields.Datetime('Terminé le', readonly=True)
    
    # Catégories de tâches
    task_type = fields.Selection([
        ('declaration', 'Déclaration (TVA, impôts, etc.)'),
        ('document_review', 'Révision documents'),
        ('expense_validation', 'Validation notes de frais'),
        ('meeting', 'Réunion/RDV'),
        ('followup', 'Relance/Suivi'),
        ('reporting', 'Reporting'),
        ('other', 'Autre'),
    ], string='Type de tâche', default='other', tracking=True)
    
    # Liens vers documents/éléments liés
    document_id = fields.Many2one('client.document', string='Document lié')
    expense_id = fields.Many2one('expense.note', string='Note de frais liée')
    tva_declaration_id = fields.Many2one('tva.declaration', string='Déclaration TVA liée')
    
    # Temps estimé et passé
    estimated_hours = fields.Float('Heures estimées')
    spent_hours = fields.Float('Heures passées')
    
    # Notes
    internal_notes = fields.Text('Notes internes')
    
    @api.depends('deadline', 'state')
    def _compute_overdue(self):
        """Détermine si la tâche est en retard"""
        today = fields.Date.today()
        for task in self:
            task.is_overdue = (
                task.deadline 
                and task.deadline < today 
                and task.state not in ['done', 'cancelled']
            )
    
    def action_start(self):
        """Démarre la tâche"""
        for task in self:
            if task.state == 'todo':
                task.write({
                    'state': 'in_progress',
                    'started_date': fields.Datetime.now(),
                })
    
    def action_complete(self):
        """Marque la tâche comme terminée"""
        for task in self:
            if task.state != 'done':
                task.write({
                    'state': 'done',
                    'completed_date': fields.Datetime.now(),
                })
    
    def action_cancel(self):
        """Annule la tâche"""
        for task in self:
            task.state = 'cancelled'
    
    def action_reopen(self):
        """Réouvre une tâche terminée/annulée"""
        for task in self:
            if task.state in ['done', 'cancelled']:
                task.write({
                    'state': 'todo',
                    'completed_date': False,
                })
    
    @api.model
    def create(self, vals):
        """Crée une activité mail si deadline définie"""
        task = super().create(vals)
        if task.deadline and task.assigned_to_id:
            task.activity_schedule(
                'mail.mail_activity_data_todo',
                date_deadline=task.deadline,
                user_id=task.assigned_to_id.id,
                summary=task.name,
            )
        return task
    
    def write(self, vals):
        """Met à jour l'activité si deadline/assigné change"""
        res = super().write(vals)
        if 'deadline' in vals or 'assigned_to_id' in vals:
            for task in self:
                # Supprime anciennes activités et crée nouvelle
                task.activity_ids.action_feedback()
                if task.deadline and task.assigned_to_id and task.state not in ['done', 'cancelled']:
                    task.activity_schedule(
                        'mail.mail_activity_data_todo',
                        date_deadline=task.deadline,
                        user_id=task.assigned_to_id.id,
                        summary=task.name,
                    )
        return res
