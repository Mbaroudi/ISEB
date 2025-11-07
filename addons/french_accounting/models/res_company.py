# -*- coding: utf-8 -*-

from odoo import models, fields


class ResCompany(models.Model):
    _inherit = 'res.company'

    french_regime_tva = fields.Selection([
        ('reel_normal', 'Réel normal'),
        ('reel_simplifie', 'Réel simplifié'),
        ('franchise', 'Franchise en base'),
    ], string='Régime TVA', default='reel_normal')

    french_fiscal_year_start = fields.Selection([
        ('01-01', '1er janvier'),
        ('04-01', '1er avril'),
        ('07-01', '1er juillet'),
        ('10-01', '1er octobre'),
    ], string='Début exercice fiscal', default='01-01')
