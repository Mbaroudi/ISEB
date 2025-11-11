# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class AccountJournal(models.Model):
    _inherit = 'account.journal'

    @api.constrains('code')
    def _check_code_length(self):
        """Vérifie que le code journal respecte les normes françaises"""
        for journal in self:
            if journal.code and len(journal.code) > 3:
                raise ValidationError(_(
                    "Le code du journal ne doit pas dépasser 3 caractères (norme FEC française)."
                ))
