# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class BankAccountWizard(models.TransientModel):
    _name = 'bank.account.wizard'
    _description = 'Assistant de Connexion Bancaire'

    bank_account_id = fields.Many2one('bank.sync.account', string='Compte', required=True)
    provider_id = fields.Many2one('bank.sync.provider', string='Banque', required=True)
    step = fields.Selection([
        ('select_bank', 'Sélection Banque'),
        ('authenticate', 'Authentification'),
        ('confirm', 'Confirmation')
    ], string='Étape', default='select_bank')

    # Informations d'authentification (utilisées temporairement, non stockées)
    auth_method = fields.Selection([
        ('redirect', 'Redirection PSD2'),
        ('credentials', 'Identifiants directs')
    ], string='Méthode', default='redirect')

    redirect_url = fields.Char(string='URL de redirection', readonly=True)
    connection_status = fields.Selection([
        ('pending', 'En attente'),
        ('success', 'Succès'),
        ('error', 'Erreur')
    ], string='Statut', default='pending')

    error_message = fields.Text(string='Message d\'erreur', readonly=True)

    def action_start_connection(self):
        """Démarrer le processus de connexion"""
        self.ensure_one()

        if self.auth_method == 'redirect':
            # Générer URL de redirection PSD2
            service = self.provider_id._get_sync_service()

            try:
                redirect_url = service.get_auth_url(
                    account_id=self.bank_account_id.id,
                    callback_url=f"{self.env['ir.config_parameter'].sudo().get_param('web.base.url')}/bank/sync/callback"
                )

                self.write({
                    'redirect_url': redirect_url,
                    'step': 'authenticate'
                })

                return {
                    'type': 'ir.actions.act_url',
                    'url': redirect_url,
                    'target': 'new'
                }

            except Exception as e:
                self.write({
                    'connection_status': 'error',
                    'error_message': str(e)
                })
                raise UserError(_("Erreur lors de la connexion: %s") % str(e))

        return {'type': 'ir.actions.act_window_close'}

    def action_confirm_connection(self):
        """Confirmer la connexion réussie"""
        self.ensure_one()

        self.bank_account_id.write({'state': 'connected'})

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Connexion réussie'),
                'message': _('Le compte bancaire est maintenant connecté.'),
                'type': 'success',
                'sticky': False
            }
        }
