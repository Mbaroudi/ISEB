# -*- coding: utf-8 -*-

import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class FiscalObligation(models.Model):
    """Obligations fiscales et sociales (TVA, URSSAF, IS, IR, DSN, etc.)"""
    _name = 'fiscal.obligation'
    _description = 'Obligation fiscale et sociale'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'due_date asc, priority desc'

    name = fields.Char(
        string='Référence',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('Nouveau')
    )

    # Type et périodicité
    obligation_type = fields.Selection([
        ('tva', 'TVA'),
        ('urssaf', 'URSSAF'),
        ('is', 'Impôt sur les Sociétés'),
        ('ir', 'Impôt sur le Revenu'),
        ('dsn', 'DSN (Déclaration Sociale Nominative)'),
        ('cfe', 'CFE (Cotisation Foncière des Entreprises)'),
        ('cvae', 'CVAE (Cotisation sur la Valeur Ajoutée)'),
        ('taxe_apprentissage', 'Taxe d\'apprentissage'),
        ('formation_pro', 'Formation professionnelle'),
        ('other', 'Autre'),
    ], string='Type', required=True, tracking=True)

    periodicity = fields.Selection([
        ('monthly', 'Mensuelle'),
        ('quarterly', 'Trimestrielle'),
        ('annual', 'Annuelle'),
        ('biannual', 'Semestrielle'),
        ('one_time', 'Ponctuelle'),
    ], string='Périodicité', required=True, default='monthly')

    # Période concernée
    period_start = fields.Date(string='Début période', required=True)
    period_end = fields.Date(string='Fin période', required=True)
    period_name = fields.Char(
        string='Période',
        compute='_compute_period_name',
        store=True
    )

    # Échéance
    due_date = fields.Date(string='Date limite', required=True, tracking=True)
    days_until_due = fields.Integer(
        string='Jours restants',
        compute='_compute_days_until_due',
        store=True
    )
    is_overdue = fields.Boolean(
        string='En retard',
        compute='_compute_is_overdue',
        store=True
    )

    # Montants
    estimated_amount = fields.Monetary(
        string='Montant estimé',
        currency_field='currency_id',
        help="Montant estimé automatiquement depuis la comptabilité"
    )
    actual_amount = fields.Monetary(
        string='Montant réel',
        currency_field='currency_id',
        tracking=True
    )
    penalty_amount = fields.Monetary(
        string='Pénalités',
        currency_field='currency_id',
        help="Montant des pénalités de retard"
    )
    total_amount = fields.Monetary(
        string='Montant total',
        compute='_compute_total_amount',
        store=True,
        currency_field='currency_id'
    )
    currency_id = fields.Many2one(
        'res.currency',
        string='Devise',
        default=lambda self: self.env.company.currency_id
    )

    # Responsabilité
    partner_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        ondelete='cascade',
        tracking=True
    )
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company
    )
    responsible_user_id = fields.Many2one(
        'res.users',
        string='Responsable',
        default=lambda self: self.env.user,
        tracking=True
    )
    payment_responsible = fields.Selection([
        ('client', 'Client'),
        ('accountant', 'Comptable (délégation)'),
    ], string='Paiement par', default='client', required=True, tracking=True)

    # État
    state = fields.Selection([
        ('todo', 'À faire'),
        ('in_progress', 'En cours'),
        ('waiting', 'En attente validation'),
        ('paid', 'Payé'),
        ('late', 'En retard'),
        ('dispute', 'Litige'),
        ('cancelled', 'Annulé'),
    ], string='État', default='todo', required=True, tracking=True)

    priority = fields.Selection([
        ('0', 'Bas'),
        ('1', 'Normal'),
        ('2', 'Élevé'),
        ('3', 'Urgent'),
    ], string='Priorité', default='1', compute='_compute_priority', store=True)

    # Paiement
    payment_date = fields.Date(string='Date de paiement', tracking=True)
    payment_reference = fields.Char(string='Référence paiement')
    payment_method = fields.Selection([
        ('transfer', 'Virement'),
        ('direct_debit', 'Prélèvement automatique'),
        ('check', 'Chèque'),
        ('online', 'Paiement en ligne'),
        ('other', 'Autre'),
    ], string='Moyen de paiement')

    # Documents liés
    document_ids = fields.Many2many(
        'client.document',
        'fiscal_obligation_document_rel',
        'obligation_id',
        'document_id',
        string='Documents liés'
    )
    document_count = fields.Integer(
        string='Nombre de documents',
        compute='_compute_document_count'
    )

    # Délégation
    delegation_id = fields.Many2one(
        'fiscal.payment.delegation',
        string='Délégation de paiement',
        readonly=True
    )

    # Alertes
    alert_sent = fields.Boolean(string='Alerte envoyée', default=False)
    alert_level = fields.Selection([
        ('none', 'Aucune'),
        ('info', 'Information'),
        ('warning', 'Attention'),
        ('urgent', 'Urgent'),
        ('critical', 'Critique'),
    ], string='Niveau d\'alerte', compute='_compute_alert_level', store=True)

    # Notes
    notes = fields.Text(string='Notes')
    internal_notes = fields.Text(string='Notes internes')

    # Récurrence
    is_recurring = fields.Boolean(string='Récurrente', default=True)
    next_obligation_id = fields.Many2one(
        'fiscal.obligation',
        string='Obligation suivante',
        readonly=True
    )

    @api.model_create_multi
    def create(self, vals_list):
        """Génère une référence unique"""
        for vals in vals_list:
            if vals.get('name', _('Nouveau')) == _('Nouveau'):
                seq = self.env['ir.sequence'].next_by_code('fiscal.obligation')
                vals['name'] = seq or _('Nouveau')
        return super().create(vals_list)

    @api.depends('period_start', 'period_end', 'obligation_type')
    def _compute_period_name(self):
        """Génère le nom de la période"""
        for obligation in self:
            if obligation.period_start and obligation.period_end:
                if obligation.periodicity == 'monthly':
                    obligation.period_name = obligation.period_start.strftime('%B %Y')
                elif obligation.periodicity == 'quarterly':
                    quarter = (obligation.period_start.month - 1) // 3 + 1
                    obligation.period_name = f"T{quarter} {obligation.period_start.year}"
                elif obligation.periodicity == 'annual':
                    obligation.period_name = str(obligation.period_start.year)
                else:
                    obligation.period_name = f"{obligation.period_start.strftime('%m/%Y')} - {obligation.period_end.strftime('%m/%Y')}"
            else:
                obligation.period_name = False

    @api.depends('due_date')
    def _compute_days_until_due(self):
        """Calcule les jours restants jusqu'à l'échéance"""
        today = fields.Date.today()
        for obligation in self:
            if obligation.due_date:
                delta = (obligation.due_date - today).days
                obligation.days_until_due = delta
            else:
                obligation.days_until_due = 0

    @api.depends('due_date', 'state')
    def _compute_is_overdue(self):
        """Vérifie si l'obligation est en retard"""
        today = fields.Date.today()
        for obligation in self:
            obligation.is_overdue = (
                obligation.due_date and
                obligation.due_date < today and
                obligation.state not in ['paid', 'cancelled']
            )

    @api.depends('actual_amount', 'penalty_amount')
    def _compute_total_amount(self):
        """Calcule le montant total"""
        for obligation in self:
            obligation.total_amount = (obligation.actual_amount or 0) + (obligation.penalty_amount or 0)

    @api.depends('document_ids')
    def _compute_document_count(self):
        """Compte les documents liés"""
        for obligation in self:
            obligation.document_count = len(obligation.document_ids)

    @api.depends('days_until_due', 'is_overdue', 'state')
    def _compute_priority(self):
        """Calcule la priorité automatiquement"""
        for obligation in self:
            if obligation.is_overdue or obligation.state == 'late':
                obligation.priority = '3'  # Urgent
            elif obligation.days_until_due <= 3:
                obligation.priority = '3'  # Urgent
            elif obligation.days_until_due <= 7:
                obligation.priority = '2'  # Élevé
            elif obligation.days_until_due <= 15:
                obligation.priority = '1'  # Normal
            else:
                obligation.priority = '0'  # Bas

    @api.depends('days_until_due', 'is_overdue')
    def _compute_alert_level(self):
        """Calcule le niveau d'alerte"""
        for obligation in self:
            if obligation.is_overdue:
                if obligation.days_until_due < -30:
                    obligation.alert_level = 'critical'
                else:
                    obligation.alert_level = 'urgent'
            elif obligation.days_until_due <= 3:
                obligation.alert_level = 'urgent'
            elif obligation.days_until_due <= 7:
                obligation.alert_level = 'warning'
            elif obligation.days_until_due <= 15:
                obligation.alert_level = 'info'
            else:
                obligation.alert_level = 'none'

    def action_mark_in_progress(self):
        """Marque l'obligation comme en cours"""
        self.write({'state': 'in_progress'})

    def action_mark_paid(self):
        """Marque l'obligation comme payée"""
        self.write({
            'state': 'paid',
            'payment_date': fields.Date.today()
        })

        # Créer l'obligation suivante si récurrente
        if self.is_recurring:
            self._create_next_obligation()

    def action_mark_late(self):
        """Marque l'obligation comme en retard"""
        self.write({'state': 'late'})

    def action_add_penalty(self):
        """Ouvre un wizard pour ajouter des pénalités"""
        self.ensure_one()
        return {
            'name': _('Ajouter une pénalité'),
            'type': 'ir.actions.act_window',
            'res_model': 'fiscal.obligation',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
            'context': {'focus_field': 'penalty_amount'},
        }

    def action_view_documents(self):
        """Affiche les documents liés"""
        self.ensure_one()
        return {
            'name': _('Documents liés'),
            'type': 'ir.actions.act_window',
            'res_model': 'client.document',
            'domain': [('id', 'in', self.document_ids.ids)],
            'view_mode': 'tree,form',
            'context': {'default_partner_id': self.partner_id.id},
        }

    def action_link_document(self):
        """Lie un document à l'obligation"""
        self.ensure_one()
        return {
            'name': _('Lier un document'),
            'type': 'ir.actions.act_window',
            'res_model': 'client.document',
            'domain': [('partner_id', '=', self.partner_id.id)],
            'view_mode': 'tree,form',
            'target': 'new',
        }

    def _create_next_obligation(self):
        """Crée l'obligation suivante pour les obligations récurrentes"""
        self.ensure_one()

        if not self.is_recurring:
            return False

        # Calculer la prochaine période
        if self.periodicity == 'monthly':
            next_start = self.period_start + relativedelta(months=1)
            next_end = self.period_end + relativedelta(months=1)
            next_due = self.due_date + relativedelta(months=1)
        elif self.periodicity == 'quarterly':
            next_start = self.period_start + relativedelta(months=3)
            next_end = self.period_end + relativedelta(months=3)
            next_due = self.due_date + relativedelta(months=3)
        elif self.periodicity == 'annual':
            next_start = self.period_start + relativedelta(years=1)
            next_end = self.period_end + relativedelta(years=1)
            next_due = self.due_date + relativedelta(years=1)
        elif self.periodicity == 'biannual':
            next_start = self.period_start + relativedelta(months=6)
            next_end = self.period_end + relativedelta(months=6)
            next_due = self.due_date + relativedelta(months=6)
        else:
            return False

        # Créer la nouvelle obligation
        next_obligation = self.create({
            'obligation_type': self.obligation_type,
            'periodicity': self.periodicity,
            'period_start': next_start,
            'period_end': next_end,
            'due_date': next_due,
            'partner_id': self.partner_id.id,
            'responsible_user_id': self.responsible_user_id.id,
            'payment_responsible': self.payment_responsible,
            'delegation_id': self.delegation_id.id if self.delegation_id else False,
            'is_recurring': True,
        })

        # Lier les deux obligations
        self.write({'next_obligation_id': next_obligation.id})

        _logger.info(
            f"Created next obligation {next_obligation.name} for {self.name}"
        )

        return next_obligation

    @api.model
    def compute_estimated_amounts(self):
        """
        Calcule les montants estimés pour toutes les obligations
        (Cron quotidien)
        """
        obligations = self.search([
            ('state', 'in', ['todo', 'in_progress']),
            ('estimated_amount', '=', 0),
        ])

        for obligation in obligations:
            estimated = obligation._calculate_estimated_amount()
            if estimated:
                obligation.write({'estimated_amount': estimated})

        return True

    def _calculate_estimated_amount(self):
        """Calcule le montant estimé selon le type d'obligation"""
        self.ensure_one()

        # Cette méthode doit être étendue selon les besoins
        # Pour l'instant, retourne 0
        # TODO: Intégrer avec la comptabilité pour calcul réel

        if self.obligation_type == 'tva':
            # Calculer depuis les factures de la période
            return self._estimate_tva()
        elif self.obligation_type == 'urssaf':
            # Calculer depuis les salaires
            return self._estimate_urssaf()
        elif self.obligation_type == 'is':
            # Calculer depuis le résultat
            return self._estimate_is()

        return 0.0

    def _estimate_tva(self):
        """Estime la TVA à payer"""
        # TODO: Implémenter calcul réel
        return 0.0

    def _estimate_urssaf(self):
        """Estime les charges URSSAF"""
        # TODO: Implémenter calcul réel
        return 0.0

    def _estimate_is(self):
        """Estime l'IS à payer"""
        # TODO: Implémenter calcul réel
        return 0.0

    @api.model
    def send_alerts(self):
        """
        Envoie les alertes pour les obligations à venir
        (Cron quotidien)
        """
        today = fields.Date.today()

        # Obligations à alerter (J-15, J-7, J-3)
        alert_days = [15, 7, 3]

        for days in alert_days:
            target_date = today + timedelta(days=days)

            obligations = self.search([
                ('due_date', '=', target_date),
                ('state', 'in', ['todo', 'in_progress']),
                ('alert_sent', '=', False),
            ])

            for obligation in obligations:
                obligation._send_alert_notification(days)

        # Obligations en retard
        late_obligations = self.search([
            ('is_overdue', '=', True),
            ('state', '!=', 'late'),
        ])

        for obligation in late_obligations:
            obligation.write({'state': 'late'})
            obligation._send_late_notification()

        return True

    def _send_alert_notification(self, days_before):
        """Envoie une notification d'alerte"""
        self.ensure_one()

        subject = _("Échéance %s dans %d jours") % (
            dict(self._fields['obligation_type'].selection)[self.obligation_type],
            days_before
        )

        body = _(
            "L'obligation <b>%s</b> arrive à échéance dans <b>%d jours</b>.<br/><br/>"
            "Type: %s<br/>"
            "Période: %s<br/>"
            "Date limite: %s<br/>"
            "Montant: %s €<br/>"
            "Responsable paiement: %s<br/>"
        ) % (
            self.name,
            days_before,
            dict(self._fields['obligation_type'].selection)[self.obligation_type],
            self.period_name,
            self.due_date.strftime('%d/%m/%Y'),
            self.total_amount or self.estimated_amount,
            'Client' if self.payment_responsible == 'client' else 'Comptable (délégation)'
        )

        # Notifier le client
        if self.partner_id.email:
            self.message_post(
                body=body,
                subject=subject,
                partner_ids=[self.partner_id.id],
                message_type='email',
            )

        # Notifier le comptable
        if self.responsible_user_id:
            self.message_post(
                body=body,
                subject=subject,
                partner_ids=[self.responsible_user_id.partner_id.id],
                message_type='notification',
            )

        self.write({'alert_sent': True})

        _logger.info(f"Alert sent for obligation {self.name} (J-{days_before})")

        return True

    def _send_late_notification(self):
        """Envoie une notification de retard"""
        self.ensure_one()

        subject = _("⚠️ RETARD - %s") % self.name

        body = _(
            "L'obligation <b>%s</b> est <b style='color: red;'>EN RETARD</b>.<br/><br/>"
            "Date limite dépassée: %s (%d jours)<br/>"
            "Montant: %s €<br/>"
            "<br/>"
            "<b>Action requise immédiatement pour éviter les pénalités.</b>"
        ) % (
            self.name,
            self.due_date.strftime('%d/%m/%Y'),
            abs(self.days_until_due),
            self.total_amount or self.estimated_amount
        )

        # Notification urgente
        if self.partner_id.email:
            self.message_post(
                body=body,
                subject=subject,
                partner_ids=[self.partner_id.id],
                message_type='email',
            )

        if self.responsible_user_id:
            self.message_post(
                body=body,
                subject=subject,
                partner_ids=[self.responsible_user_id.partner_id.id],
                message_type='notification',
                subtype_xmlid='mail.mt_comment',
            )

        return True
