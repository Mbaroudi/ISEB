# -*- coding: utf-8 -*-
import base64
import csv
from io import StringIO
from datetime import datetime
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class FECParser(models.AbstractModel):
    """
    Parser pour le format FEC (Fichier des Écritures Comptables)
    Conforme à l'article L47 A du LPF (Livre des Procédures Fiscales)
    """
    _name = 'account.fec.parser'
    _description = 'FEC Format Parser'

    # Les 18 champs obligatoires du FEC
    FEC_FIELDS = [
        'JournalCode',      # Code journal (ex: VE, AC, BQ)
        'JournalLib',       # Libellé journal
        'EcritureNum',      # Numéro d'écriture
        'EcritureDate',     # Date d'écriture (yyyyMMdd)
        'CompteNum',        # Numéro de compte
        'CompteLib',        # Libellé du compte
        'CompAuxNum',       # Compte auxiliaire (tiers)
        'CompAuxLib',       # Libellé compte auxiliaire
        'PieceRef',         # Référence de la pièce
        'PieceDate',        # Date de la pièce (yyyyMMdd)
        'EcritureLib',      # Libellé de l'écriture
        'Debit',            # Montant au débit
        'Credit',           # Montant au crédit
        'EcritureLet',      # Lettrage de l'écriture
        'DateLet',          # Date de lettrage (yyyyMMdd)
        'ValidDate',        # Date de validation (yyyyMMdd)
        'Montantdevise',    # Montant en devise
        'Idevise',          # Identifiant de la devise
    ]

    @api.model
    def parse_fec_file(self, file_content, file_name):
        """
        Parse un fichier FEC et retourne les écritures comptables

        :param file_content: Contenu du fichier encodé en base64
        :param file_name: Nom du fichier
        :return: Liste des écritures à créer
        """
        # Décode le fichier
        try:
            content = base64.b64decode(file_content).decode('utf-8')
        except UnicodeDecodeError:
            # Essayer avec ISO-8859-15 (Latin-9)
            content = base64.b64decode(file_content).decode('iso-8859-15')

        # Détecte le séparateur (pipe | ou tabulation)
        delimiter = '|' if '|' in content.split('\n')[0] else '\t'

        # Parse le CSV
        reader = csv.DictReader(StringIO(content), delimiter=delimiter, fieldnames=self.FEC_FIELDS)

        entries = []
        errors = []
        line_number = 0

        for row in reader:
            line_number += 1

            # Ignore la ligne d'en-tête si présente
            if line_number == 1 and row['JournalCode'] == 'JournalCode':
                continue

            try:
                entry = self._parse_fec_line(row, line_number)
                entries.append(entry)
            except Exception as e:
                errors.append({
                    'line': line_number,
                    'error': str(e),
                    'data': row
                })

        if errors and not entries:
            raise UserError(_(
                "Erreurs lors de l'import du fichier FEC:\n%s"
            ) % '\n'.join([f"Ligne {e['line']}: {e['error']}" for e in errors[:10]]))

        return {
            'entries': entries,
            'errors': errors,
            'total_lines': line_number,
            'success_count': len(entries),
            'error_count': len(errors),
        }

    def _parse_fec_line(self, row, line_number):
        """Parse une ligne FEC et retourne les données formatées"""

        # Validation des champs obligatoires
        required_fields = ['JournalCode', 'EcritureNum', 'EcritureDate', 'CompteNum']
        for field in required_fields:
            if not row.get(field) or not row[field].strip():
                raise ValidationError(f"Champ obligatoire manquant: {field}")

        # Parse les dates
        ecriture_date = self._parse_fec_date(row['EcritureDate'], 'EcritureDate')
        piece_date = self._parse_fec_date(row.get('PieceDate'), 'PieceDate') if row.get('PieceDate') else ecriture_date

        # Parse les montants
        debit = self._parse_amount(row.get('Debit', '0'))
        credit = self._parse_amount(row.get('Credit', '0'))

        # Validation: une écriture doit avoir soit un débit, soit un crédit
        if debit == 0 and credit == 0:
            raise ValidationError(f"Ligne {line_number}: L'écriture doit avoir un montant débit ou crédit")

        return {
            'journal_code': row['JournalCode'].strip(),
            'journal_lib': row.get('JournalLib', '').strip(),
            'move_name': row['EcritureNum'].strip(),
            'date': ecriture_date,
            'account_code': row['CompteNum'].strip(),
            'account_label': row.get('CompteLib', '').strip(),
            'partner_ref': row.get('CompAuxNum', '').strip(),
            'partner_name': row.get('CompAuxLib', '').strip(),
            'ref': row.get('PieceRef', '').strip(),
            'piece_date': piece_date,
            'name': row.get('EcritureLib', '').strip(),
            'debit': debit,
            'credit': credit,
            'matching_number': row.get('EcritureLet', '').strip(),
            'currency_amount': self._parse_amount(row.get('Montantdevise', '0')),
            'currency_code': row.get('Idevise', '').strip(),
        }

    def _parse_fec_date(self, date_str, field_name):
        """Parse une date au format FEC (yyyyMMdd)"""
        if not date_str or not date_str.strip():
            return False

        date_str = date_str.strip()

        # Format FEC standard: yyyyMMdd
        try:
            return datetime.strptime(date_str, '%Y%m%d').date()
        except ValueError:
            pass

        # Format alternatif: yyyy-MM-dd
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

        # Format alternatif: dd/MM/yyyy
        try:
            return datetime.strptime(date_str, '%d/%m/%Y').date()
        except ValueError:
            raise ValidationError(f"Format de date invalide pour {field_name}: {date_str}")

    def _parse_amount(self, amount_str):
        """Parse un montant (peut contenir virgule ou point comme séparateur décimal)"""
        if not amount_str or not amount_str.strip():
            return 0.0

        amount_str = amount_str.strip()
        # Remplace la virgule par un point
        amount_str = amount_str.replace(',', '.')
        # Supprime les espaces
        amount_str = amount_str.replace(' ', '')

        try:
            return float(amount_str)
        except ValueError:
            raise ValidationError(f"Montant invalide: {amount_str}")

    @api.model
    def generate_fec_file(self, date_from, date_to, company_id=None):
        """
        Génère un fichier FEC conforme pour la période donnée

        :param date_from: Date de début
        :param date_to: Date de fin
        :param company_id: ID de la société (optionnel)
        :return: Contenu du fichier FEC encodé en base64
        """
        if not company_id:
            company_id = self.env.company.id

        company = self.env['res.company'].browse(company_id)

        # Récupère toutes les écritures comptables validées de la période
        domain = [
            ('date', '>=', date_from),
            ('date', '<=', date_to),
            ('company_id', '=', company_id),
            ('state', '=', 'posted'),
        ]

        moves = self.env['account.move'].search(domain, order='date, name')

        if not moves:
            raise UserError(_("Aucune écriture comptable trouvée pour la période sélectionnée."))

        # Génère le contenu FEC
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=self.FEC_FIELDS, delimiter='|')

        # Pas d'en-tête (non requis par le format FEC)

        for move in moves:
            for line in move.line_ids:
                row = self._format_fec_line(move, line, company)
                writer.writerow(row)

        content = output.getvalue()

        # Encode en base64
        return base64.b64encode(content.encode('utf-8'))

    def _format_fec_line(self, move, line, company):
        """Formate une ligne de pièce comptable au format FEC"""

        # Détermine le code journal
        journal_code = move.journal_id.code or ''

        # Formate les dates au format yyyyMMdd
        ecriture_date = move.date.strftime('%Y%m%d')
        piece_date = move.invoice_date.strftime('%Y%m%d') if move.invoice_date else ecriture_date
        valid_date = ecriture_date  # Date de validation = date d'écriture

        # Lettrage
        matching = line.full_reconcile_id.name if line.full_reconcile_id else ''
        date_let = line.full_reconcile_id.create_date.strftime('%Y%m%d') if line.full_reconcile_id else ''

        # Compte auxiliaire (tiers)
        partner_ref = line.partner_id.ref or '' if line.partner_id else ''
        partner_name = line.partner_id.name or '' if line.partner_id else ''

        # Devise
        currency_code = line.currency_id.name if line.currency_id and line.currency_id != company.currency_id else ''
        currency_amount = abs(line.amount_currency) if currency_code else 0.0

        return {
            'JournalCode': journal_code[:10],
            'JournalLib': move.journal_id.name[:100],
            'EcritureNum': move.name[:20],
            'EcritureDate': ecriture_date,
            'CompteNum': line.account_id.code[:20],
            'CompteLib': line.account_id.name[:100],
            'CompAuxNum': partner_ref[:20],
            'CompAuxLib': partner_name[:100],
            'PieceRef': (move.ref or '')[:20],
            'PieceDate': piece_date,
            'EcritureLib': (line.name or '')[:200],
            'Debit': f'{line.debit:.2f}'.replace('.', ','),
            'Credit': f'{line.credit:.2f}'.replace('.', ','),
            'EcritureLet': matching[:3],
            'DateLet': date_let,
            'ValidDate': valid_date,
            'Montantdevise': f'{currency_amount:.2f}'.replace('.', ',') if currency_code else '',
            'Idevise': currency_code[:3],
        }

    @api.model
    def validate_fec_file(self, file_content):
        """
        Valide un fichier FEC sans l'importer
        Utile pour pré-vérifier avant import

        :param file_content: Contenu du fichier encodé en base64
        :return: Résultat de la validation
        """
        try:
            result = self.parse_fec_file(file_content, 'validation.txt')
            return {
                'valid': True,
                'message': f"Fichier FEC valide: {result['success_count']} lignes correctes",
                'warnings': result['errors'] if result['errors'] else [],
            }
        except Exception as e:
            return {
                'valid': False,
                'message': str(e),
                'warnings': [],
            }
