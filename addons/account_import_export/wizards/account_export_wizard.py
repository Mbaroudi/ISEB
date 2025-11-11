# -*- coding: utf-8 -*-
import base64
from datetime import datetime
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class AccountExportWizard(models.TransientModel):
    _name = 'account.export.wizard'
    _description = 'Assistant d\'export comptable'

    date_from = fields.Date(
        string="Date de début",
        required=True,
        default=lambda self: fields.Date.today().replace(month=1, day=1),
        help="Date de début de la période à exporter"
    )
    date_to = fields.Date(
        string="Date de fin",
        required=True,
        default=fields.Date.today,
        help="Date de fin de la période à exporter"
    )

    export_format = fields.Selection([
        ('fec', 'FEC (Fichier des Écritures Comptables) - Obligatoire France'),
        ('ximport', 'XIMPORT (Compatible Ciel/EBP/Sage)'),
        ('both', 'Les deux formats'),
    ], string="Format d'export", required=True, default='fec',
        help="Format du fichier à générer")

    company_id = fields.Many2one(
        'res.company',
        string="Société",
        required=True,
        default=lambda self: self.env.company
    )

    # Fichiers générés
    fec_file = fields.Binary(string="Fichier FEC", readonly=True)
    fec_filename = fields.Char(string="Nom fichier FEC", readonly=True)

    ximport_file = fields.Binary(string="Fichier XIMPORT", readonly=True)
    ximport_filename = fields.Char(string="Nom fichier XIMPORT", readonly=True)

    state = fields.Selection([
        ('draft', 'Configuration'),
        ('done', 'Terminé'),
    ], default='draft', string="État")

    def action_generate(self):
        """Génère les fichiers d'export"""
        self.ensure_one()

        if self.date_from > self.date_to:
            raise UserError(_("La date de début doit être antérieure à la date de fin."))

        try:
            # Export FEC
            if self.export_format in ['fec', 'both']:
                fec_content = self.env['account.fec.parser'].generate_fec_file(
                    self.date_from,
                    self.date_to,
                    self.company_id.id
                )
                fec_filename = self._get_fec_filename()

                self.fec_file = fec_content
                self.fec_filename = fec_filename

            # Export XIMPORT
            if self.export_format in ['ximport', 'both']:
                ximport_content = self.env['account.ximport.parser'].generate_ximport_file(
                    self.date_from,
                    self.date_to,
                    self.company_id.id
                )
                ximport_filename = 'XIMPORT.TXT'

                self.ximport_file = ximport_content
                self.ximport_filename = ximport_filename

            self.state = 'done'

            return {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
            }

        except Exception as e:
            raise UserError(_(
                "Erreur lors de la génération de l'export:\n%s"
            ) % str(e))

    def _get_fec_filename(self):
        """
        Génère le nom du fichier FEC selon le format officiel:
        SIRENFECAAAAMMJJ.txt
        où AAAAMMJJ est la date de clôture
        """
        siren = self.company_id.company_registry or 'SIREN'
        # Nettoie le SIREN (garde seulement les chiffres)
        siren = ''.join(filter(str.isdigit, siren))
        if len(siren) != 9:
            siren = siren[:9].ljust(9, '0')

        date_str = self.date_to.strftime('%Y%m%d')
        return f"{siren}FEC{date_str}.txt"

    def action_close(self):
        """Ferme l'assistant"""
        return {'type': 'ir.actions.act_window_close'}
