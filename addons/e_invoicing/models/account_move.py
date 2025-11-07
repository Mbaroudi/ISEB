# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)


class AccountMove(models.Model):
    _inherit = 'account.move'

    # Facturation électronique
    einvoice_enabled = fields.Boolean(string='Facture électronique', compute='_compute_einvoice_enabled', store=True)
    einvoice_format_id = fields.Many2one('einvoice.format', string='Format')

    einvoice_state = fields.Selection([
        ('none', 'Non applicable'),
        ('to_send', 'À envoyer'),
        ('sent', 'Envoyée'),
        ('accepted', 'Acceptée'),
        ('rejected', 'Rejetée'),
        ('error', 'Erreur')
    ], string='État e-facture', default='none', tracking=True)

    einvoice_sent_date = fields.Datetime(string='Date d\'envoi', readonly=True)
    einvoice_xml = fields.Binary(string='XML Factur-X', readonly=True)
    einvoice_xml_filename = fields.Char(string='Nom fichier XML')

    einvoice_reference = fields.Char(string='Référence externe', readonly=True, help='Référence Chorus Pro / Peppol')
    einvoice_error_message = fields.Text(string='Message d\'erreur', readonly=True)

    log_ids = fields.One2many('einvoice.log', 'move_id', string='Logs e-facture')

    @api.depends('partner_id', 'partner_id.einvoice_mandatory', 'move_type')
    def _compute_einvoice_enabled(self):
        for move in self:
            move.einvoice_enabled = (
                move.move_type in ['out_invoice', 'out_refund'] and
                move.partner_id.einvoice_mandatory
            )

    def action_send_einvoice(self):
        """Envoyer la facture électronique"""
        self.ensure_one()

        if not self.einvoice_enabled:
            raise UserError(_("Cette facture n'est pas éligible à la facturation électronique."))

        if self.state != 'posted':
            raise UserError(_("La facture doit être comptabilisée avant l'envoi électronique."))

        # Déterminer le format
        format_id = self.einvoice_format_id or self.partner_id.einvoice_format_id

        if not format_id:
            raise UserError(_("Aucun format de facture électronique configuré pour ce partenaire."))

        # Générer la facture électronique
        try:
            if format_id.code == 'facturx':
                result = self._generate_facturx()
            elif format_id.code == 'chorus_pro':
                result = self._send_chorus_pro()
            elif format_id.code == 'peppol':
                result = self._send_peppol()
            else:
                raise UserError(_("Format %s non supporté") % format_id.name)

            # Log succès
            self.env['einvoice.log'].create({
                'move_id': self.id,
                'action': 'send',
                'state': 'success',
                'message': _('Facture envoyée avec succès'),
                'format_id': format_id.id
            })

            self.write({
                'einvoice_state': 'sent',
                'einvoice_sent_date': fields.Datetime.now(),
                'einvoice_reference': result.get('reference')
            })

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Facture électronique envoyée'),
                    'message': _('La facture %s a été envoyée avec succès') % self.name,
                    'type': 'success'
                }
            }

        except Exception as e:
            _logger.error(f"Erreur envoi e-facture {self.name}: {str(e)}", exc_info=True)

            # Log erreur
            self.env['einvoice.log'].create({
                'move_id': self.id,
                'action': 'send',
                'state': 'error',
                'message': str(e),
                'format_id': format_id.id
            })

            self.write({
                'einvoice_state': 'error',
                'einvoice_error_message': str(e)
            })

            raise UserError(_("Erreur lors de l'envoi: %s") % str(e))

    def _generate_facturx(self):
        """Générer une facture Factur-X (PDF/A-3 + XML EN16931)"""
        from lxml import etree

        # Générer le XML EN16931
        xml_root = etree.Element('rsm:CrossIndustryInvoice')
        # ... Construction du XML selon norme EN16931 ...

        xml_content = etree.tostring(xml_root, encoding='UTF-8', xml_declaration=True)

        # Stocker le XML
        self.write({
            'einvoice_xml': xml_content,
            'einvoice_xml_filename': f'{self.name}_facturx.xml'
        })

        # Générer PDF/A-3 avec XML embarqué
        # (nécessite reportlab + pdfa)

        return {'reference': self.name, 'format': 'facturx'}

    def _send_chorus_pro(self):
        """Envoyer via Chorus Pro"""
        # Appeler l'API Chorus Pro
        # https://chorus-pro.gouv.fr/

        chorus_service = self.env['ir.config_parameter'].sudo().get_param('einvoicing.chorus_api_url')

        # Générer XML et envoyer via SOAP/REST

        return {'reference': 'CHO-XXX', 'format': 'chorus_pro'}

    def _send_peppol(self):
        """Envoyer via réseau Peppol"""
        # Utiliser un Access Point Peppol

        return {'reference': 'PEPPOL-XXX', 'format': 'peppol'}

    def action_view_einvoice_logs(self):
        """Voir les logs de facturation électronique"""
        return {
            'name': _('Logs e-facture'),
            'type': 'ir.actions.act_window',
            'res_model': 'einvoice.log',
            'view_mode': 'tree,form',
            'domain': [('move_id', '=', self.id)]
        }

    def action_download_einvoice_xml(self):
        """Télécharger le XML Factur-X"""
        if not self.einvoice_xml:
            raise UserError(_("Aucun XML disponible pour cette facture."))

        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content?model={self._name}&id={self.id}&field=einvoice_xml&filename={self.einvoice_xml_filename}',
            'target': 'self'
        }
