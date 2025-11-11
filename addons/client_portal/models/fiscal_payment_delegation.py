# -*- coding: utf-8 -*-

import logging
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class FiscalPaymentDelegation(models.Model):
    """Délégation de paiement des obligations fiscales au comptable"""
    _name = 'fiscal.payment.delegation'
    _description = 'Délégation de paiement fiscal'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(
        string='Référence',
        compute='_compute_name',
        store=True
    )

    # Client
    partner_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        ondelete='cascade',
        tracking=True
    )

    # Types d'obligations déléguées
    delegated_types = fields.Many2many(
        'fiscal.obligation.type',
        string='Types délégués',
        help="Types d'obligations pour lesquels le paiement est délégué"
    )

    # Période de validité
    start_date = fields.Date(
        string='Date de début',
        required=True,
        default=fields.Date.today,
        tracking=True
    )
    end_date = fields.Date(
        string='Date de fin',
        tracking=True,
        help="Laisser vide pour délégation sans limite de temps"
    )

    is_active = fields.Boolean(
        string='Active',
        compute='_compute_is_active',
        store=True
    )

    # Limites de sécurité
    max_amount_per_payment = fields.Monetary(
        string='Montant maximum par paiement',
        currency_field='currency_id',
        help="0 = pas de limite"
    )
    max_amount_per_month = fields.Monetary(
        string='Montant maximum par mois',
        currency_field='currency_id',
        help="0 = pas de limite"
    )
    currency_id = fields.Many2one(
        'res.currency',
        string='Devise',
        default=lambda self: self.env.company.currency_id
    )

    # Informations bancaires
    payment_method = fields.Selection([
        ('transfer', 'Virement depuis compte comptable'),
        ('direct_debit', 'Prélèvement automatique'),
        ('client_account', 'Compte client avec signature'),
    ], string='Méthode de paiement', default='transfer', required=True)

    bank_account_id = fields.Many2one(
        'res.partner.bank',
        string='Compte bancaire',
        domain="[('partner_id', '=', partner_id)]"
    )

    # Validation client
    require_client_validation = fields.Boolean(
        string='Validation client requise',
        default=True,
        help="Le client doit valider chaque paiement avant exécution"
    )
    validation_delay_hours = fields.Integer(
        string='Délai de validation (heures)',
        default=48,
        help="Délai laissé au client pour s'opposer au paiement"
    )

    # Notifications
    send_preview_notification = fields.Boolean(
        string='Notification prévisualisation',
        default=True,
        help="Envoyer une notification avant chaque paiement"
    )
    send_confirmation_notification = fields.Boolean(
        string='Notification confirmation',
        default=True,
        help="Envoyer une notification après chaque paiement"
    )

    # État
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('pending', 'En attente signature'),
        ('active', 'Active'),
        ('suspended', 'Suspendue'),
        ('revoked', 'Révoquée'),
        ('expired', 'Expirée'),
    ], string='État', default='draft', required=True, tracking=True)

    # Signature électronique
    signed_date = fields.Datetime(string='Date de signature', readonly=True)
    signed_by_user_id = fields.Many2one(
        'res.users',
        string='Signé par',
        readonly=True
    )
    signature = fields.Binary(string='Signature', readonly=True)

    # Historique
    payment_count = fields.Integer(
        string='Nombre de paiements',
        compute='_compute_payment_count'
    )
    total_paid_amount = fields.Monetary(
        string='Montant total payé',
        compute='_compute_total_paid_amount',
        currency_field='currency_id'
    )
    last_payment_date = fields.Date(
        string='Dernier paiement',
        compute='_compute_last_payment_date'
    )

    # Obligations liées
    obligation_ids = fields.One2many(
        'fiscal.obligation',
        'delegation_id',
        string='Obligations'
    )

    # Notes
    notes = fields.Text(string='Notes')
    suspension_reason = fields.Text(string='Raison suspension')

    # Méta
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company
    )

    @api.depends('partner_id', 'delegated_types')
    def _compute_name(self):
        """Génère un nom pour la délégation"""
        for delegation in self:
            if delegation.partner_id:
                types = ', '.join(delegation.delegated_types.mapped('name')) if delegation.delegated_types else 'Tous'
                delegation.name = f"Délégation {delegation.partner_id.name} - {types}"
            else:
                delegation.name = "Nouvelle délégation"

    @api.depends('start_date', 'end_date', 'state')
    def _compute_is_active(self):
        """Vérifie si la délégation est active"""
        today = fields.Date.today()
        for delegation in self:
            delegation.is_active = (
                delegation.state == 'active' and
                delegation.start_date <= today and
                (not delegation.end_date or delegation.end_date >= today)
            )

    @api.depends('obligation_ids')
    def _compute_payment_count(self):
        """Compte le nombre de paiements effectués"""
        for delegation in self:
            delegation.payment_count = len(delegation.obligation_ids.filtered(
                lambda o: o.state == 'paid'
            ))

    @api.depends('obligation_ids.total_amount')
    def _compute_total_paid_amount(self):
        """Calcule le montant total payé"""
        for delegation in self:
            paid_obligations = delegation.obligation_ids.filtered(
                lambda o: o.state == 'paid'
            )
            delegation.total_paid_amount = sum(paid_obligations.mapped('total_amount'))

    @api.depends('obligation_ids.payment_date')
    def _compute_last_payment_date(self):
        """Récupère la date du dernier paiement"""
        for delegation in self:
            paid_obligations = delegation.obligation_ids.filtered(
                lambda o: o.state == 'paid' and o.payment_date
            ).sorted(lambda o: o.payment_date, reverse=True)

            delegation.last_payment_date = paid_obligations[0].payment_date if paid_obligations else False

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        """Vérifie la cohérence des dates"""
        for delegation in self:
            if delegation.end_date and delegation.end_date < delegation.start_date:
                raise ValidationError(_(
                    "La date de fin doit être postérieure à la date de début."
                ))

    def action_send_for_signature(self):
        """Envoie la délégation pour signature au client"""
        self.ensure_one()

        if self.state != 'draft':
            raise UserError(_("Seules les délégations en brouillon peuvent être envoyées."))

        # Générer le document de délégation
        # TODO: Intégrer avec un module de signature électronique (DocuSign, etc.)

        self.write({'state': 'pending'})

        # Envoyer email au client
        subject = _("Délégation de paiement - Signature requise")
        body = _(
            "Bonjour,<br/><br/>"
            "Votre comptable vous propose une délégation de paiement pour les obligations suivantes:<br/>"
            "<ul>%s</ul><br/>"
            "Merci de signer ce document pour confirmer votre accord.<br/>"
        ) % ''.join([f"<li>{t.name}</li>" for t in self.delegated_types])

        self.message_post(
            body=body,
            subject=subject,
            partner_ids=[self.partner_id.id],
            message_type='email',
        )

        return True

    def action_sign(self):
        """Signe la délégation (par le client)"""
        self.ensure_one()

        if self.state != 'pending':
            raise UserError(_("Cette délégation n'est pas en attente de signature."))

        self.write({
            'state': 'active',
            'signed_date': fields.Datetime.now(),
            'signed_by_user_id': self.env.user.id,
        })

        _logger.info(f"Delegation {self.id} signed by {self.env.user.name}")

        return True

    def action_suspend(self):
        """Suspend la délégation"""
        self.ensure_one()

        if self.state != 'active':
            raise UserError(_("Seules les délégations actives peuvent être suspendues."))

        return {
            'name': _('Suspendre la délégation'),
            'type': 'ir.actions.act_window',
            'res_model': 'fiscal.delegation.suspend.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_delegation_id': self.id},
        }

    def action_reactivate(self):
        """Réactive la délégation"""
        self.ensure_one()

        if self.state != 'suspended':
            raise UserError(_("Seules les délégations suspendues peuvent être réactivées."))

        self.write({
            'state': 'active',
            'suspension_reason': False,
        })

        return True

    def action_revoke(self):
        """Révoque la délégation"""
        self.ensure_one()

        self.write({'state': 'revoked'})

        # Notifier le comptable et le client
        subject = _("Délégation révoquée")
        body = _("La délégation de paiement a été révoquée.")

        self.message_post(
            body=body,
            subject=subject,
            partner_ids=[self.partner_id.id, self.env.user.partner_id.id],
            message_type='notification',
        )

        return True

    def check_payment_allowed(self, obligation):
        """
        Vérifie si un paiement est autorisé par cette délégation

        :param obligation: fiscal.obligation
        :return: True si autorisé, sinon lève une exception
        """
        self.ensure_one()

        # Vérifier l'état
        if not self.is_active:
            raise UserError(_(
                "La délégation n'est pas active. Paiement refusé."
            ))

        # Vérifier le type
        if self.delegated_types and obligation.obligation_type not in self.delegated_types.mapped('code'):
            raise UserError(_(
                "Ce type d'obligation n'est pas couvert par la délégation."
            ))

        # Vérifier le montant maximum par paiement
        if self.max_amount_per_payment > 0:
            if obligation.total_amount > self.max_amount_per_payment:
                raise UserError(_(
                    "Le montant (%s €) dépasse la limite autorisée (%s €)."
                ) % (obligation.total_amount, self.max_amount_per_payment))

        # Vérifier le montant maximum par mois
        if self.max_amount_per_month > 0:
            current_month = fields.Date.today().replace(day=1)
            month_payments = self.obligation_ids.filtered(
                lambda o: o.state == 'paid' and
                o.payment_date and
                o.payment_date >= current_month
            )
            month_total = sum(month_payments.mapped('total_amount'))

            if month_total + obligation.total_amount > self.max_amount_per_month:
                raise UserError(_(
                    "Le montant mensuel maximum (%s €) serait dépassé."
                ) % self.max_amount_per_month)

        return True

    @api.model
    def check_expired_delegations(self):
        """
        Vérifie et expire les délégations échues
        (Cron quotidien)
        """
        today = fields.Date.today()

        expired_delegations = self.search([
            ('state', '=', 'active'),
            ('end_date', '<', today),
        ])

        if expired_delegations:
            expired_delegations.write({'state': 'expired'})
            _logger.info(f"Expired {len(expired_delegations)} delegations")

        return True


class FiscalObligationType(models.Model):
    """Types d'obligations fiscales (pour la délégation)"""
    _name = 'fiscal.obligation.type'
    _description = 'Type d\'obligation fiscale'

    name = fields.Char(string='Nom', required=True)
    code = fields.Char(string='Code', required=True)
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ('code_uniq', 'unique(code)', 'Le code doit être unique!')
    ]
