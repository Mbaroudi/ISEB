# -*- coding: utf-8 -*-

import logging
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class DocumentWorkflowTransition(models.Model):
    """Transitions de workflow pour documents"""
    _name = 'client.document.workflow.transition'
    _description = 'Transitions de workflow document'

    name = fields.Char(string='Nom', required=True)
    document_type = fields.Selection([
        ('invoice', 'Facture fournisseur'),
        ('contract', 'Contrat'),
        ('justificatif', 'Justificatif'),
        ('other', 'Autre'),
        ('all', 'Tous types'),
    ], string='Type de document', default='all', required=True)

    state_from = fields.Selection([
        ('draft', 'Brouillon'),
        ('pending', 'En attente validation'),
        ('validated', 'Validé'),
        ('rejected', 'Rejeté'),
    ], string='État de départ', required=True)

    state_to = fields.Selection([
        ('draft', 'Brouillon'),
        ('pending', 'En attente validation'),
        ('validated', 'Validé'),
        ('rejected', 'Rejeté'),
    ], string='État d\'arrivée', required=True)

    # Conditions
    require_ocr = fields.Boolean(
        string='Requiert OCR',
        default=False,
        help="L'extraction OCR doit être effectuée avant cette transition"
    )
    require_amount = fields.Boolean(
        string='Requiert montant',
        default=False,
        help="Le document doit avoir un montant renseigné"
    )
    require_supplier = fields.Boolean(
        string='Requiert fournisseur',
        default=False,
        help="Le document doit avoir un fournisseur renseigné"
    )
    require_category = fields.Boolean(
        string='Requiert catégorie',
        default=False,
        help="Le document doit avoir une catégorie"
    )

    # Actions
    send_email_notification = fields.Boolean(
        string='Envoyer notification email',
        default=True
    )
    email_template_id = fields.Many2one(
        'mail.template',
        string='Template email',
        domain=[('model', '=', 'client.document')]
    )

    create_invoice = fields.Boolean(
        string='Créer facture',
        default=False,
        help="Crée automatiquement une facture fournisseur dans Odoo"
    )

    archive_document = fields.Boolean(
        string='Archiver document',
        default=False
    )

    # Meta
    active = fields.Boolean(default=True)
    sequence = fields.Integer(default=10)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )

    notes = fields.Text(string='Notes')

    @api.constrains('state_from', 'state_to')
    def _check_states(self):
        """Vérifie que les états sont différents"""
        for transition in self:
            if transition.state_from == transition.state_to:
                raise ValidationError(_(
                    "L'état de départ et l'état d'arrivée doivent être différents."
                ))

    def execute_transition(self, document):
        """
        Exécute la transition sur un document

        :param document: Recordset client.document
        """
        self.ensure_one()

        # Vérifier les conditions
        if self.require_ocr and not document.has_ocr_data:
            raise UserError(_(
                "Cette transition requiert une extraction OCR préalable."
            ))

        if self.require_amount and not document.amount_total:
            raise UserError(_(
                "Cette transition requiert un montant renseigné."
            ))

        if self.require_supplier and not document.supplier_id:
            raise UserError(_(
                "Cette transition requiert un fournisseur renseigné."
            ))

        if self.require_category and not document.category_id:
            raise UserError(_(
                "Cette transition requiert une catégorie."
            ))

        # Appliquer la transition
        document.write({'state': self.state_to})

        # Exécuter les actions
        if self.send_email_notification:
            self._send_notification(document)

        if self.create_invoice:
            self._create_invoice_from_document(document)

        if self.archive_document:
            document.action_archive()

        # Logger
        _logger.info(
            f"Transition '{self.name}' executed for document {document.id}: "
            f"{self.state_from} -> {self.state_to}"
        )

        # Message dans le chatter
        document.message_post(
            body=_(
                "Transition de workflow: <b>%s</b><br/>"
                "État: %s → %s"
            ) % (
                self.name,
                dict(document._fields['state'].selection)[self.state_from],
                dict(document._fields['state'].selection)[self.state_to]
            ),
            message_type='notification',
            subtype_xmlid='mail.mt_note',
        )

        return True

    def _send_notification(self, document):
        """Envoie une notification email"""
        if self.email_template_id:
            self.email_template_id.send_mail(document.id, force_send=True)
        else:
            # Notification par défaut
            subject = _("Document %s - %s") % (document.reference, self.name)
            body = _(
                "Le document <b>%s</b> a changé d'état.<br/><br/>"
                "Nouveau état: <b>%s</b><br/>"
                "Transition: %s<br/>"
            ) % (
                document.name,
                dict(document._fields['state'].selection)[self.state_to],
                self.name
            )

            # Envoyer au propriétaire du document
            if document.partner_id.email:
                document.message_post(
                    body=body,
                    subject=subject,
                    partner_ids=[document.partner_id.id],
                    message_type='email',
                )

    def _create_invoice_from_document(self, document):
        """Crée une facture fournisseur depuis le document"""
        if not document.supplier_id:
            _logger.warning(
                f"Cannot create invoice for document {document.id}: no supplier"
            )
            return False

        invoice_vals = {
            'partner_id': document.supplier_id.id,
            'move_type': 'in_invoice',
            'invoice_date': document.document_date or fields.Date.today(),
            'ref': document.invoice_number or document.reference,
        }

        # Si on a des montants OCR, créer une ligne
        if document.amount_total:
            invoice_vals['invoice_line_ids'] = [(0, 0, {
                'name': document.name,
                'quantity': 1,
                'price_unit': document.amount_untaxed or document.amount_total,
            })]

        try:
            invoice = self.env['account.move'].create(invoice_vals)
            document.write({'invoice_id': invoice.id})

            _logger.info(f"Created invoice {invoice.id} from document {document.id}")

            document.message_post(
                body=_("Facture fournisseur créée automatiquement: %s") % invoice.name,
                message_type='notification',
            )

            return invoice
        except Exception as e:
            _logger.error(f"Error creating invoice from document {document.id}: {str(e)}")
            return False


