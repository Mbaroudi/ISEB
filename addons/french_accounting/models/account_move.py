# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
import re


class AccountMove(models.Model):
    _inherit = 'account.move'

    # Champs spécifiques français
    fec_export_date = fields.Datetime(
        string='Date export FEC',
        readonly=True,
        help="Date du dernier export FEC incluant cette écriture"
    )

    liasse_fiscale_id = fields.Many2one(
        'liasse.fiscale',
        string='Liasse fiscale',
        readonly=True,
        help="Liasse fiscale associée à cette écriture"
    )

    french_fiscal_year = fields.Selection(
        selection='_get_fiscal_years',
        string='Exercice fiscal',
        compute='_compute_french_fiscal_year',
        store=True,
        help="Exercice fiscal français (N, N-1, N-2...)"
    )

    french_journal_code = fields.Char(
        related='journal_id.code',
        string='Code journal',
        store=True,
        help="Code du journal comptable (ex: VT, AC, BQ, OD)"
    )

    fec_match_hash = fields.Char(
        string='Hash FEC',
        compute='_compute_fec_hash',
        store=True,
        help="Hash pour déduplication FEC"
    )

    is_fec_exported = fields.Boolean(
        string='Exporté FEC',
        compute='_compute_is_fec_exported',
        store=True,
        help="Indique si l'écriture a été exportée dans un FEC"
    )

    def _get_fiscal_years(self):
        """Retourne les exercices fiscaux disponibles"""
        current_year = fields.Date.today().year
        years = []
        for i in range(10):  # 10 dernières années
            year = current_year - i
            years.append((str(year), str(year)))
        return years

    @api.depends('date', 'company_id')
    def _compute_french_fiscal_year(self):
        """Calcule l'exercice fiscal français"""
        for move in self:
            if move.date:
                # Par défaut, exercice = année civile
                # TODO: Gérer les exercices décalés depuis res.company
                move.french_fiscal_year = str(move.date.year)
            else:
                move.french_fiscal_year = False

    @api.depends('name', 'date', 'journal_id', 'line_ids')
    def _compute_fec_hash(self):
        """Calcule un hash unique pour l'écriture (FEC deduplication)"""
        import hashlib
        for move in self:
            if move.name and move.date:
                # Hash basé sur : nom + date + journal + montant total
                hash_string = f"{move.name}_{move.date}_{move.journal_id.id}"
                move.fec_match_hash = hashlib.md5(hash_string.encode()).hexdigest()
            else:
                move.fec_match_hash = False

    @api.depends('fec_export_date')
    def _compute_is_fec_exported(self):
        """Vérifie si l'écriture a été exportée"""
        for move in self:
            move.is_fec_exported = bool(move.fec_export_date)

    def action_post(self):
        """Override pour valider la conformité française avant validation"""
        # Vérifications spécifiques françaises
        for move in self:
            # Vérifier la numérotation séquentielle obligatoire
            if not move.name or move.name == '/':
                raise UserError(_(
                    "La numérotation des écritures est obligatoire selon "
                    "l'article L123-22 du Code de commerce."
                ))

            # Vérifier que le journal a un code conforme
            if not move.journal_id.code:
                raise UserError(_(
                    "Le journal '%s' doit avoir un code défini."
                ) % move.journal_id.name)

            # Vérifier que toutes les lignes ont un compte défini
            for line in move.line_ids:
                if not line.account_id:
                    raise UserError(_(
                        "Toutes les lignes doivent avoir un compte comptable défini."
                    ))

        # Appeler la méthode parent
        return super(AccountMove, self).action_post()

    def button_draft(self):
        """Override pour empêcher la modification des écritures validées"""
        # En France, les écritures validées ne peuvent pas être modifiées
        # (principe d'intouchabilité des écritures)
        for move in self:
            if move.fec_export_date:
                raise UserError(_(
                    "Cette écriture a été exportée dans un FEC le %s.\n"
                    "Elle ne peut plus être modifiée selon la réglementation française "
                    "(Art. L123-22 du Code de commerce)."
                ) % move.fec_export_date.strftime('%d/%m/%Y %H:%M'))

        return super(AccountMove, self).button_draft()

    def _check_fec_compliance(self):
        """Vérifie la conformité FEC de l'écriture"""
        self.ensure_one()
        errors = []

        # 1. Numéro d'écriture obligatoire
        if not self.name or self.name == '/':
            errors.append("Numéro d'écriture manquant")

        # 2. Date obligatoire
        if not self.date:
            errors.append("Date manquante")

        # 3. Journal obligatoire avec code
        if not self.journal_id or not self.journal_id.code:
            errors.append("Journal ou code journal manquant")

        # 4. Lignes d'écriture
        if not self.line_ids:
            errors.append("Aucune ligne d'écriture")

        for line in self.line_ids:
            # Compte obligatoire
            if not line.account_id:
                errors.append(f"Ligne {line.id}: compte manquant")

            # Libellé obligatoire
            if not line.name:
                errors.append(f"Ligne {line.id}: libellé manquant")

            # Montant débit OU crédit (pas les deux)
            if line.debit > 0 and line.credit > 0:
                errors.append(f"Ligne {line.id}: débit et crédit simultanés")

        # 5. Équilibre débit/crédit
        total_debit = sum(self.line_ids.mapped('debit'))
        total_credit = sum(self.line_ids.mapped('credit'))
        if abs(total_debit - total_credit) > 0.01:
            errors.append(f"Écriture déséquilibrée: débit={total_debit}, crédit={total_credit}")

        return errors

    def get_fec_line_data(self):
        """Retourne les données formatées pour l'export FEC"""
        self.ensure_one()

        lines_data = []
        for line in self.line_ids:
            line_data = {
                'JournalCode': self.journal_id.code or '',
                'JournalLib': self.journal_id.name or '',
                'EcritureNum': self.name or '',
                'EcritureDate': self.date.strftime('%Y%m%d') if self.date else '',
                'CompteNum': line.account_id.code or '',
                'CompteLib': line.account_id.name or '',
                'CompAuxNum': line.partner_id.ref or '' if line.partner_id else '',
                'CompAuxLib': line.partner_id.name or '' if line.partner_id else '',
                'PieceRef': self.ref or '',
                'PieceDate': self.invoice_date.strftime('%Y%m%d') if self.invoice_date else '',
                'EcritureLib': line.name or '',
                'Debit': f"{line.debit:.2f}".replace('.', ','),
                'Credit': f"{line.credit:.2f}".replace('.', ','),
                'EcritureLet': line.full_reconcile_id.name if line.full_reconcile_id else '',
                'DateLet': line.full_reconcile_id.create_date.strftime('%Y%m%d') if line.full_reconcile_id else '',
                'ValidDate': self.date.strftime('%Y%m%d') if self.date and self.state == 'posted' else '',
                'Montantdevise': f"{abs(line.amount_currency):.2f}".replace('.', ',') if line.amount_currency else '',
                'Idevise': line.currency_id.name if line.currency_id and line.currency_id != self.company_id.currency_id else '',
            }
            lines_data.append(line_data)

        return lines_data


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    # Champs supplémentaires pour FEC
    fec_line_number = fields.Integer(
        string='Numéro ligne FEC',
        help="Numéro séquentiel de la ligne dans l'export FEC"
    )

    def _check_fec_line_compliance(self):
        """Vérifie la conformité FEC d'une ligne d'écriture"""
        self.ensure_one()
        errors = []

        # Compte obligatoire
        if not self.account_id:
            errors.append("Compte comptable manquant")

        # Libellé obligatoire
        if not self.name:
            errors.append("Libellé manquant")

        # Montant débit OU crédit (exclusif)
        if self.debit > 0 and self.credit > 0:
            errors.append("Débit et crédit simultanés non autorisés")

        # Au moins un montant non nul
        if self.debit == 0 and self.credit == 0:
            errors.append("Ligne sans montant")

        return errors
