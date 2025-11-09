# -*- coding: utf-8 -*-
import base64
from io import StringIO
from datetime import datetime
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class XImportParser(models.AbstractModel):
    """
    Parser pour le format XIMPORT
    Format universel compatible avec Ciel, EBP, Sage
    """
    _name = 'account.ximport.parser'
    _description = 'XIMPORT Format Parser'

    # Structure du format XIMPORT (champs à largeur fixe)
    # Format ligne type L (écriture)
    XIMPORT_LINE_FORMAT = {
        'type': (0, 1),           # L = Ligne d'écriture
        'journal': (1, 3),         # Code journal (2 car)
        'date': (3, 9),            # Date JJMMAA (6 car)
        'account': (9, 19),        # Numéro de compte (10 car)
        'label': (19, 44),         # Libellé (25 car)
        'debit': (44, 58),         # Débit (14 car, 2 décimales)
        'credit': (58, 72),        # Crédit (14 car, 2 décimales)
        'sens': (72, 73),          # C/D = Crédit/Débit (1 car)
        'piece': (73, 81),         # N° de pièce (8 car)
        'lettrage': (81, 84),      # Code lettrage (3 car)
        'devise': (84, 87),        # Code devise (3 car)
        'montant_dev': (87, 101),  # Montant devise (14 car)
        'echeance': (101, 107),    # Date échéance JJMMAA (6 car)
    }

    @api.model
    def parse_ximport_file(self, file_content, file_name):
        """
        Parse un fichier XIMPORT et retourne les écritures comptables

        :param file_content: Contenu du fichier encodé en base64
        :param file_name: Nom du fichier
        :return: Liste des écritures à créer
        """
        # Décode le fichier
        try:
            content = base64.b64decode(file_content).decode('cp1252')  # Windows-1252 (ANSI)
        except UnicodeDecodeError:
            try:
                content = base64.b64decode(file_content).decode('utf-8')
            except UnicodeDecodeError:
                content = base64.b64decode(file_content).decode('iso-8859-15')

        lines = content.split('\n')

        entries = []
        errors = []
        line_number = 0
        current_move = None

        for line in lines:
            line_number += 1

            # Ignore les lignes vides
            if not line.strip():
                continue

            # Détermine le type de ligne
            line_type = line[0] if line else ''

            try:
                if line_type == 'L':
                    # Ligne d'écriture
                    entry = self._parse_ximport_line(line, line_number)
                    entries.append(entry)
                elif line_type == 'M':
                    # En-tête de mouvement (optionnel dans certaines versions)
                    pass
                elif line_type == '#' or line_type == ';':
                    # Commentaire
                    pass
                else:
                    # Type inconnu, on ignore
                    pass

            except Exception as e:
                errors.append({
                    'line': line_number,
                    'error': str(e),
                    'data': line
                })

        if errors and not entries:
            raise UserError(_(
                "Erreurs lors de l'import du fichier XIMPORT:\n%s"
            ) % '\n'.join([f"Ligne {e['line']}: {e['error']}" for e in errors[:10]]))

        return {
            'entries': entries,
            'errors': errors,
            'total_lines': line_number,
            'success_count': len(entries),
            'error_count': len(errors),
        }

    def _parse_ximport_line(self, line, line_number):
        """Parse une ligne XIMPORT et retourne les données formatées"""

        # Extrait les champs selon leurs positions
        def extract_field(field_name):
            start, end = self.XIMPORT_LINE_FORMAT[field_name]
            value = line[start:end] if len(line) >= end else ''
            return value.strip()

        journal = extract_field('journal')
        date_str = extract_field('date')
        account = extract_field('account')
        label = extract_field('label')
        debit_str = extract_field('debit')
        credit_str = extract_field('credit')
        sens = extract_field('sens')
        piece = extract_field('piece')
        lettrage = extract_field('lettrage')
        devise = extract_field('devise')
        montant_dev_str = extract_field('montant_dev')
        echeance_str = extract_field('echeance')

        # Validation
        if not journal:
            raise ValidationError(f"Ligne {line_number}: Code journal manquant")
        if not account:
            raise ValidationError(f"Ligne {line_number}: Numéro de compte manquant")

        # Parse la date (JJMMAA)
        date = self._parse_ximport_date(date_str, 'date')

        # Parse les montants
        debit = self._parse_ximport_amount(debit_str)
        credit = self._parse_ximport_amount(credit_str)

        # Si sens est fourni, l'utilise pour déterminer débit/crédit
        if sens and sens.upper() in ['D', 'C']:
            amount = debit if debit else credit
            if sens.upper() == 'D':
                debit = amount
                credit = 0
            else:
                credit = amount
                debit = 0

        # Validation
        if debit == 0 and credit == 0:
            raise ValidationError(f"Ligne {line_number}: Montant manquant")

        # Date d'échéance
        echeance = self._parse_ximport_date(echeance_str, 'echeance') if echeance_str else False

        return {
            'journal_code': journal,
            'date': date,
            'account_code': account,
            'name': label or '/',
            'debit': debit,
            'credit': credit,
            'ref': piece,
            'matching_number': lettrage,
            'currency_code': devise if devise else '',
            'currency_amount': self._parse_ximport_amount(montant_dev_str),
            'date_maturity': echeance,
        }

    def _parse_ximport_date(self, date_str, field_name):
        """Parse une date au format XIMPORT (JJMMAA)"""
        if not date_str or not date_str.strip():
            return False

        date_str = date_str.strip()

        # Format XIMPORT: JJMMAA (6 caractères)
        if len(date_str) == 6:
            try:
                day = int(date_str[0:2])
                month = int(date_str[2:4])
                year = int(date_str[4:6])

                # Détermine le siècle (2000+ si < 50, sinon 1900+)
                if year < 50:
                    year += 2000
                else:
                    year += 1900

                return datetime(year, month, day).date()
            except ValueError:
                raise ValidationError(f"Date invalide pour {field_name}: {date_str}")

        # Format alternatif: JJMMAAAA (8 caractères)
        if len(date_str) == 8:
            try:
                day = int(date_str[0:2])
                month = int(date_str[2:4])
                year = int(date_str[4:8])
                return datetime(year, month, day).date()
            except ValueError:
                raise ValidationError(f"Date invalide pour {field_name}: {date_str}")

        # Format alternatif: JJ/MM/AA ou JJ/MM/AAAA
        if '/' in date_str:
            parts = date_str.split('/')
            if len(parts) == 3:
                try:
                    day = int(parts[0])
                    month = int(parts[1])
                    year = int(parts[2])
                    if year < 100:
                        year += 2000 if year < 50 else 1900
                    return datetime(year, month, day).date()
                except ValueError:
                    raise ValidationError(f"Date invalide pour {field_name}: {date_str}")

        raise ValidationError(f"Format de date invalide pour {field_name}: {date_str}")

    def _parse_ximport_amount(self, amount_str):
        """Parse un montant XIMPORT (entier avec 2 décimales implicites)"""
        if not amount_str or not amount_str.strip():
            return 0.0

        amount_str = amount_str.strip()

        try:
            # Le montant est stocké en centimes (2 décimales implicites)
            # Ex: "123456" = 1234.56 €
            amount_int = int(amount_str)
            return amount_int / 100.0
        except ValueError:
            # Si échec, essaie de parser comme float normal
            try:
                return float(amount_str.replace(',', '.'))
            except ValueError:
                raise ValidationError(f"Montant invalide: {amount_str}")

    @api.model
    def generate_ximport_file(self, date_from, date_to, company_id=None):
        """
        Génère un fichier XIMPORT pour la période donnée

        :param date_from: Date de début
        :param date_to: Date de fin
        :param company_id: ID de la société (optionnel)
        :return: Contenu du fichier XIMPORT encodé en base64
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

        # Génère le contenu XIMPORT
        lines = []

        for move in moves:
            for line in move.line_ids:
                ximport_line = self._format_ximport_line(move, line, company)
                lines.append(ximport_line)

        content = '\n'.join(lines)

        # Encode en base64
        return base64.b64encode(content.encode('cp1252'))

    def _format_ximport_line(self, move, line, company):
        """Formate une ligne de pièce comptable au format XIMPORT"""

        # Code journal (2 car max)
        journal = (move.journal_id.code or '')[:2].ljust(2)

        # Date JJMMAA
        date_str = move.date.strftime('%d%m%y')

        # Compte (10 car max, aligné à gauche)
        account = (line.account_id.code or '')[:10].ljust(10)

        # Libellé (25 car max, aligné à gauche)
        label = (line.name or '/')[:25].ljust(25)

        # Montants en centimes (14 car, alignés à droite)
        debit_cents = int(line.debit * 100)
        credit_cents = int(line.credit * 100)
        debit_str = str(debit_cents).rjust(14)
        credit_str = str(credit_cents).rjust(14)

        # Sens C/D
        sens = 'D' if line.debit > 0 else 'C'

        # Numéro de pièce (8 car max, aligné à gauche)
        piece = (move.ref or move.name or '')[:8].ljust(8)

        # Lettrage (3 car max)
        lettrage = (line.full_reconcile_id.name or '')[:3].ljust(3) if line.full_reconcile_id else '   '

        # Devise (3 car)
        currency_code = line.currency_id.name if line.currency_id and line.currency_id != company.currency_id else ''
        devise = (currency_code or '')[:3].ljust(3)

        # Montant devise en centimes (14 car)
        if currency_code:
            montant_dev_cents = int(abs(line.amount_currency) * 100)
            montant_dev = str(montant_dev_cents).rjust(14)
        else:
            montant_dev = ''.ljust(14)

        # Date échéance JJMMAA (6 car)
        if line.date_maturity:
            echeance = line.date_maturity.strftime('%d%m%y')
        else:
            echeance = '      '

        # Construction de la ligne complète
        ximport_line = f"L{journal}{date_str}{account}{label}{debit_str}{credit_str}{sens}{piece}{lettrage}{devise}{montant_dev}{echeance}"

        return ximport_line