class ClientDocumentWorkflow(models.Model):
    """Extension du modèle document avec workflow"""
    _inherit = 'client.document'

    workflow_transition_count = fields.Integer(
        string='Nombre de transitions disponibles',
        compute='_compute_workflow_transition_count'
    )

    def _compute_workflow_transition_count(self):
        """Compte les transitions disponibles"""
        for doc in self:
            transitions = self.env['client.document.workflow.transition'].search([
                ('state_from', '=', doc.state),
                '|',
                ('document_type', '=', doc.document_type),
                ('document_type', '=', 'all'),
                ('active', '=', True),
            ])
            doc.workflow_transition_count = len(transitions)

    def get_available_transitions(self):
        """Retourne les transitions disponibles pour ce document"""
        self.ensure_one()

        transitions = self.env['client.document.workflow.transition'].search([
            ('state_from', '=', self.state),
            '|',
            ('document_type', '=', self.document_type),
            ('document_type', '=', 'all'),
            ('active', '=', True),
        ], order='sequence, name')

        return transitions

    def action_execute_transition(self, transition_id):
        """Exécute une transition"""
        self.ensure_one()

        transition = self.env['client.document.workflow.transition'].browse(transition_id)

        if not transition.exists():
            raise UserError(_("Transition introuvable."))

        if transition.state_from != self.state:
            raise UserError(_(
                "Cette transition n'est pas disponible pour l'état actuel du document."
            ))

        if transition.document_type not in ['all', self.document_type]:
            raise UserError(_(
                "Cette transition n'est pas disponible pour ce type de document."
            ))

        return transition.execute_transition(self)

    def action_submit_for_validation(self):
        """Soumet le document pour validation"""
        self.ensure_one()

        if self.state != 'draft':
            raise UserError(_("Seuls les documents en brouillon peuvent être soumis."))

        # Chercher une transition draft -> pending
        transition = self.env['client.document.workflow.transition'].search([
            ('state_from', '=', 'draft'),
            ('state_to', '=', 'pending'),
            '|',
            ('document_type', '=', self.document_type),
            ('document_type', '=', 'all'),
            ('active', '=', True),
        ], limit=1)

        if transition:
            return transition.execute_transition(self)
        else:
            # Fallback: changement d'état simple
            self.write({'state': 'pending'})
            return True

    def action_validate_document(self):
        """Valide le document"""
        self.ensure_one()

        if self.state not in ['draft', 'pending']:
            raise UserError(_(
                "Seuls les documents en brouillon ou en attente peuvent être validés."
            ))

        # Chercher une transition vers validated
        transition = self.env['client.document.workflow.transition'].search([
            ('state_from', '=', self.state),
            ('state_to', '=', 'validated'),
            '|',
            ('document_type', '=', self.document_type),
            ('document_type', '=', 'all'),
            ('active', '=', True),
        ], limit=1)

        if transition:
            return transition.execute_transition(self)
        else:
            # Fallback: changement d'état simple
            self.write({'state': 'validated'})
            return True

    def action_reject_document(self):
        """Rejette le document"""
        self.ensure_one()

        if self.state != 'pending':
            raise UserError(_(
                "Seuls les documents en attente peuvent être rejetés."
            ))

        # Chercher une transition vers rejected
        transition = self.env['client.document.workflow.transition'].search([
            ('state_from', '=', 'pending'),
            ('state_to', '=', 'rejected'),
            '|',
            ('document_type', '=', self.document_type),
            ('document_type', '=', 'all'),
            ('active', '=', True),
        ], limit=1)

        if transition:
            return transition.execute_transition(self)
        else:
            # Fallback: changement d'état simple
            self.write({'state': 'rejected'})
            return True

    def action_reset_to_draft(self):
        """Remet le document en brouillon"""
        self.ensure_one()

        if self.state == 'validated':
            raise UserError(_(
                "Les documents validés ne peuvent pas être remis en brouillon."
            ))

        self.write({'state': 'draft'})
        return True
