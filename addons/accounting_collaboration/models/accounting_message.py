# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class AccountingMessage(models.Model):
    """
    Messages dans les fils de discussion des questions comptables
    """
    _name = 'accounting.message'
    _description = 'Message de discussion comptable'
    _order = 'create_date asc'

    question_id = fields.Many2one(
        'accounting.question',
        string="Question",
        required=True,
        ondelete='cascade',
        index=True
    )

    user_id = fields.Many2one(
        'res.users',
        string="Auteur",
        required=True,
        default=lambda self: self.env.user,
        ondelete='restrict'
    )

    content = fields.Html(
        string="Message",
        required=True,
        help="Contenu du message"
    )

    attachment_ids = fields.Many2many(
        'ir.attachment',
        'accounting_message_attachment_rel',
        'message_id',
        'attachment_id',
        string="Pièces jointes"
    )

    create_date = fields.Datetime(
        string="Date",
        readonly=True,
        index=True
    )

    is_internal = fields.Boolean(
        string="Message interne",
        default=False,
        help="Message visible seulement par les comptables (pas les clients)"
    )

    is_solution = fields.Boolean(
        string="Solution",
        default=False,
        help="Ce message contient la solution à la question"
    )

    # Infos sur l'auteur (dénormalisé pour performance)
    author_name = fields.Char(
        string="Nom de l'auteur",
        compute='_compute_author_name',
        store=True
    )
    author_avatar = fields.Binary(
        string="Avatar",
        related='user_id.image_128',
        readonly=True
    )

    company_id = fields.Many2one(
        'res.company',
        related='question_id.company_id',
        store=True,
        readonly=True
    )

    @api.depends('user_id.name')
    def _compute_author_name(self):
        """Calcule le nom de l'auteur"""
        for message in self:
            message.author_name = message.user_id.name

    @api.model
    def create(self, vals):
        """Création avec notification"""
        message = super().create(vals)

        # Marque la question comme "answered" si c'est une réponse
        if message.question_id.state == 'pending' and message.user_id != message.question_id.user_id:
            message.question_id.state = 'answered'

        # Notification
        message._send_message_notification()

        return message

    def write(self, vals):
        """Mise à jour"""
        # Si on marque comme solution, résoudre la question
        if vals.get('is_solution'):
            self.question_id.action_resolve()

        return super().write(vals)

    def _send_message_notification(self):
        """Envoie une notification pour le nouveau message"""
        self.ensure_one()

        # Notifier tous les participants sauf l'auteur
        participants = self.question_id.message_ids.mapped('user_id')
        participants |= self.question_id.user_id
        participants |= self.question_id.assigned_to_id

        # Exclut l'auteur du message
        participants -= self.user_id

        for user in participants:
            self.env['mail.mail'].sudo().create({
                'subject': f"Nouveau message sur: {self.question_id.name}",
                'body_html': f"""
                    <p><strong>{self.user_id.name}</strong> a posté un message:</p>
                    {self.content}
                    <p><a href="/web#id={self.question_id.id}&model=accounting.question">
                        Voir la question
                    </a></p>
                """,
                'email_to': user.email,
                'auto_delete': True,
            })

    def action_mark_as_solution(self):
        """Marquer ce message comme solution"""
        self.ensure_one()

        # Dé-marque les autres solutions
        self.question_id.message_ids.filtered('is_solution').write({'is_solution': False})

        # Marque ce message comme solution
        self.write({'is_solution': True})

        # Résout la question
        self.question_id.action_resolve()
