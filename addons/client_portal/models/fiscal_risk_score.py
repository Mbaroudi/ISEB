# -*- coding: utf-8 -*-

import logging
from datetime import timedelta
from odoo import models, fields, api, _

_logger = logging.getLogger(__name__)


class PartnerFiscalRisk(models.Model):
    """Extension de res.partner avec score de risque fiscal"""
    _inherit = 'res.partner'

    # Score de risque fiscal
    fiscal_risk_score = fields.Integer(
        string='Score de risque fiscal',
        compute='_compute_fiscal_risk_score',
        store=False,
        help="Score de 0 (risque élevé) à 100 (conforme)"
    )

    fiscal_risk_level = fields.Selection([
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ], string='Niveau de risque', compute='_compute_fiscal_risk_level', store=False)

    fiscal_risk_color = fields.Integer(
        string='Couleur risque',
        compute='_compute_fiscal_risk_level'
    )

    # Statistiques
    late_obligations_count = fields.Integer(
        string='Obligations en retard',
        compute='_compute_fiscal_stats'
    )
    late_obligations_amount = fields.Monetary(
        string='Montant en retard',
        compute='_compute_fiscal_stats',
        currency_field='currency_id'
    )
    total_penalties_amount = fields.Monetary(
        string='Pénalités totales',
        compute='_compute_fiscal_stats',
        currency_field='currency_id'
    )
    average_payment_delay = fields.Float(
        string='Délai moyen de paiement (jours)',
        compute='_compute_fiscal_stats'
    )
    compliance_rate = fields.Float(
        string='Taux de conformité (%)',
        compute='_compute_fiscal_stats'
    )

    # Historique
    fiscal_risk_history_ids = fields.One2many(
        'fiscal.risk.history',
        'partner_id',
        string='Historique risque'
    )

    last_risk_check_date = fields.Date(
        string='Dernière évaluation',
        readonly=True
    )

    @api.depends(
        'late_obligations_count',
        'total_penalties_amount',
        'average_payment_delay',
        'compliance_rate'
    )
    def _compute_fiscal_risk_score(self):
        """
        Calcule le score de risque fiscal (0-100)

        Facteurs:
        - Nombre de retards (30%)
        - Montant des pénalités (25%)
        - Délai moyen de paiement (20%)
        - Taux de conformité (25%)
        """
        for partner in self:
            score = 100  # Score parfait par défaut

            # 1. Pénalité pour retards (max -30 points)
            if partner.late_obligations_count > 0:
                retard_penalty = min(partner.late_obligations_count * 5, 30)
                score -= retard_penalty

            # 2. Pénalité pour montant des pénalités (max -25 points)
            if partner.total_penalties_amount > 0:
                # -5 points par tranche de 100€
                penalty_points = min(int(partner.total_penalties_amount / 100) * 5, 25)
                score -= penalty_points

            # 3. Pénalité pour délai moyen (max -20 points)
            if partner.average_payment_delay > 0:
                # -2 points par jour de retard moyen
                delay_penalty = min(int(partner.average_payment_delay) * 2, 20)
                score -= delay_penalty

            # 4. Bonus pour taux de conformité (max -25 points si mauvais)
            if partner.compliance_rate < 100:
                # Inverser: 100% = 0 points de pénalité, 0% = -25 points
                compliance_penalty = int((100 - partner.compliance_rate) / 4)
                score -= min(compliance_penalty, 25)

            # S'assurer que le score reste entre 0 et 100
            partner.fiscal_risk_score = max(0, min(100, score))

            # Enregistrer dans l'historique si changement significatif
            if partner.last_risk_check_date:
                partner._record_risk_history()

            partner.last_risk_check_date = fields.Date.today()

    @api.depends('fiscal_risk_score')
    def _compute_fiscal_risk_level(self):
        """Détermine le niveau de risque selon le score"""
        for partner in self:
            if partner.fiscal_risk_score >= 80:
                partner.fiscal_risk_level = 'low'
                partner.fiscal_risk_color = 10  # Vert
            elif partner.fiscal_risk_score >= 60:
                partner.fiscal_risk_level = 'medium'
                partner.fiscal_risk_color = 3   # Jaune
            elif partner.fiscal_risk_score >= 40:
                partner.fiscal_risk_level = 'high'
                partner.fiscal_risk_color = 2   # Orange
            else:
                partner.fiscal_risk_level = 'critical'
                partner.fiscal_risk_color = 1   # Rouge

    def _compute_fiscal_stats(self):
        """Calcule les statistiques fiscales"""
        for partner in self:
            obligations = self.env['fiscal.obligation'].search([
                ('partner_id', '=', partner.id)
            ])

            # Obligations en retard
            late_obligations = obligations.filtered('is_overdue')
            partner.late_obligations_count = len(late_obligations)
            partner.late_obligations_amount = sum(late_obligations.mapped('total_amount'))

            # Pénalités totales (6 derniers mois)
            six_months_ago = fields.Date.today() - timedelta(days=180)
            recent_obligations = obligations.filtered(
                lambda o: o.create_date.date() >= six_months_ago
            )
            partner.total_penalties_amount = sum(recent_obligations.mapped('penalty_amount'))

            # Délai moyen de paiement
            paid_obligations = recent_obligations.filtered(
                lambda o: o.state == 'paid' and o.payment_date and o.due_date
            )
            if paid_obligations:
                delays = [(o.payment_date - o.due_date).days for o in paid_obligations]
                # Ne compter que les retards (délais > 0)
                positive_delays = [d for d in delays if d > 0]
                partner.average_payment_delay = sum(positive_delays) / len(positive_delays) if positive_delays else 0
            else:
                partner.average_payment_delay = 0

            # Taux de conformité (obligations payées à temps sur 6 mois)
            if recent_obligations:
                on_time_count = len(recent_obligations.filtered(
                    lambda o: o.state == 'paid' and
                    o.payment_date and
                    o.due_date and
                    o.payment_date <= o.due_date
                ))
                partner.compliance_rate = (on_time_count / len(recent_obligations)) * 100
            else:
                partner.compliance_rate = 100  # Pas d'obligations = parfait

    def _record_risk_history(self):
        """Enregistre l'évolution du score dans l'historique"""
        self.ensure_one()

        # Vérifier s'il y a eu un changement significatif (>= 5 points)
        last_history = self.fiscal_risk_history_ids.sorted('date', reverse=True)[:1]

        if not last_history or abs(last_history.score - self.fiscal_risk_score) >= 5:
            self.env['fiscal.risk.history'].create({
                'partner_id': self.id,
                'score': self.fiscal_risk_score,
                'level': self.fiscal_risk_level,
                'late_count': self.late_obligations_count,
                'penalties_amount': self.total_penalties_amount,
                'notes': self._generate_risk_notes(),
            })

    def _generate_risk_notes(self):
        """Génère des notes explicatives sur le risque"""
        self.ensure_one()

        notes = []

        if self.late_obligations_count > 0:
            notes.append(f"{self.late_obligations_count} obligation(s) en retard")

        if self.total_penalties_amount > 0:
            notes.append(f"{self.total_penalties_amount:.2f}€ de pénalités")

        if self.average_payment_delay > 0:
            notes.append(f"{self.average_payment_delay:.1f}j de retard moyen")

        if self.compliance_rate < 80:
            notes.append(f"Taux de conformité: {self.compliance_rate:.0f}%")

        return '; '.join(notes) if notes else 'Situation conforme'

    def action_view_fiscal_risk_detail(self):
        """Affiche le détail du risque fiscal"""
        self.ensure_one()

        return {
            'name': _('Détail risque fiscal - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'res.partner',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
            'context': {'form_view_ref': 'client_portal.view_partner_fiscal_risk_form'},
        }

    def action_view_fiscal_history(self):
        """Affiche l'historique du risque"""
        self.ensure_one()

        return {
            'name': _('Historique risque - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'fiscal.risk.history',
            'domain': [('partner_id', '=', self.id)],
            'view_mode': 'tree,graph',
            'context': {'default_partner_id': self.id},
        }

    @api.model
    def update_all_fiscal_risk_scores(self):
        """
        Met à jour les scores de risque pour tous les clients
        (Cron hebdomadaire)
        """
        partners = self.search([
            ('customer_rank', '>', 0),
            ('active', '=', True),
        ])

        for partner in partners:
            partner._compute_fiscal_risk_score()

        _logger.info(f"Updated fiscal risk scores for {len(partners)} partners")

        # Alerter pour les clients à risque critique
        critical_partners = partners.filtered(lambda p: p.fiscal_risk_level == 'critical')

        if critical_partners:
            subject = _("⚠️ Clients à risque fiscal critique")
            body = _(
                "Les clients suivants ont un score de risque fiscal critique:<br/><ul>%s</ul>"
            ) % ''.join([
                f"<li><b>{p.name}</b> - Score: {p.fiscal_risk_score}/100 - {p._generate_risk_notes()}</li>"
                for p in critical_partners
            ])

            # Notifier les comptables
            accountant_group = self.env.ref('account.group_account_manager')
            accountants = accountant_group.users

            self.env['mail.mail'].sudo().create({
                'subject': subject,
                'body_html': body,
                'email_to': ','.join(accountants.mapped('email')),
                'auto_delete': True,
            }).send()

        return True


class FiscalRiskHistory(models.Model):
    """Historique de l'évolution du risque fiscal"""
    _name = 'fiscal.risk.history'
    _description = 'Historique risque fiscal'
    _order = 'date desc'

    partner_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        ondelete='cascade'
    )

    date = fields.Date(
        string='Date',
        required=True,
        default=fields.Date.today
    )

    score = fields.Integer(
        string='Score',
        required=True
    )

    level = fields.Selection([
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ], string='Niveau', required=True)

    late_count = fields.Integer(string='Retards')
    penalties_amount = fields.Monetary(
        string='Pénalités',
        currency_field='currency_id'
    )
    currency_id = fields.Many2one(
        'res.currency',
        default=lambda self: self.env.company.currency_id
    )

    notes = fields.Text(string='Notes')
