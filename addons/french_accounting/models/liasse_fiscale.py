# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class LiasseFiscale(models.Model):
    _name = 'liasse.fiscale'
    _description = 'Liasse fiscale française'
    _order = 'fiscal_year desc'

    name = fields.Char(string='Nom', required=True)
    company_id = fields.Many2one('res.company', string='Société', required=True, default=lambda self: self.env.company)
    fiscal_year = fields.Char(string='Exercice fiscal', required=True)
    type = fields.Selection([
        ('2033', '2033 - BIC Réel simplifié'),
        ('2035', '2035 - BNC'),
        ('2050', '2050 - BIC Réel normal'),
    ], string='Type', required=True, default='2033')
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('done', 'Validée'),
    ], default='draft')
    file = fields.Binary(string='Fichier PDF', attachment=True)
    filename = fields.Char(string='Nom du fichier')
