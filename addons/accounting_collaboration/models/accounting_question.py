# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class AccountingQuestion(models.Model):
    """
    Questions et fils de discussion sur documents comptables
    """
    _name = 'accounting.question'
    _description = 'Question Comptable'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'priority desc, create_date desc'

    # Informations de base
    name = fields.Char(
        string="Sujet",
        required=True,
        tracking=True,
        help="Titre court de la question"
    )
    description = fields.Html(
        string="Description",
        help="Description détaillée de la question"
    )

    # Type de question
    question_type = fields.Selection([
        ('missing_document', 'Document manquant'),
        ('line_clarification', 'Clarification ligne'),
        ('bank_statement', 'Relevé bancaire'),
        ('vat_question', 'Question TVA'),
        ('correction_request', 'Demande de correction'),
        ('general', 'Question générale'),
    ], string="Type", required=True, default='general', tracking=True)

    # Statut workflow
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('pending', 'En attente'),
        ('answered', 'Répondu'),
        ('resolved', 'Résolu'),
        ('closed', 'Fermé'),
    ], string="Statut", default='draft', required=True, tracking=True)

    # Priorité
    priority = fields.Selection([
        ('0', 'Basse'),
        ('1', 'Normale'),
        ('2', 'Haute'),
        ('3', 'Urgente'),
    ], string="Priorité", default='1', tracking=True)

    # Participants
    user_id = fields.Many2one(
        'res.users',
        string="Créé par",
        default=lambda self: self.env.user,
        required=True,
        tracking=True
    )
    assigned_to_id = fields.Many2one(
        'res.users',
        string="Assigné à",
        tracking=True,
        domain="[('groups_id', 'in', [ref('account.group_account_user'), ref('account.group_account_manager')])]",
        help="Utilisateur responsable de répondre à cette question"
    )

    # Documents liés
    move_id = fields.Many2one(
        'account.move',
        string="Pièce comptable",
        ondelete='cascade',
        help="Pièce comptable concernée par la question"
    )
    document_id = fields.Many2one(
        'client_portal.document',
        string="Document",
        ondelete='cascade',
        help="Document du portail client concerné"
    )
    expense_note_id = fields.Many2one(
        'client_portal.expense_note',
        string="Note de frais",
        ondelete='cascade',
        help="Note de frais concernée"
    )

    # Messages et discussion
    message_ids = fields.One2many(
        'accounting.message',
        'question_id',
        string="Messages"
    )
    message_count = fields.Integer(
        string="Nombre de messages",
        compute='_compute_message_count',
        store=True
    )

    # Dates importantes
    create_date = fields.Datetime(string="Date de création", readonly=True)
    resolved_date = fields.Datetime(string="Date de résolution", readonly=True)
    closed_date = fields.Datetime(string="Date de fermeture", readonly=True)

    # Métriques
    response_time_hours = fields.Float(
        string="Temps de réponse (heures)",
        compute='_compute_response_time',
        store=True,
        help="Temps écoulé entre création et première réponse"
    )
    resolution_time_hours = fields.Float(
        string="Temps de résolution (heures)",
        compute='_compute_resolution_time',
        store=True,
        help="Temps écoulé entre création et résolution"
    )

    # Champs calculés
    has_attachment = fields.Boolean(
        string="Contient pièces jointes",
        compute='_compute_has_attachment'
    )
    partner_id = fields.Many2one(
        'res.partner',
        string="Client",
        compute='_compute_partner',
        store=True
    )

    company_id = fields.Many2one(
        'res.company',
        string="Société",
        default=lambda self: self.env.company,
        required=True
    )

    @api.depends('message_ids')
    def _compute_message_count(self):
        """Calcule le nombre de messages"""
        for question in self:
            question.message_count = len(question.message_ids)

    @api.depends('create_date', 'message_ids.create_date', 'message_ids.user_id')
    def _compute_response_time(self):
        """Calcule le temps de première réponse"""
        for question in self:
            if not question.create_date:
                question.response_time_hours = 0
                continue

            # Cherche le premier message qui n'est pas de l'auteur de la question
            first_response = question.message_ids.filtered(
                lambda m: m.user_id != question.user_id
            ).sorted('create_date')

            if first_response:
                delta = first_response[0].create_date - question.create_date
                question.response_time_hours = delta.total_seconds() / 3600.0
            else:
                question.response_time_hours = 0

    @api.depends('create_date', 'resolved_date')
    def _compute_resolution_time(self):
        """Calcule le temps de résolution"""
        for question in self:
            if question.create_date and question.resolved_date:
                delta = question.resolved_date - question.create_date
                question.resolution_time_hours = delta.total_seconds() / 3600.0
            else:
                question.resolution_time_hours = 0

    @api.depends('message_ids.attachment_ids')
    def _compute_has_attachment(self):
        """Vérifie si la question contient des pièces jointes"""
        for question in self:
            question.has_attachment = bool(
                question.message_ids.filtered(lambda m: m.attachment_ids)
            )

    @api.depends('move_id.partner_id', 'document_id.partner_id', 'expense_note_id.partner_id')
    def _compute_partner(self):
        """Détermine le client concerné"""
        for question in self:
            if question.move_id:
                question.partner_id = question.move_id.partner_id
            elif question.document_id:
                question.partner_id = question.document_id.partner_id
            elif question.expense_note_id:
                question.partner_id = question.expense_note_id.partner_id
            else:
                question.partner_id = False

    @api.model
    def create(self, vals):
        """Création avec notification"""
        question = super().create(vals)

        # Auto-assignation si pas d'assignation
        if not question.assigned_to_id:
            question._auto_assign()

        # Change le statut en "pending" si créé directement en draft
        if question.state == 'draft':
            question.state = 'pending'

        # Notification
        question._send_creation_notification()

        return question

    def write(self, vals):
        """Mise à jour avec tracking des changements de statut"""
        # Tracking des dates importantes
        if 'state' in vals:
            if vals['state'] == 'resolved' and not self.resolved_date:
                vals['resolved_date'] = fields.Datetime.now()
            elif vals['state'] == 'closed' and not self.closed_date:
                vals['closed_date'] = fields.Datetime.now()

        result = super().write(vals)

        # Notification sur changement d'assignation
        if 'assigned_to_id' in vals:
            self._send_assignment_notification()

        # Notification sur changement de statut
        if 'state' in vals:
            self._send_state_change_notification(vals['state'])

        return result

    def action_submit(self):
        """Soumettre la question (passe de draft à pending)"""
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_("Seules les questions en brouillon peuvent être soumises."))

        self.state = 'pending'
        self._send_creation_notification()

    def action_mark_answered(self):
        """Marquer comme répondu"""
        self.ensure_one()
        if self.state not in ['pending']:
            raise UserError(_("Cette question ne peut pas être marquée comme répondue."))

        self.state = 'answered'

    def action_resolve(self):
        """Résoudre la question"""
        self.ensure_one()
        if self.state not in ['pending', 'answered']:
            raise UserError(_("Cette question ne peut pas être résolue."))

        self.write({
            'state': 'resolved',
            'resolved_date': fields.Datetime.now(),
        })

    def action_close(self):
        """Fermer la question"""
        self.ensure_one()
        if self.state != 'resolved':
            raise UserError(_("Seules les questions résolues peuvent être fermées."))

        self.write({
            'state': 'closed',
            'closed_date': fields.Datetime.now(),
        })

    def action_reopen(self):
        """Rouvrir une question fermée"""
        self.ensure_one()
        if self.state not in ['resolved', 'closed']:
            raise UserError(_("Cette question ne peut pas être rouverte."))

        self.state = 'pending'

    def _auto_assign(self):
        """Auto-assignation intelligente"""
        self.ensure_one()

        # Règle 1: Si question sur une pièce comptable, assigner au comptable de la société
        if self.move_id:
            accountant = self.env['res.users'].search([
                ('groups_id', 'in', [self.env.ref('account.group_account_manager').id]),
                ('company_id', '=', self.company_id.id),
            ], limit=1)
            if accountant:
                self.assigned_to_id = accountant
                return

        # Règle 2: Assigner à un comptable disponible
        accountant = self.env['res.users'].search([
            ('groups_id', 'in', [self.env.ref('account.group_account_user').id]),
            ('company_id', '=', self.company_id.id),
        ], limit=1)

        if accountant:
            self.assigned_to_id = accountant

    def _send_creation_notification(self):
        """Envoie une notification de création"""
        self.ensure_one()

        if self.assigned_to_id:
            # Créer une activité pour la personne assignée
            self.activity_schedule(
                'mail.mail_activity_data_todo',
                user_id=self.assigned_to_id.id,
                summary=f"Nouvelle question: {self.name}",
                note=self.description or '',
            )

    def _send_assignment_notification(self):
        """Envoie une notification d'assignation"""
        self.ensure_one()

        if self.assigned_to_id:
            self.message_post(
                body=f"Question assignée à {self.assigned_to_id.name}",
                message_type='notification',
                subtype_xmlid='mail.mt_note',
            )

    def _send_state_change_notification(self, new_state):
        """Envoie une notification de changement de statut"""
        self.ensure_one()

        state_labels = dict(self._fields['state'].selection)
        self.message_post(
            body=f"Statut changé en: {state_labels.get(new_state)}",
            message_type='notification',
            subtype_xmlid='mail.mt_note',
        )

    def name_get(self):
        """Affichage personnalisé"""
        result = []
        for question in self:
            name = f"[{question.question_type}] {question.name}"
            result.append((question.id, name))
        return result
