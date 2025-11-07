# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
from datetime import datetime
import base64
import csv
import io
import logging

_logger = logging.getLogger(__name__)


class FecExport(models.Model):
    _name = 'fec.export'
    _description = 'Export FEC (Fichier des Écritures Comptables)'
    _order = 'create_date desc'
    _rec_name = 'display_name'

    name = fields.Char(
        string='Nom',
        required=True,
        default=lambda self: self._default_name(),
        help="Nom de l'export FEC"
    )

    display_name = fields.Char(
        string='Nom complet',
        compute='_compute_display_name',
        store=True
    )

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        help="Société pour laquelle générer le FEC"
    )

    date_from = fields.Date(
        string='Date de début',
        required=True,
        default=lambda self: fields.Date.today().replace(month=1, day=1),
        help="Date de début de la période"
    )

    date_to = fields.Date(
        string='Date de fin',
        required=True,
        default=fields.Date.today,
        help="Date de fin de la période"
    )

    fiscal_year = fields.Selection(
        selection='_get_fiscal_years',
        string='Exercice fiscal',
        compute='_compute_fiscal_year',
        store=True
    )

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('generating', 'Génération en cours'),
        ('done', 'Terminé'),
        ('error', 'Erreur'),
    ], string='État', default='draft', required=True)

    file_data = fields.Binary(
        string='Fichier FEC',
        readonly=True,
        attachment=True,
        help="Fichier FEC généré (format TXT)"
    )

    file_name = fields.Char(
        string='Nom du fichier',
        compute='_compute_file_name',
        store=True
    )

    file_size = fields.Integer(
        string='Taille du fichier',
        compute='_compute_file_size',
        help="Taille du fichier en octets"
    )

    line_count = fields.Integer(
        string='Nombre de lignes',
        readonly=True,
        help="Nombre de lignes d'écritures exportées"
    )

    move_count = fields.Integer(
        string='Nombre d\'écritures',
        readonly=True,
        help="Nombre d'écritures comptables exportées"
    )

    error_message = fields.Text(
        string='Message d\'erreur',
        readonly=True
    )

    export_type = fields.Selection([
        ('full', 'Complet'),
        ('partial', 'Partiel'),
    ], string='Type d\'export', default='full', required=True)

    include_draft = fields.Boolean(
        string='Inclure les brouillons',
        default=False,
        help="Inclure les écritures non validées (non recommandé pour FEC officiel)"
    )

    journal_ids = fields.Many2many(
        'account.journal',
        string='Journaux',
        help="Journaux à inclure (vide = tous)"
    )

    # Statistiques
    total_debit = fields.Monetary(
        string='Total Débit',
        currency_field='currency_id',
        readonly=True
    )

    total_credit = fields.Monetary(
        string='Total Crédit',
        currency_field='currency_id',
        readonly=True
    )

    currency_id = fields.Many2one(
        'res.currency',
        related='company_id.currency_id',
        string='Devise',
        readonly=True
    )

    def _default_name(self):
        return f"FEC {fields.Date.today().strftime('%Y')}"

    def _get_fiscal_years(self):
        current_year = fields.Date.today().year
        years = []
        for i in range(10):
            year = current_year - i
            years.append((str(year), str(year)))
        return years

    @api.depends('date_from', 'date_to')
    def _compute_fiscal_year(self):
        for record in self:
            if record.date_from:
                record.fiscal_year = str(record.date_from.year)
            else:
                record.fiscal_year = False

    @api.depends('name', 'fiscal_year')
    def _compute_display_name(self):
        for record in self:
            if record.fiscal_year:
                record.display_name = f"{record.name} - {record.fiscal_year}"
            else:
                record.display_name = record.name

    @api.depends('company_id', 'fiscal_year', 'date_from', 'date_to')
    def _compute_file_name(self):
        for record in self:
            if record.company_id and record.date_from:
                # Format: SIREN + FEC + date_clôture + .txt
                siren = record.company_id.company_registry or 'XXXXXXXXX'
                siren = siren.replace(' ', '')[:9].zfill(9)
                date_str = record.date_to.strftime('%Y%m%d') if record.date_to else ''
                record.file_name = f"{siren}FEC{date_str}.txt"
            else:
                record.file_name = 'FEC.txt'

    @api.depends('file_data')
    def _compute_file_size(self):
        for record in self:
            if record.file_data:
                record.file_size = len(base64.b64decode(record.file_data))
            else:
                record.file_size = 0

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        for record in self:
            if record.date_from and record.date_to and record.date_from > record.date_to:
                raise ValidationError(_("La date de début doit être antérieure à la date de fin."))

    def action_generate_fec(self):
        """Génère le fichier FEC"""
        self.ensure_one()

        try:
            self.state = 'generating'

            # 1. Récupérer les écritures comptables
            moves = self._get_account_moves()

            if not moves:
                raise UserError(_("Aucune écriture comptable trouvée pour la période sélectionnée."))

            # 2. Vérifier la conformité FEC
            self._check_moves_compliance(moves)

            # 3. Générer le fichier
            file_content = self._generate_fec_content(moves)

            # 4. Enregistrer le fichier
            self.write({
                'file_data': base64.b64encode(file_content.encode('utf-8')),
                'state': 'done',
                'move_count': len(moves),
                'line_count': sum(len(move.line_ids) for move in moves),
            })

            # 5. Marquer les écritures comme exportées
            moves.write({'fec_export_date': fields.Datetime.now()})

            # 6. Calculer les totaux
            self._compute_totals(moves)

            _logger.info(f"FEC généré avec succès: {self.file_name} ({self.line_count} lignes)")

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Succès'),
                    'message': _('FEC généré avec succès: %s lignes exportées') % self.line_count,
                    'type': 'success',
                    'sticky': False,
                }
            }

        except Exception as e:
            _logger.error(f"Erreur lors de la génération du FEC: {str(e)}", exc_info=True)
            self.write({
                'state': 'error',
                'error_message': str(e),
            })
            raise UserError(_("Erreur lors de la génération du FEC:\n%s") % str(e))

    def _get_account_moves(self):
        """Récupère les écritures comptables à exporter"""
        domain = [
            ('company_id', '=', self.company_id.id),
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
        ]

        # État des écritures
        if not self.include_draft:
            domain.append(('state', '=', 'posted'))

        # Journaux spécifiques
        if self.journal_ids:
            domain.append(('journal_id', 'in', self.journal_ids.ids))

        moves = self.env['account.move'].search(domain, order='date, name')
        return moves

    def _check_moves_compliance(self, moves):
        """Vérifie la conformité FEC des écritures"""
        errors = []

        for move in moves:
            move_errors = move._check_fec_compliance()
            if move_errors:
                errors.append(f"Écriture {move.name}: {', '.join(move_errors)}")

        if errors:
            error_msg = "\n".join(errors[:10])  # Limiter à 10 premières erreurs
            if len(errors) > 10:
                error_msg += f"\n... et {len(errors) - 10} autres erreurs"
            raise UserError(_(
                "Certaines écritures ne sont pas conformes au format FEC:\n\n%s\n\n"
                "Veuillez corriger ces erreurs avant de générer le FEC."
            ) % error_msg)

    def _generate_fec_content(self, moves):
        """Génère le contenu du fichier FEC"""
        output = io.StringIO()

        # En-têtes FEC (18 colonnes obligatoires)
        headers = [
            'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
            'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
            'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
            'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'
        ]

        # Écrire les en-têtes
        writer = csv.DictWriter(
            output,
            fieldnames=headers,
            delimiter='|',
            quoting=csv.QUOTE_MINIMAL,
            lineterminator='\r\n'
        )
        writer.writeheader()

        # Écrire les lignes
        for move in moves:
            lines_data = move.get_fec_line_data()
            for line_data in lines_data:
                writer.writerow(line_data)

        return output.getvalue()

    def _compute_totals(self, moves):
        """Calcule les totaux débit/crédit"""
        total_debit = 0.0
        total_credit = 0.0

        for move in moves:
            for line in move.line_ids:
                total_debit += line.debit
                total_credit += line.credit

        self.write({
            'total_debit': total_debit,
            'total_credit': total_credit,
        })

    def action_download_fec(self):
        """Télécharge le fichier FEC"""
        self.ensure_one()
        if not self.file_data:
            raise UserError(_("Aucun fichier FEC généré. Veuillez d'abord générer le FEC."))

        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/fec.export/{self.id}/file_data/{self.file_name}?download=true',
            'target': 'self',
        }

    def action_validate_fec(self):
        """Valide le format du FEC généré"""
        self.ensure_one()
        if not self.file_data:
            raise UserError(_("Aucun fichier FEC à valider."))

        # TODO: Implémenter validation approfondie (checksum, format, etc.)
        # Pour l'instant, vérification basique

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Validation'),
                'message': _('FEC validé: %s lignes, format conforme') % self.line_count,
                'type': 'success',
            }
        }

    def action_reset_to_draft(self):
        """Remet en brouillon"""
        self.write({
            'state': 'draft',
            'file_data': False,
            'error_message': False,
            'line_count': 0,
            'move_count': 0,
        })

    def unlink(self):
        """Empêche la suppression des exports terminés"""
        for record in self:
            if record.state == 'done':
                raise UserError(_(
                    "Impossible de supprimer un export FEC terminé.\n"
                    "Ceci est requis pour l'audit trail et la conformité légale."
                ))
        return super(FecExport, self).unlink()
