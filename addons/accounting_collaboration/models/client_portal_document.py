# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ClientPortalDocument(models.Model):
    """
    Extension du modèle de document pour ajouter les questions
    """
    _inherit = 'client_portal.document'

    question_ids = fields.One2many(
        'accounting.question',
        'document_id',
        string="Questions"
    )

    question_count = fields.Integer(
        string="Nombre de questions",
        compute='_compute_question_count',
        store=True
    )

    has_pending_questions = fields.Boolean(
        string="Questions en attente",
        compute='_compute_has_pending_questions',
        store=True
    )

    @api.depends('question_ids')
    def _compute_question_count(self):
        """Calcule le nombre de questions"""
        for doc in self:
            doc.question_count = len(doc.question_ids)

    @api.depends('question_ids.state')
    def _compute_has_pending_questions(self):
        """Vérifie si des questions sont en attente"""
        for doc in self:
            doc.has_pending_questions = bool(
                doc.question_ids.filtered(lambda q: q.state in ['pending', 'answered'])
            )

    def action_create_question(self):
        """Ouvre un formulaire pour créer une question sur ce document"""
        self.ensure_one()

        return {
            'name': _('Nouvelle Question'),
            'type': 'ir.actions.act_window',
            'res_model': 'accounting.question',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_document_id': self.id,
                'default_partner_id': self.partner_id.id,
                'default_name': f"Question sur {self.name}",
            }
        }

    def action_view_questions(self):
        """Affiche les questions liées à ce document"""
        self.ensure_one()

        return {
            'name': _('Questions'),
            'type': 'ir.actions.act_window',
            'res_model': 'accounting.question',
            'view_mode': 'tree,form',
            'domain': [('document_id', '=', self.id)],
            'context': {
                'default_document_id': self.id,
            }
        }
