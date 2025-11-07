# -*- coding: utf-8 -*-

from odoo import models, fields


class ResPartner(models.Model):
    _inherit = 'res.partner'

    einvoice_mandatory = fields.Boolean(string='Facture électronique obligatoire', default=False)
    einvoice_format_id = fields.Many2one('einvoice.format', string='Format par défaut')

    # Identifiants pour facture électronique
    siret = fields.Char(string='SIRET', size=14)
    siren = fields.Char(string='SIREN', size=9)
    peppol_id = fields.Char(string='Peppol ID', help='Identifiant Peppol (ex: 0009:FR12345678901)')
    chorus_service_code = fields.Char(string='Code service Chorus', help='Code service destinataire Chorus Pro')

    einvoice_email = fields.Char(string='Email e-facture', help='Email pour envoi des factures électroniques')
