# -*- coding: utf-8 -*-

import re
import base64
import logging
from datetime import datetime
from odoo import models, fields, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

try:
    import pytesseract
    from PIL import Image
    import io
except ImportError:
    _logger.warning("pytesseract or PIL not installed. OCR features will not be available.")
    pytesseract = None
    Image = None


class DocumentOCRResult(models.Model):
    """Résultats d'extraction OCR pour un document"""
    _name = 'client.document.ocr'
    _description = 'Résultats OCR Document'
    _order = 'create_date desc'

    document_id = fields.Many2one(
        'client.document',
        string='Document',
        required=True,
        ondelete='cascade'
    )

    # Texte brut OCR
    raw_text = fields.Text(
        string='Texte brut OCR',
        readonly=True
    )

    # Données extraites
    invoice_number = fields.Char(string='Numéro de facture')
    invoice_date = fields.Date(string='Date de facture')
    due_date = fields.Date(string='Date d\'échéance')

    supplier_name = fields.Char(string='Nom fournisseur')
    supplier_vat = fields.Char(string='TVA fournisseur')
    supplier_address = fields.Text(string='Adresse fournisseur')

    amount_untaxed = fields.Float(string='Montant HT', digits=(16, 2))
    amount_tax = fields.Float(string='Montant TVA', digits=(16, 2))
    amount_total = fields.Float(string='Montant TTC', digits=(16, 2))
    currency = fields.Char(string='Devise', default='EUR')

    # Lignes de TVA
    tax_lines = fields.Text(
        string='Lignes TVA',
        help='JSON des lignes de TVA extraites'
    )

    # Méta
    confidence_score = fields.Float(
        string='Score de confiance',
        help='Score de confiance global de l\'extraction (0-100)'
    )
    extraction_method = fields.Selection([
        ('tesseract', 'Tesseract OCR'),
        ('manual', 'Saisie manuelle'),
        ('api', 'API externe'),
    ], string='Méthode d\'extraction', default='tesseract')

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('extracted', 'Extrait'),
        ('validated', 'Validé'),
        ('error', 'Erreur'),
    ], string='État', default='draft')

    error_message = fields.Text(string='Message d\'erreur')

    # Champs techniques
    processing_time = fields.Float(string='Temps de traitement (s)')
    create_date = fields.Datetime(string='Date création', readonly=True)

    def action_apply_to_document(self):
        """Applique les données extraites au document"""
        self.ensure_one()

        if self.state != 'extracted':
            raise UserError(_("Seuls les résultats extraits peuvent être appliqués."))

        vals = {}

        if self.invoice_date:
            vals['document_date'] = self.invoice_date

        if self.amount_total:
            vals['amount_total'] = self.amount_total

        if self.supplier_name:
            # Rechercher ou créer le fournisseur
            supplier = self.env['res.partner'].search([
                ('name', 'ilike', self.supplier_name),
                ('supplier_rank', '>', 0)
            ], limit=1)

            if not supplier and self.supplier_vat:
                supplier = self.env['res.partner'].search([
                    ('vat', '=', self.supplier_vat)
                ], limit=1)

            if supplier:
                vals['supplier_id'] = supplier.id

        if vals:
            self.document_id.write(vals)
            self.state = 'validated'

        return True

    def action_mark_as_error(self):
        """Marque le résultat comme erroné"""
        self.write({'state': 'error'})


