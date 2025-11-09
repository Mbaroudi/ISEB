# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class AccountImportWizard(models.TransientModel):
    _name = 'account.import.wizard'
    _description = 'Assistant d\'import comptable'

    file_data = fields.Binary(
        string="Fichier à importer",
        required=True,
        help="Sélectionnez le fichier FEC, XIMPORT ou CSV à importer"
    )
    file_name = fields.Char(string="Nom du fichier")

    file_format = fields.Selection([
        ('auto', 'Détection automatique'),
        ('fec', 'FEC (Fichier des Écritures Comptables)'),
        ('ximport', 'XIMPORT (Ciel/EBP/Sage)'),
        ('csv', 'CSV'),
    ], string="Format", required=True, default='auto',
        help="Le format sera détecté automatiquement selon l'extension et le contenu du fichier")

    validate_before_import = fields.Boolean(
        string="Valider avant import",
        default=True,
        help="Valide le fichier sans l'importer pour vérifier les erreurs"
    )

    auto_create_accounts = fields.Boolean(
        string="Créer automatiquement les comptes manquants",
        default=False,
        help="Crée automatiquement les comptes comptables qui n'existent pas dans le plan comptable"
    )

    auto_create_partners = fields.Boolean(
        string="Créer automatiquement les tiers manquants",
        default=True,
        help="Crée automatiquement les partenaires (clients/fournisseurs) qui n'existent pas"
    )

    # Résultats de la validation/import
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('validated', 'Validé'),
        ('imported', 'Importé'),
        ('error', 'Erreur'),
    ], default='draft', string="État")

    result_message = fields.Html(string="Résultat", readonly=True)
    success_count = fields.Integer(string="Lignes importées", readonly=True)
    error_count = fields.Integer(string="Erreurs", readonly=True)

    def action_validate(self):
        """Valide le fichier sans l'importer"""
        self.ensure_one()

        if not self.file_data:
            raise UserError(_("Veuillez sélectionner un fichier à valider."))

        # Détecte le format
        file_format = self._detect_format()

        try:
            # Parse le fichier selon le format
            if file_format == 'fec':
                parser = self.env['account.fec.parser']
                result = parser.parse_fec_file(self.file_data, self.file_name)
            elif file_format == 'ximport':
                parser = self.env['account.ximport.parser']
                result = parser.parse_ximport_file(self.file_data, self.file_name)
            else:
                raise UserError(_("Format de fichier non supporté: %s") % file_format)

            # Prépare le message de résultat
            message = f"""
            <div style="padding: 10px;">
                <h3 style="color: #28a745;">✓ Validation réussie</h3>
                <p><strong>Format détecté:</strong> {file_format.upper()}</p>
                <p><strong>Lignes valides:</strong> {result['success_count']}</p>
                <p><strong>Erreurs:</strong> {result['error_count']}</p>
            """

            if result['errors']:
                message += "<h4 style='color: #dc3545;'>Erreurs détectées:</h4><ul>"
                for error in result['errors'][:10]:  # Affiche les 10 premières erreurs
                    message += f"<li>Ligne {error['line']}: {error['error']}</li>"
                if len(result['errors']) > 10:
                    message += f"<li>... et {len(result['errors']) - 10} autres erreurs</li>"
                message += "</ul>"

            message += "</div>"

            self.write({
                'state': 'validated',
                'result_message': message,
                'success_count': result['success_count'],
                'error_count': result['error_count'],
            })

            return {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
            }

        except Exception as e:
            self.write({
                'state': 'error',
                'result_message': f"<div style='color: #dc3545; padding: 10px;'><h3>✗ Erreur de validation</h3><p>{str(e)}</p></div>",
            })

            return {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
            }

    def action_import(self):
        """Importe le fichier"""
        self.ensure_one()

        if not self.file_data:
            raise UserError(_("Veuillez sélectionner un fichier à importer."))

        # Si validation demandée et pas encore faite
        if self.validate_before_import and self.state == 'draft':
            self.action_validate()
            if self.state == 'error' or self.error_count > 0:
                raise UserError(_(
                    "Le fichier contient des erreurs. Veuillez les corriger avant l'import.\n"
                    "Vous pouvez désactiver 'Valider avant import' pour forcer l'import."
                ))

        # Détecte le format
        file_format = self._detect_format()

        try:
            # Parse le fichier
            if file_format == 'fec':
                parser = self.env['account.fec.parser']
                parse_result = parser.parse_fec_file(self.file_data, self.file_name)
            elif file_format == 'ximport':
                parser = self.env['account.ximport.parser']
                parse_result = parser.parse_ximport_file(self.file_data, self.file_name)
            else:
                raise UserError(_("Format de fichier non supporté: %s") % file_format)

            # Importe les écritures
            import_result = self.env['account.move'].import_accounting_entries(
                parse_result['entries'],
                self.file_name,
                file_format
            )

            # Prépare le message de résultat
            message = f"""
            <div style="padding: 10px;">
                <h3 style="color: #28a745;">✓ Import réussi</h3>
                <p><strong>Format:</strong> {file_format.upper()}</p>
                <p><strong>Pièces comptables créées:</strong> {import_result['success_count']}</p>
                <p><strong>Erreurs:</strong> {import_result['error_count']}</p>
            """

            if import_result['errors']:
                message += "<h4 style='color: #ffc107;'>Avertissements:</h4><ul>"
                for error in import_result['errors'][:10]:
                    message += f"<li>{error['move']}: {error['error']}</li>"
                if len(import_result['errors']) > 10:
                    message += f"<li>... et {len(import_result['errors']) - 10} autres erreurs</li>"
                message += "</ul>"

            message += f"""
                <p style="margin-top: 20px;">
                    <a href="/web#model=account.move&view_type=list"
                       style="color: #007bff; text-decoration: underline;">
                       Voir les pièces importées
                    </a>
                </p>
            </div>
            """

            self.write({
                'state': 'imported',
                'result_message': message,
                'success_count': import_result['success_count'],
                'error_count': import_result['error_count'],
            })

            return {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
            }

        except Exception as e:
            self.write({
                'state': 'error',
                'result_message': f"<div style='color: #dc3545; padding: 10px;'><h3>✗ Erreur d'import</h3><p>{str(e)}</p></div>",
            })

            return {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
            }

    def _detect_format(self):
        """Détecte automatiquement le format du fichier"""
        if self.file_format != 'auto':
            return self.file_format

        # Détection basée sur le nom de fichier
        if self.file_name:
            name_lower = self.file_name.lower()
            if 'fec' in name_lower or name_lower.endswith('.txt'):
                return 'fec'
            elif 'ximport' in name_lower:
                return 'ximport'
            elif name_lower.endswith('.csv'):
                return 'csv'

        # Par défaut, essaie FEC
        return 'fec'

    def action_close(self):
        """Ferme l'assistant"""
        return {'type': 'ir.actions.act_window_close'}
