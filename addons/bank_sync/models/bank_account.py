# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
from datetime import datetime, timedelta
import logging
import json

_logger = logging.getLogger(__name__)


class BankAccount(models.Model):
    _name = 'bank.sync.account'
    _description = 'Compte Bancaire Synchronisé'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    name = fields.Char(
        string='Nom du compte',
        required=True,
        tracking=True
    )

    account_number = fields.Char(
        string='Numéro de compte',
        required=True,
        tracking=True
    )

    iban = fields.Char(
        string='IBAN',
        help='International Bank Account Number'
    )

    bic = fields.Char(
        string='BIC/SWIFT',
        help='Bank Identifier Code'
    )

    partner_id = fields.Many2one(
        'res.partner',
        string='Titulaire',
        required=True,
        ondelete='cascade',
        tracking=True
    )

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company,
        required=True
    )

    provider_id = fields.Many2one(
        'bank.sync.provider',
        string='Banque',
        required=True,
        tracking=True
    )

    account_type = fields.Selection([
        ('checking', 'Compte courant'),
        ('savings', 'Compte épargne'),
        ('card', 'Carte bancaire'),
        ('loan', 'Prêt'),
        ('investment', 'Compte titre'),
        ('other', 'Autre')
    ], string='Type de compte', default='checking', required=True)

    currency_id = fields.Many2one(
        'res.currency',
        string='Devise',
        default=lambda self: self.env.company.currency_id,
        required=True
    )

    balance = fields.Monetary(
        string='Solde actuel',
        currency_field='currency_id',
        readonly=True,
        tracking=True
    )

    last_sync_date = fields.Datetime(
        string='Dernière synchronisation',
        readonly=True
    )

    last_transaction_date = fields.Date(
        string='Dernière transaction',
        readonly=True
    )

    sync_enabled = fields.Boolean(
        string='Synchronisation active',
        default=True,
        tracking=True
    )

    auto_sync = fields.Boolean(
        string='Synchronisation automatique',
        default=True,
        help='Synchroniser automatiquement toutes les heures'
    )

    sync_frequency = fields.Selection([
        ('hourly', 'Toutes les heures'),
        ('daily', 'Quotidienne'),
        ('weekly', 'Hebdomadaire'),
        ('manual', 'Manuelle uniquement')
    ], string='Fréquence', default='daily')

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('connected', 'Connecté'),
        ('error', 'Erreur'),
        ('disconnected', 'Déconnecté')
    ], string='État', default='draft', required=True, tracking=True)

    # Credentials (chiffrées)
    connection_id = fields.Char(
        string='ID de connexion',
        readonly=True,
        help='ID de connexion chez le fournisseur (Budget Insight, etc.)'
    )

    encrypted_token = fields.Text(
        string='Token chiffré',
        help='Token d\'accès chiffré'
    )

    token_expiry = fields.Datetime(
        string='Expiration du token'
    )

    # Statistiques
    transaction_count = fields.Integer(
        string='Nombre de transactions',
        compute='_compute_transaction_count',
        store=True
    )

    pending_count = fields.Integer(
        string='Transactions en attente',
        compute='_compute_pending_count'
    )

    # Relations
    transaction_ids = fields.One2many(
        'bank.sync.transaction',
        'bank_account_id',
        string='Transactions'
    )

    sync_log_ids = fields.One2many(
        'bank.sync.log',
        'bank_account_id',
        string='Logs de synchronisation'
    )

    journal_id = fields.Many2one(
        'account.journal',
        string='Journal comptable',
        domain="[('type', '=', 'bank')]",
        help='Journal comptable associé à ce compte bancaire'
    )

    # Alertes
    alert_min_balance = fields.Monetary(
        string='Alerte solde minimum',
        currency_field='currency_id',
        help='Envoyer une alerte si le solde descend en dessous de ce montant'
    )

    alert_enabled = fields.Boolean(
        string='Alertes activées',
        default=False
    )

    notes = fields.Text(string='Notes')

    active = fields.Boolean(default=True)

    @api.depends('transaction_ids')
    def _compute_transaction_count(self):
        for account in self:
            account.transaction_count = len(account.transaction_ids)

    @api.depends('transaction_ids.state')
    def _compute_pending_count(self):
        for account in self:
            account.pending_count = len(account.transaction_ids.filtered(
                lambda t: t.state == 'pending'
            ))

    @api.constrains('iban')
    def _check_iban(self):
        """Valider le format IBAN"""
        for account in self:
            if account.iban:
                # Supprimer les espaces
                iban = account.iban.replace(' ', '').upper()
                # Vérifier que ça commence par FR et fait 27 caractères
                if not iban.startswith('FR') or len(iban) != 27:
                    raise ValidationError(
                        _("L'IBAN français doit commencer par FR et contenir 27 caractères.")
                    )

    def action_sync_now(self):
        """Synchroniser manuellement ce compte"""
        self.ensure_one()

        if not self.sync_enabled:
            raise UserError(_("La synchronisation est désactivée pour ce compte."))

        if self.state != 'connected':
            raise UserError(_("Le compte doit être connecté pour synchroniser."))

        return self._perform_sync()

    def _perform_sync(self):
        """Effectuer la synchronisation avec la banque"""
        self.ensure_one()

        sync_log = self.env['bank.sync.log'].create({
            'bank_account_id': self.id,
            'sync_date': fields.Datetime.now(),
            'state': 'in_progress'
        })

        try:
            # Appeler l'API de la banque
            service = self.provider_id._get_sync_service()

            # Récupérer les transactions depuis la dernière sync
            from_date = self.last_transaction_date or (datetime.now() - timedelta(days=90)).date()

            transactions_data = service.fetch_transactions(
                connection_id=self.connection_id,
                account_id=self.account_number,
                from_date=from_date
            )

            # Créer les transactions
            created_count = 0
            updated_count = 0

            for trans_data in transactions_data:
                existing = self.env['bank.sync.transaction'].search([
                    ('bank_account_id', '=', self.id),
                    ('transaction_id', '=', trans_data['id'])
                ], limit=1)

                if existing:
                    existing.write(trans_data)
                    updated_count += 1
                else:
                    self.env['bank.sync.transaction'].create(dict(
                        trans_data,
                        bank_account_id=self.id
                    ))
                    created_count += 1

            # Mettre à jour le solde
            balance_data = service.fetch_balance(
                connection_id=self.connection_id,
                account_id=self.account_number
            )

            self.write({
                'balance': balance_data['balance'],
                'last_sync_date': fields.Datetime.now(),
                'last_transaction_date': max(
                    [t['date'] for t in transactions_data] + [self.last_transaction_date or fields.Date.today()]
                )
            })

            # Vérifier les alertes
            self._check_balance_alerts()

            # Finaliser le log
            sync_log.write({
                'state': 'success',
                'transactions_imported': created_count,
                'transactions_updated': updated_count,
                'message': f'{created_count} nouvelles transactions, {updated_count} mises à jour'
            })

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Synchronisation réussie'),
                    'message': f'{created_count} nouvelles transactions importées',
                    'type': 'success',
                    'sticky': False,
                }
            }

        except Exception as e:
            _logger.error(f"Erreur de synchronisation pour {self.name}: {str(e)}", exc_info=True)

            sync_log.write({
                'state': 'error',
                'message': str(e)
            })

            self.write({'state': 'error'})

            raise UserError(
                _("Erreur lors de la synchronisation: %s") % str(e)
            )

    def _check_balance_alerts(self):
        """Vérifier si le solde déclenche une alerte"""
        self.ensure_one()

        if self.alert_enabled and self.alert_min_balance:
            if self.balance < self.alert_min_balance:
                # Envoyer une notification
                self.message_post(
                    body=_(
                        "⚠️ Alerte solde faible!\n\n"
                        "Le solde du compte %s est descendu à %s %s, "
                        "en dessous du seuil de %s %s."
                    ) % (
                        self.name,
                        self.balance,
                        self.currency_id.symbol,
                        self.alert_min_balance,
                        self.currency_id.symbol
                    ),
                    subject=_("Alerte solde faible - %s") % self.name
                )

                # Créer une activité
                self.activity_schedule(
                    'mail.mail_activity_data_warning',
                    summary=_('Solde faible sur %s') % self.name,
                    note=_('Le solde est descendu à %s %s') % (
                        self.balance, self.currency_id.symbol
                    ),
                    user_id=self.partner_id.user_id.id or self.env.user.id
                )

    def action_connect(self):
        """Lancer l'assistant de connexion bancaire"""
        self.ensure_one()

        return {
            'name': _('Connexion bancaire'),
            'type': 'ir.actions.act_window',
            'res_model': 'bank.account.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_bank_account_id': self.id,
                'default_provider_id': self.provider_id.id
            }
        }

    def action_disconnect(self):
        """Déconnecter le compte bancaire"""
        self.ensure_one()

        # Révoquer l'accès chez le fournisseur
        if self.connection_id:
            try:
                service = self.provider_id._get_sync_service()
                service.revoke_connection(self.connection_id)
            except Exception as e:
                _logger.warning(f"Impossible de révoquer la connexion: {str(e)}")

        self.write({
            'state': 'disconnected',
            'sync_enabled': False,
            'connection_id': False,
            'encrypted_token': False,
            'token_expiry': False
        })

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Compte déconnecté'),
                'message': _('Le compte %s a été déconnecté avec succès') % self.name,
                'type': 'success',
            }
        }

    def action_view_transactions(self):
        """Voir les transactions de ce compte"""
        self.ensure_one()

        return {
            'name': _('Transactions - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'bank.sync.transaction',
            'view_mode': 'tree,form',
            'domain': [('bank_account_id', '=', self.id)],
            'context': {'default_bank_account_id': self.id}
        }

    @api.model
    def cron_auto_sync(self):
        """Cron job pour synchroniser automatiquement les comptes"""
        accounts = self.search([
            ('sync_enabled', '=', True),
            ('auto_sync', '=', True),
            ('state', '=', 'connected')
        ])

        for account in accounts:
            # Vérifier si c'est le moment de synchroniser
            if account.sync_frequency == 'manual':
                continue

            should_sync = False

            if account.sync_frequency == 'hourly':
                should_sync = not account.last_sync_date or \
                    (datetime.now() - account.last_sync_date) > timedelta(hours=1)

            elif account.sync_frequency == 'daily':
                should_sync = not account.last_sync_date or \
                    (datetime.now() - account.last_sync_date) > timedelta(days=1)

            elif account.sync_frequency == 'weekly':
                should_sync = not account.last_sync_date or \
                    (datetime.now() - account.last_sync_date) > timedelta(weeks=1)

            if should_sync:
                try:
                    account._perform_sync()
                except Exception as e:
                    _logger.error(
                        f"Erreur synchronisation automatique {account.name}: {str(e)}"
                    )