class ClientDocumentOCR(models.Model):
    """Extension du modèle document avec OCR"""
    _inherit = 'client.document'

    ocr_result_ids = fields.One2many(
        'client.document.ocr',
        'document_id',
        string='Résultats OCR'
    )

    ocr_result_id = fields.Many2one(
        'client.document.ocr',
        string='Dernier résultat OCR',
        compute='_compute_ocr_result_id',
        store=False
    )

    has_ocr_data = fields.Boolean(
        string='Données OCR disponibles',
        compute='_compute_has_ocr_data',
        store=False
    )

    ocr_state = fields.Selection(
        related='ocr_result_id.state',
        string='État OCR',
        store=False
    )

    @api.depends('ocr_result_ids')
    def _compute_ocr_result_id(self):
        """Récupère le dernier résultat OCR"""
        for doc in self:
            doc.ocr_result_id = doc.ocr_result_ids[:1] if doc.ocr_result_ids else False

    @api.depends('ocr_result_ids')
    def _compute_has_ocr_data(self):
        """Vérifie si des données OCR sont disponibles"""
        for doc in self:
            doc.has_ocr_data = bool(doc.ocr_result_ids.filtered(
                lambda r: r.state == 'extracted'
            ))

    def action_extract_data_ocr(self):
        """Lance l'extraction OCR sur le document"""
        self.ensure_one()

        if not pytesseract or not Image:
            raise UserError(_(
                "Les bibliothèques OCR ne sont pas installées.\n"
                "Installez pytesseract et Pillow pour utiliser cette fonctionnalité."
            ))

        if not self.file:
            raise UserError(_("Aucun fichier à traiter."))

        # Vérifier le type de fichier
        if not self.filename or not (
            self.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png'))
        ):
            raise UserError(_(
                "Seuls les fichiers PDF et images (JPG, PNG) peuvent être traités."
            ))

        import time
        start_time = time.time()

        try:
            # Décoder le fichier
            file_data = base64.b64decode(self.file)

            # Traiter selon le type
            if self.filename.lower().endswith('.pdf'):
                # Pour PDF, utiliser pdf2image
                try:
                    from pdf2image import convert_from_bytes
                    images = convert_from_bytes(file_data)
                    # Prendre la première page
                    image = images[0]
                except ImportError:
                    raise UserError(_(
                        "La bibliothèque pdf2image n'est pas installée.\n"
                        "Installez pdf2image pour traiter les PDF."
                    ))
            else:
                # Image directe
                image = Image.open(io.BytesIO(file_data))

            # Extraction OCR
            text = pytesseract.image_to_string(image, lang='fra')

            if not text or len(text.strip()) < 10:
                raise UserError(_("Aucun texte détecté dans le document."))

            # Extraction des données structurées
            extracted_data = self._extract_invoice_data(text)

            processing_time = time.time() - start_time

            # Créer le résultat OCR
            ocr_result = self.env['client.document.ocr'].create({
                'document_id': self.id,
                'raw_text': text,
                'invoice_number': extracted_data.get('invoice_number'),
                'invoice_date': extracted_data.get('invoice_date'),
                'due_date': extracted_data.get('due_date'),
                'supplier_name': extracted_data.get('supplier_name'),
                'supplier_vat': extracted_data.get('supplier_vat'),
                'amount_untaxed': extracted_data.get('amount_untaxed', 0.0),
                'amount_tax': extracted_data.get('amount_tax', 0.0),
                'amount_total': extracted_data.get('amount_total', 0.0),
                'currency': extracted_data.get('currency', 'EUR'),
                'confidence_score': extracted_data.get('confidence_score', 50.0),
                'extraction_method': 'tesseract',
                'state': 'extracted',
                'processing_time': processing_time,
            })

            _logger.info(f"OCR extraction successful for document {self.id} in {processing_time:.2f}s")

            return {
                'type': 'ir.actions.act_window',
                'res_model': 'client.document.ocr',
                'res_id': ocr_result.id,
                'view_mode': 'form',
                'target': 'new',
                'name': _('Résultat OCR'),
            }

        except Exception as e:
            _logger.error(f"OCR extraction failed for document {self.id}: {str(e)}")

            # Créer un résultat d'erreur
            self.env['client.document.ocr'].create({
                'document_id': self.id,
                'state': 'error',
                'error_message': str(e),
                'extraction_method': 'tesseract',
            })

            raise UserError(_("Erreur lors de l'extraction OCR: %s") % str(e))

    def _extract_invoice_data(self, text):
        """
        Extrait les données structurées d'une facture depuis le texte OCR

        :param text: Texte brut OCR
        :return: Dictionnaire de données extraites
        """
        data = {}
        confidence = 0
        total_checks = 0

        # Nettoyer le texte
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = re.sub(r'\s+', ' ', text)

        # 1. Numéro de facture
        # Patterns: "Facture N° 123", "Invoice #123", "N° FAC-2024-001"
        invoice_patterns = [
            r'[Ff]acture\s*[Nn]°?\s*:?\s*([A-Z0-9\-/]+)',
            r'[Ii]nvoice\s*#?\s*:?\s*([A-Z0-9\-/]+)',
            r'[Nn]°\s*:?\s*([A-Z0-9\-/]+)',
            r'[Ff][Aa][Cc][\-\s]*([0-9]{4,})',
        ]
        for pattern in invoice_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['invoice_number'] = match.group(1).strip()
                confidence += 20
                break
        total_checks += 1

        # 2. Dates (format FR: DD/MM/YYYY ou YYYY-MM-DD)
        date_patterns = [
            r'[Dd]ate\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'[Dd]u\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'[Ll]e\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                try:
                    # Essayer de parser la date
                    if '/' in date_str:
                        parts = date_str.split('/')
                    else:
                        parts = date_str.split('-')

                    if len(parts) == 3:
                        # DD/MM/YYYY
                        if len(parts[0]) <= 2:
                            day, month, year = parts
                        else:
                            # YYYY-MM-DD
                            year, month, day = parts

                        if len(year) == 2:
                            year = '20' + year

                        date_obj = datetime(int(year), int(month), int(day))
                        data['invoice_date'] = date_obj.date()
                        confidence += 15
                        break
                except:
                    pass
        total_checks += 1

        # 3. Montant total (TTC)
        # Patterns: "Total TTC: 1 234,56 €", "Montant à payer : 1234.56"
        amount_patterns = [
            r'[Tt]otal\s*[Tt][Tt][Cc]\s*:?\s*([0-9\s,.]+)\s*€?',
            r'[Mm]ontant\s*à\s*payer\s*:?\s*([0-9\s,.]+)\s*€?',
            r'[Tt]otal\s*:?\s*([0-9\s,.]+)\s*€?',
            r'[Nn]et\s*à\s*payer\s*:?\s*([0-9\s,.]+)\s*€?',
        ]
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1)
                # Nettoyer et convertir
                amount_str = amount_str.replace(' ', '').replace(',', '.')
                try:
                    data['amount_total'] = float(amount_str)
                    confidence += 25
                    break
                except:
                    pass
        total_checks += 1

        # 4. Montant HT
        ht_patterns = [
            r'[Tt]otal\s*[Hh][Tt]\s*:?\s*([0-9\s,.]+)\s*€?',
            r'[Mm]ontant\s*[Hh][Tt]\s*:?\s*([0-9\s,.]+)\s*€?',
        ]
        for pattern in ht_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1)
                amount_str = amount_str.replace(' ', '').replace(',', '.')
                try:
                    data['amount_untaxed'] = float(amount_str)
                    confidence += 15
                    break
                except:
                    pass
        total_checks += 1

        # 5. TVA
        tva_patterns = [
            r'[Tt][Vv][Aa]\s*:?\s*([0-9\s,.]+)\s*€?',
            r'[Mm]ontant\s*[Tt][Vv][Aa]\s*:?\s*([0-9\s,.]+)\s*€?',
        ]
        for pattern in tva_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1)
                amount_str = amount_str.replace(' ', '').replace(',', '.')
                try:
                    data['amount_tax'] = float(amount_str)
                    confidence += 10
                    break
                except:
                    pass
        total_checks += 1

        # 6. Nom du fournisseur (généralement en haut du document)
        # Prendre les 200 premiers caractères pour chercher le nom
        header = text[:200]
        # Chercher une ligne qui ressemble à un nom d'entreprise (majuscules, SARL, SAS, etc.)
        supplier_patterns = [
            r'([A-ZÉÈÊËÀÂÄÔÖÛÜÏÎ][A-ZÉÈÊËÀÂÄÔÖÛÜÏÎa-zéèêëàâäôöûüïî\s\-]{2,30}(?:SARL|SAS|SA|EURL|SNC))',
            r'([A-ZÉÈÊËÀÂÄÔÖÛÜÏÎ]{3,}(?:\s+[A-ZÉÈÊËÀÂÄÔÖÛÜÏÎ]{3,}){0,2})',
        ]
        for pattern in supplier_patterns:
            match = re.search(pattern, header)
            if match:
                data['supplier_name'] = match.group(1).strip()
                confidence += 10
                break
        total_checks += 1

        # 7. Numéro de TVA
        vat_patterns = [
            r'[Tt][Vv][Aa]\s*[Ii]ntra\w*\s*:?\s*([A-Z]{2}\s*[0-9A-Z\s]{9,})',
            r'[Nn]°\s*[Tt][Vv][Aa]\s*:?\s*([A-Z]{2}\s*[0-9A-Z\s]{9,})',
        ]
        for pattern in vat_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['supplier_vat'] = match.group(1).strip().replace(' ', '')
                confidence += 5
                break
        total_checks += 1

        # Calculer le score de confiance global
        data['confidence_score'] = min(100, confidence)

        # Si on a le HT et la TVA mais pas le total, calculer
        if 'amount_untaxed' in data and 'amount_tax' in data and 'amount_total' not in data:
            data['amount_total'] = data['amount_untaxed'] + data['amount_tax']

        # Si on a le total et le HT mais pas la TVA, calculer
        if 'amount_total' in data and 'amount_untaxed' in data and 'amount_tax' not in data:
            data['amount_tax'] = data['amount_total'] - data['amount_untaxed']

        return data

    def action_view_ocr_results(self):
        """Affiche les résultats OCR"""
        self.ensure_one()

        return {
            'type': 'ir.actions.act_window',
            'res_model': 'client.document.ocr',
            'domain': [('document_id', '=', self.id)],
            'view_mode': 'tree,form',
            'name': _('Résultats OCR'),
            'context': {'default_document_id': self.id},
        }
