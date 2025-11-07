# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
from dateutil.relativedelta import relativedelta
import logging

_logger = logging.getLogger(__name__)


class TvaDeclaration(models.Model):
    _name = 'tva.declaration'
    _description = 'Déclaration de TVA française'
    _order = 'period_end desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(
        string='Numéro',
        required=True,
        default=lambda self: _('Nouveau'),
        copy=False,
        readonly=True,
        tracking=True
    )

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        readonly=True,
        states={'draft': [('readonly', False)]}
    )

    regime_tva = fields.Selection([
        ('reel_normal', 'Réel normal (mensuel)'),
        ('reel_simplifie', 'Réel simplifié (trimestriel/annuel)'),
        ('franchise', 'Franchise en base'),
    ], string='Régime TVA', required=True, default='reel_normal',
        readonly=True, states={'draft': [('readonly', False)]})

    declaration_type = fields.Selection([
        ('ca3', 'CA3 (Réel normal - mensuel)'),
        ('ca12', 'CA12 (Réel simplifié - annuel)'),
        ('ca12e', 'CA12E (Réel simplifié - trimestriel)'),
    ], string='Type de déclaration', required=True, default='ca3',
        readonly=True, states={'draft': [('readonly', False)]})

    period_type = fields.Selection([
        ('monthly', 'Mensuelle'),
        ('quarterly', 'Trimestrielle'),
        ('annual', 'Annuelle'),
    ], string='Période', required=True, default='monthly',
        readonly=True, states={'draft': [('readonly', False)]})

    period_start = fields.Date(
        string='Début période',
        required=True,
        readonly=True,
        states={'draft': [('readonly', False)]},
        tracking=True
    )

    period_end = fields.Date(
        string='Fin période',
        required=True,
        readonly=True,
        states={'draft': [('readonly', False)]},
        tracking=True
    )

    period_label = fields.Char(
        string='Libellé période',
        compute='_compute_period_label',
        store=True
    )

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('computed', 'Calculée'),
        ('submitted', 'Déclarée'),
        ('paid', 'Payée'),
        ('cancel', 'Annulée'),
    ], string='État', default='draft', required=True, tracking=True)

    # Montants TVA collectée
    tva_collectee_20 = fields.Monetary(
        string='TVA collectée 20%',
        currency_field='currency_id',
        readonly=True
    )

    tva_collectee_10 = fields.Monetary(
        string='TVA collectée 10%',
        currency_field='currency_id',
        readonly=True
    )

    tva_collectee_55 = fields.Monetary(
        string='TVA collectée 5,5%',
        currency_field='currency_id',
        readonly=True
    )

    tva_collectee_21 = fields.Monetary(
        string='TVA collectée 2,1%',
        currency_field='currency_id',
        readonly=True
    )

    tva_collectee_total = fields.Monetary(
        string='Total TVA collectée',
        compute='_compute_totals',
        store=True,
        currency_field='currency_id'
    )

    # Montants TVA déductible
    tva_deductible_immobilisations = fields.Monetary(
        string='TVA déductible sur immobilisations',
        currency_field='currency_id',
        readonly=True
    )

    tva_deductible_biens_services = fields.Monetary(
        string='TVA déductible sur biens et services',
        currency_field='currency_id',
        readonly=True
    )

    tva_deductible_total = fields.Monetary(
        string='Total TVA déductible',
        compute='_compute_totals',
        store=True,
        currency_field='currency_id'
    )

    # Crédit et montant à payer
    credit_precedent = fields.Monetary(
        string='Crédit période précédente',
        currency_field='currency_id',
        help="Crédit de TVA reporté de la période précédente"
    )

    tva_nette = fields.Monetary(
        string='TVA nette',
        compute='_compute_totals',
        store=True,
        currency_field='currency_id',
        help="TVA collectée - TVA déductible"
    )

    tva_a_payer = fields.Monetary(
        string='TVA à payer',
        compute='_compute_totals',
        store=True,
        currency_field='currency_id',
        help="Montant final à payer (ou crédit)"
    )

    credit_a_reporter = fields.Monetary(
        string='Crédit à reporter',
        compute='_compute_totals',
        store=True,
        currency_field='currency_id',
        help="Crédit de TVA reportable au mois suivant"
    )

    currency_id = fields.Many2one(
        'res.currency',
        related='company_id.currency_id',
        string='Devise',
        readonly=True
    )

    # Bases HT
    base_ht_20 = fields.Monetary(
        string='Base HT 20%',
        currency_field='currency_id',
        readonly=True,
        help="Base HT des ventes à 20%"
    )

    base_ht_10 = fields.Monetary(
        string='Base HT 10%',
        currency_field='currency_id',
        readonly=True
    )

    base_ht_55 = fields.Monetary(
        string='Base HT 5,5%',
        currency_field='currency_id',
        readonly=True
    )

    base_ht_21 = fields.Monetary(
        string='Base HT 2,1%',
        currency_field='currency_id',
        readonly=True
    )

    # Échéance et paiement
    due_date = fields.Date(
        string='Date d\'échéance',
        help="Date limite de dépôt et paiement"
    )

    payment_date = fields.Date(
        string='Date de paiement',
        readonly=True,
        tracking=True
    )

    payment_ref = fields.Char(
        string='Référence paiement',
        readonly=True
    )

    # Fichier XML EDI-TVA
    edi_file = fields.Binary(
        string='Fichier EDI-TVA',
        readonly=True,
        attachment=True,
        help="Fichier XML pour télédéclaration"
    )

    edi_filename = fields.Char(
        string='Nom fichier EDI',
        compute='_compute_edi_filename'
    )

    notes = fields.Text(
        string='Notes'
    )

    @api.model
    def create(self, vals):
        if vals.get('name', _('Nouveau')) == _('Nouveau'):
            vals['name'] = self.env['ir.sequence'].next_by_code('tva.declaration') or _('Nouveau')
        return super(TvaDeclaration, self).create(vals)

    @api.depends('period_start', 'period_end', 'period_type')
    def _compute_period_label(self):
        for record in self:
            if record.period_start and record.period_end:
                if record.period_type == 'monthly':
                    record.period_label = record.period_start.strftime('%B %Y')
                elif record.period_type == 'quarterly':
                    quarter = (record.period_start.month - 1) // 3 + 1
                    record.period_label = f"T{quarter} {record.period_start.year}"
                else:  # annual
                    record.period_label = str(record.period_start.year)
            else:
                record.period_label = ''

    @api.depends('tva_collectee_20', 'tva_collectee_10', 'tva_collectee_55', 'tva_collectee_21',
                 'tva_deductible_immobilisations', 'tva_deductible_biens_services', 'credit_precedent')
    def _compute_totals(self):
        for record in self:
            # Total TVA collectée
            record.tva_collectee_total = (
                record.tva_collectee_20 +
                record.tva_collectee_10 +
                record.tva_collectee_55 +
                record.tva_collectee_21
            )

            # Total TVA déductible
            record.tva_deductible_total = (
                record.tva_deductible_immobilisations +
                record.tva_deductible_biens_services
            )

            # TVA nette
            record.tva_nette = record.tva_collectee_total - record.tva_deductible_total

            # TVA à payer (en tenant compte du crédit précédent)
            tva_brute = record.tva_nette - record.credit_precedent

            if tva_brute > 0:
                record.tva_a_payer = tva_brute
                record.credit_a_reporter = 0.0
            else:
                record.tva_a_payer = 0.0
                record.credit_a_reporter = abs(tva_brute)

    @api.depends('company_id', 'period_end')
    def _compute_edi_filename(self):
        for record in self:
            if record.company_id and record.period_end:
                siren = record.company_id.company_registry or 'XXXXXXXXX'
                siren = siren.replace(' ', '')[:9]
                date_str = record.period_end.strftime('%Y%m')
                record.edi_filename = f"{siren}_TVA_{date_str}.xml"
            else:
                record.edi_filename = 'TVA.xml'

    @api.constrains('period_start', 'period_end')
    def _check_dates(self):
        for record in self:
            if record.period_start and record.period_end:
                if record.period_start > record.period_end:
                    raise ValidationError(_("La date de début doit être antérieure à la date de fin."))

    def action_compute_tva(self):
        """Calcule automatiquement les montants de TVA"""
        self.ensure_one()

        # Récupérer toutes les écritures de la période
        moves = self.env['account.move'].search([
            ('company_id', '=', self.company_id.id),
            ('date', '>=', self.period_start),
            ('date', '<=', self.period_end),
            ('state', '=', 'posted'),
        ])

        # Initialiser les montants
        tva_collectee = {20: 0.0, 10: 0.0, 5.5: 0.0, 2.1: 0.0}
        tva_deductible = {20: 0.0, 10: 0.0, 5.5: 0.0, 2.1: 0.0}
        base_ht = {20: 0.0, 10: 0.0, 5.5: 0.0, 2.1: 0.0}

        tva_deductible_immo = 0.0
        tva_deductible_bs = 0.0

        # Parcourir les lignes d'écriture
        for move in moves:
            for line in move.line_ids:
                if line.tax_line_id:  # Ligne de TVA
                    tax_amount = line.tax_line_id.amount

                    # TVA collectée (ventes)
                    if move.move_type in ('out_invoice', 'out_refund'):
                        sign = 1 if move.move_type == 'out_invoice' else -1
                        if tax_amount == 20.0:
                            tva_collectee[20] += sign * abs(line.balance)
                        elif tax_amount == 10.0:
                            tva_collectee[10] += sign * abs(line.balance)
                        elif tax_amount == 5.5:
                            tva_collectee[5.5] += sign * abs(line.balance)
                        elif tax_amount == 2.1:
                            tva_collectee[2.1] += sign * abs(line.balance)

                    # TVA déductible (achats)
                    elif move.move_type in ('in_invoice', 'in_refund'):
                        sign = 1 if move.move_type == 'in_invoice' else -1
                        amount = sign * abs(line.balance)

                        # Distinguer immobilisations vs biens et services
                        # (basé sur le compte comptable - 2xxx = immobilisations)
                        if line.account_id.code and line.account_id.code.startswith('2'):
                            tva_deductible_immo += amount
                        else:
                            tva_deductible_bs += amount

                # Base HT (lignes avec TVA)
                if line.tax_ids:
                    for tax in line.tax_ids:
                        if tax.amount in [20.0, 10.0, 5.5, 2.1]:
                            base_ht[tax.amount] += abs(line.balance)

        # Mettre à jour les champs
        self.write({
            'tva_collectee_20': tva_collectee[20],
            'tva_collectee_10': tva_collectee[10],
            'tva_collectee_55': tva_collectee[5.5],
            'tva_collectee_21': tva_collectee[2.1],
            'tva_deductible_immobilisations': tva_deductible_immo,
            'tva_deductible_biens_services': tva_deductible_bs,
            'base_ht_20': base_ht[20],
            'base_ht_10': base_ht[10],
            'base_ht_55': base_ht[5.5],
            'base_ht_21': base_ht[2.1],
            'state': 'computed',
        })

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Succès'),
                'message': _('Déclaration de TVA calculée. TVA à payer: %.2f ¬') % self.tva_a_payer,
                'type': 'success',
            }
        }

    def action_submit(self):
        """Marque la déclaration comme déclarée"""
        self.ensure_one()
        if self.state != 'computed':
            raise UserError(_("Veuillez d'abord calculer la TVA."))

        self.write({
            'state': 'submitted',
            'due_date': self.period_end + relativedelta(days=30),  # Échéance 30j après fin période
        })

        return True

    def action_mark_paid(self):
        """Marque la déclaration comme payée"""
        self.ensure_one()
        if self.state != 'submitted':
            raise UserError(_("La déclaration doit être dans l'état 'Déclarée'."))

        self.write({
            'state': 'paid',
            'payment_date': fields.Date.today(),
        })

        return True

    def action_reset_to_draft(self):
        """Remet en brouillon"""
        self.write({'state': 'draft'})

    def action_cancel(self):
        """Annule la déclaration"""
        self.write({'state': 'cancel'})

    def action_generate_edi_file(self):
        """Génère le fichier XML EDI-TVA pour télédéclaration"""
        self.ensure_one()
        # TODO: Implémenter génération XML EDI-TVA
        # Format spécifique DGFIP pour télédéclaration

        raise UserError(_("Fonctionnalité de génération EDI-TVA en cours de développement."))
