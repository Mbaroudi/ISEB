# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class AccountMove(models.Model):
    _inherit = 'account.move'

    imported_from = fields.Char(
        string="Importé depuis",
        help="Nom du fichier d'import",
        readonly=True,
    )
    import_date = fields.Datetime(
        string="Date d'import",
        readonly=True,
    )
    import_format = fields.Selection([
        ('fec', 'FEC (Fichier des Écritures Comptables)'),
        ('ximport', 'XIMPORT (Ciel/EBP/Sage)'),
        ('csv', 'CSV'),
    ], string="Format d'import", readonly=True)

    @api.model
    def import_accounting_entries(self, entries, file_name, file_format):
        """
        Importe des écritures comptables depuis un fichier parsé

        :param entries: Liste des écritures parsées
        :param file_name: Nom du fichier
        :param file_format: Format du fichier (fec, ximport, csv)
        :return: Résultat de l'import
        """
        created_moves = self.env['account.move']
        errors = []

        # Groupe les lignes par pièce comptable
        moves_data = {}
        for entry in entries:
            move_key = f"{entry['journal_code']}_{entry.get('move_name', entry['date'])}"
            if move_key not in moves_data:
                moves_data[move_key] = {
                    'journal_code': entry['journal_code'],
                    'date': entry['date'],
                    'ref': entry.get('ref', ''),
                    'lines': []
                }
            moves_data[move_key]['lines'].append(entry)

        # Crée les pièces comptables
        for move_key, move_data in moves_data.items():
            try:
                move = self._create_move_from_import(move_data, file_name, file_format)
                if move:
                    created_moves |= move
            except Exception as e:
                errors.append({
                    'move': move_key,
                    'error': str(e),
                })

        return {
            'created_moves': created_moves,
            'success_count': len(created_moves),
            'error_count': len(errors),
            'errors': errors,
        }

    def _create_move_from_import(self, move_data, file_name, file_format):
        """Crée une pièce comptable depuis des données importées"""

        # Trouve le journal
        journal = self.env['account.journal'].search([
            ('code', '=', move_data['journal_code']),
            ('company_id', '=', self.env.company.id)
        ], limit=1)

        if not journal:
            raise UserError(_(
                "Journal non trouvé: %s. Veuillez créer ce journal avant l'import."
            ) % move_data['journal_code'])

        # Prépare les lignes d'écriture
        line_ids = []
        for line_data in move_data['lines']:
            line_vals = self._prepare_move_line_from_import(line_data)
            if line_vals:
                line_ids.append((0, 0, line_vals))

        if not line_ids:
            return False

        # Crée la pièce comptable
        move_vals = {
            'journal_id': journal.id,
            'date': move_data['date'],
            'ref': move_data['ref'] or '/',
            'line_ids': line_ids,
            'imported_from': file_name,
            'import_date': fields.Datetime.now(),
            'import_format': file_format,
        }

        move = self.create(move_vals)

        return move

    def _prepare_move_line_from_import(self, line_data):
        """Prépare les valeurs d'une ligne d'écriture depuis des données importées"""

        # Trouve ou crée le compte comptable
        account = self._find_or_create_account(
            line_data['account_code'],
            line_data.get('account_label', '')
        )

        if not account:
            raise UserError(_(
                "Compte comptable non trouvé: %s"
            ) % line_data['account_code'])

        # Trouve le partenaire si compte auxiliaire fourni
        partner = False
        if line_data.get('partner_ref'):
            partner = self.env['res.partner'].search([
                ('ref', '=', line_data['partner_ref'])
            ], limit=1)
            if not partner and line_data.get('partner_name'):
                # Crée le partenaire s'il n'existe pas
                partner = self.env['res.partner'].create({
                    'name': line_data['partner_name'],
                    'ref': line_data['partner_ref'],
                })

        # Devise
        currency = False
        if line_data.get('currency_code'):
            currency = self.env['res.currency'].search([
                ('name', '=', line_data['currency_code'])
            ], limit=1)

        line_vals = {
            'account_id': account.id,
            'name': line_data.get('name', '/'),
            'debit': line_data.get('debit', 0.0),
            'credit': line_data.get('credit', 0.0),
            'partner_id': partner.id if partner else False,
            'currency_id': currency.id if currency else False,
            'amount_currency': line_data.get('currency_amount', 0.0) if currency else 0.0,
            'date_maturity': line_data.get('date_maturity', False),
        }

        return line_vals

    def _find_or_create_account(self, account_code, account_label=''):
        """Trouve ou crée un compte comptable"""

        account = self.env['account.account'].search([
            ('code', '=', account_code),
            ('company_id', '=', self.env.company.id)
        ], limit=1)

        if account:
            return account

        # Si le compte n'existe pas, on pourrait le créer automatiquement
        # Pour l'instant, on lève une erreur pour que l'utilisateur le crée manuellement
        # ou configure le plan comptable avant l'import

        return False
