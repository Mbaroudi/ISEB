# -*- coding: utf-8 -*-

import base64
import re
import json
import logging
import io
from datetime import datetime
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class OCRController(http.Controller):
    """Contrôleur pour l'OCR des reçus et factures avec support multi-backend"""

    @http.route(['/my/expense/ocr'], type='json', auth='user', methods=['POST'], website=True, csrf=True)
    def process_expense_ocr(self, image=None, backend=None, **kw):
        """
        Traiter une image de reçu avec OCR pour extraire les données

        Args:
            image: Image en base64 ou URL data
            backend: Backend OCR à utiliser ('deepseek', 'tesseract', 'auto')

        Returns:
            dict: Données extraites (montant, date, vendeur, etc.)
        """
        if not image:
            return {'success': False, 'error': 'No image provided'}

        try:
            # Extraire les données de l'image
            image_data = self._prepare_image_data(image)

            # Appeler le service OCR avec backend spécifié
            ocr_service = OCRService()
            ocr_result = ocr_service.perform_ocr(image_data, backend=backend)

            # Parser les résultats
            extracted_data = self._parse_ocr_result(ocr_result)

            return {
                'success': True,
                'amount': extracted_data.get('amount', 0.0),
                'tva_amount': extracted_data.get('tva_amount', 0.0),
                'date': extracted_data.get('date', ''),
                'vendor': extracted_data.get('vendor', ''),
                'category': extracted_data.get('category', 'other'),
                'confidence': extracted_data.get('confidence', 0.0),
                'backend': ocr_result.get('backend', 'unknown'),
                'raw_text': ocr_result.get('text', '')
            }

        except Exception as e:
            _logger.error(f"OCR Error: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

    @http.route(['/my/document/ocr'], type='json', auth='user', methods=['POST'], website=True, csrf=True)
    def process_document_ocr(self, image=None, document_type=None, backend=None, **kw):
        """
        Traiter un document avec OCR (facture, RIB, etc.)

        Args:
            image: Image en base64
            document_type: Type de document (invoice, rib, etc.)
            backend: Backend OCR à utiliser

        Returns:
            dict: Données extraites selon le type de document
        """
        if not image:
            return {'success': False, 'error': 'No image provided'}

        try:
            image_data = self._prepare_image_data(image)

            ocr_service = OCRService()
            ocr_result = ocr_service.perform_ocr(image_data, backend=backend)

            # Parser selon le type de document
            if document_type == 'invoice':
                extracted = self._parse_invoice(ocr_result.get('text', ''))
            elif document_type == 'rib':
                extracted = self._parse_rib(ocr_result.get('text', ''))
            else:
                extracted = {'text': ocr_result.get('text', '')}

            extracted['confidence'] = ocr_result.get('confidence', 0.0)
            extracted['backend'] = ocr_result.get('backend', 'unknown')
            extracted['success'] = True

            return extracted

        except Exception as e:
            _logger.error(f"Document OCR Error: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route(['/my/ocr/config'], type='json', auth='user', methods=['GET'], website=True)
    def get_ocr_config(self, **kw):
        """Retourner la configuration OCR disponible"""
        ocr_service = OCRService()
        return {
            'available_backends': ocr_service.get_available_backends(),
            'default_backend': ocr_service.get_default_backend(),
            'deepseek_available': ocr_service.is_deepseek_available(),
            'tesseract_available': ocr_service.is_tesseract_available()
        }

    def _prepare_image_data(self, image):
        """
        Préparer les données image pour OCR

        Args:
            image: Image en base64 ou data URL

        Returns:
            bytes: Données binaires de l'image
        """
        # Si c'est une data URL, extraire la partie base64
        if isinstance(image, str) and image.startswith('data:'):
            # Format: data:image/png;base64,iVBORw0KGgoAAAANS...
            image = image.split(',', 1)[1]

        # Décoder base64
        if isinstance(image, str):
            image_data = base64.b64decode(image)
        else:
            image_data = image

        return image_data

    def _parse_ocr_result(self, ocr_result):
        """
        Parser le texte OCR pour extraire les données structurées

        Args:
            ocr_result: Résultat brut de l'OCR

        Returns:
            dict: Données structurées extraites
        """
        text = ocr_result.get('text', '')

        extracted = {
            'amount': 0.0,
            'tva_amount': 0.0,
            'date': '',
            'vendor': '',
            'category': 'other',
            'confidence': ocr_result.get('confidence', 0.0)
        }

        if not text:
            return extracted

        # Normaliser le texte
        text = text.upper()

        # Extraire le montant total
        extracted['amount'] = self._extract_amount(text)

        # Extraire la TVA
        extracted['tva_amount'] = self._extract_tva(text)

        # Extraire la date
        extracted['date'] = self._extract_date(text)

        # Extraire le vendeur (première ligne non vide généralement)
        extracted['vendor'] = self._extract_vendor(text)

        # Deviner la catégorie
        extracted['category'] = self._guess_category(text)

        return extracted

    def _extract_amount(self, text):
        """Extraire le montant total du reçu"""
        patterns = [
            r'TOTAL[:\s]+([0-9]+[,\.\s][0-9]{2})',
            r'NET A PAYER[:\s]+([0-9]+[,\.\s][0-9]{2})',
            r'MONTANT[:\s]+([0-9]+[,\.\s][0-9]{2})',
            r'A PAYER[:\s]+([0-9]+[,\.\s][0-9]{2})',
            r'€\s*([0-9]+[,\.\s][0-9]{2})',
            r'([0-9]+[,\.][0-9]{2})\s*€'
        ]

        amounts = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                amount_str = match.replace(',', '.').replace(' ', '')
                try:
                    amount = float(amount_str)
                    amounts.append(amount)
                except ValueError:
                    continue

        return max(amounts) if amounts else 0.0

    def _extract_tva(self, text):
        """Extraire le montant de TVA"""
        patterns = [
            r'TVA[:\s]+([0-9]+[,\.\s][0-9]{2})',
            r'T\.V\.A[:\s]+([0-9]+[,\.\s][0-9]{2})',
            r'VAT[:\s]+([0-9]+[,\.\s][0-9]{2})'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    tva_str = matches[0].replace(',', '.').replace(' ', '')
                    return float(tva_str)
                except ValueError:
                    continue

        return 0.0

    def _extract_date(self, text):
        """Extraire la date du reçu"""
        date_patterns = [
            r'(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})',
            r'(\d{2})[/\-\.](\d{2})[/\-\.](\d{2})',
        ]

        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            if matches:
                day, month, year = matches[0]

                if len(year) == 2:
                    year = '20' + year if int(year) < 50 else '19' + year

                try:
                    date_obj = datetime.strptime(f"{day}/{month}/{year}", "%d/%m/%Y")
                    return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    continue

        return ''

    def _extract_vendor(self, text):
        """Extraire le nom du vendeur"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        if lines:
            vendor = lines[0]
            return vendor[:50] if len(vendor) > 50 else vendor

        return ''

    def _guess_category(self, text):
        """Deviner la catégorie de dépense"""
        categories = {
            'meal': ['RESTAURANT', 'CAFE', 'BRASSERIE', 'PIZZERIA', 'SANDWICHERIE', 'FAST FOOD'],
            'fuel': ['STATION', 'ESSENCE', 'CARBURANT', 'DIESEL', 'TOTAL', 'SHELL', 'BP'],
            'transport': ['TAXI', 'UBER', 'SNCF', 'TRAIN', 'BUS', 'METRO', 'PEAGE'],
            'accommodation': ['HOTEL', 'AUBERGE', 'RESIDENCE', 'AIRBNB', 'BOOKING'],
            'parking': ['PARKING', 'STATIONNEMENT', 'PARCMETRE', 'GARAGE']
        }

        scores = {}
        for category, keywords in categories.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[category] = score

        if scores:
            return max(scores, key=scores.get)

        return 'other'

    def _parse_invoice(self, text):
        """Parser une facture"""
        text = text.upper()

        return {
            'invoice_number': self._extract_invoice_number(text),
            'amount': self._extract_amount(text),
            'tva_amount': self._extract_tva(text),
            'date': self._extract_date(text),
            'vendor': self._extract_vendor(text)
        }

    def _parse_rib(self, text):
        """Parser un RIB"""
        text = text.upper()

        iban_pattern = r'FR[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{3}'
        iban_matches = re.findall(iban_pattern, text.replace(' ', ''))

        bic_pattern = r'[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?'
        bic_matches = re.findall(bic_pattern, text)

        return {
            'iban': iban_matches[0] if iban_matches else '',
            'bic': bic_matches[0] if bic_matches else '',
            'bank_name': self._extract_vendor(text)
        }

    def _extract_invoice_number(self, text):
        """Extraire le numéro de facture"""
        patterns = [
            r'FACTURE[:\s]+N?[°\s]*([A-Z0-9\-]+)',
            r'INVOICE[:\s]+N?[°\s]*([A-Z0-9\-]+)',
            r'N°[:\s]*([A-Z0-9\-]+)'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0].strip()

        return ''


class OCRService:
    """Service OCR avec support multi-backend (DeepSeek-OCR + Tesseract)"""

    def __init__(self):
        self._deepseek_model = None
        self._deepseek_tokenizer = None
        self._deepseek_available = None
        self._tesseract_available = None

    def get_available_backends(self):
        """Retourner la liste des backends disponibles"""
        backends = []

        if self.is_deepseek_available():
            backends.append('deepseek')

        if self.is_tesseract_available():
            backends.append('tesseract')

        return backends

    def get_default_backend(self):
        """Retourner le backend par défaut"""
        # Privilégier DeepSeek si disponible, sinon Tesseract
        if self.is_deepseek_available():
            return 'deepseek'
        elif self.is_tesseract_available():
            return 'tesseract'
        else:
            return None

    def is_deepseek_available(self):
        """Vérifier si DeepSeek-OCR est disponible"""
        if self._deepseek_available is not None:
            return self._deepseek_available

        try:
            import torch
            from transformers import AutoModel, AutoTokenizer

            # Vérifier la disponibilité du GPU
            if not torch.cuda.is_available():
                _logger.info("DeepSeek-OCR: GPU not available, DeepSeek-OCR disabled")
                self._deepseek_available = False
                return False

            self._deepseek_available = True
            _logger.info("DeepSeek-OCR: Available and GPU detected")
            return True

        except ImportError as e:
            _logger.info(f"DeepSeek-OCR: Not available - {str(e)}")
            self._deepseek_available = False
            return False

    def is_tesseract_available(self):
        """Vérifier si Tesseract est disponible"""
        if self._tesseract_available is not None:
            return self._tesseract_available

        try:
            import pytesseract
            from PIL import Image

            # Tester si tesseract est installé
            pytesseract.get_tesseract_version()

            self._tesseract_available = True
            _logger.info("Tesseract OCR: Available")
            return True

        except Exception as e:
            _logger.info(f"Tesseract OCR: Not available - {str(e)}")
            self._tesseract_available = False
            return False

    def perform_ocr(self, image_data, backend='auto'):
        """
        Effectuer l'OCR sur l'image avec le backend spécifié

        Args:
            image_data: Données binaires de l'image
            backend: 'deepseek', 'tesseract', ou 'auto'

        Returns:
            dict: Résultat OCR avec texte extrait
        """
        # Auto-sélection du backend
        if backend == 'auto' or backend is None:
            backend = self.get_default_backend()

        if backend == 'deepseek' and self.is_deepseek_available():
            return self._perform_deepseek_ocr(image_data)
        elif backend == 'tesseract' and self.is_tesseract_available():
            return self._perform_tesseract_ocr(image_data)
        else:
            # Fallback: essayer dans l'ordre
            if self.is_deepseek_available():
                return self._perform_deepseek_ocr(image_data)
            elif self.is_tesseract_available():
                return self._perform_tesseract_ocr(image_data)
            else:
                raise Exception("No OCR backend available")

    def _load_deepseek_model(self):
        """Charger le modèle DeepSeek-OCR (lazy loading)"""
        if self._deepseek_model is not None:
            return self._deepseek_model, self._deepseek_tokenizer

        try:
            from transformers import AutoModel, AutoTokenizer
            import torch

            _logger.info("Loading DeepSeek-OCR model...")

            # Charger le tokenizer
            self._deepseek_tokenizer = AutoTokenizer.from_pretrained(
                'deepseek-ai/DeepSeek-OCR',
                trust_remote_code=True
            )

            # Charger le modèle
            self._deepseek_model = AutoModel.from_pretrained(
                'deepseek-ai/DeepSeek-OCR',
                torch_dtype=torch.float16,
                device_map='auto',
                trust_remote_code=True,
                _attn_implementation='flash_attention_2'  # Optimisation
            )

            self._deepseek_model.eval()

            _logger.info("DeepSeek-OCR model loaded successfully")
            return self._deepseek_model, self._deepseek_tokenizer

        except Exception as e:
            _logger.error(f"Failed to load DeepSeek-OCR model: {str(e)}")
            raise

    def _perform_deepseek_ocr(self, image_data):
        """
        Effectuer l'OCR avec DeepSeek-OCR

        Args:
            image_data: Données binaires de l'image

        Returns:
            dict: Résultat OCR
        """
        try:
            from PIL import Image
            import torch

            # Charger le modèle
            model, tokenizer = self._load_deepseek_model()

            # Convertir bytes en image PIL
            image = Image.open(io.BytesIO(image_data))

            # Sauvegarder temporairement l'image
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                image.save(tmp.name)
                tmp_path = tmp.name

            try:
                # Effectuer l'OCR avec DeepSeek
                # Utiliser "Free OCR" pour extraction simple de texte
                with torch.no_grad():
                    result = model.infer(
                        tokenizer,
                        prompt="<image>\nFree OCR.",
                        image_file=tmp_path
                    )

                text = result.strip()

                # DeepSeek-OCR est très précis, on peut attribuer une haute confidence
                confidence = 0.95

                return {
                    'text': text,
                    'confidence': confidence,
                    'backend': 'deepseek',
                    'model': 'deepseek-ai/DeepSeek-OCR'
                }

            finally:
                # Nettoyer le fichier temporaire
                import os
                try:
                    os.unlink(tmp_path)
                except:
                    pass

        except Exception as e:
            _logger.error(f"DeepSeek-OCR failed: {str(e)}")
            # Fallback sur Tesseract si disponible
            if self.is_tesseract_available():
                _logger.info("Falling back to Tesseract")
                return self._perform_tesseract_ocr(image_data)
            else:
                raise

    def _perform_tesseract_ocr(self, image_data):
        """
        Effectuer l'OCR avec Tesseract

        Args:
            image_data: Données binaires de l'image

        Returns:
            dict: Résultat OCR
        """
        try:
            import pytesseract
            from PIL import Image

            # Convertir bytes en image PIL
            image = Image.open(io.BytesIO(image_data))

            # Effectuer OCR avec Tesseract (français)
            text = pytesseract.image_to_string(image, lang='fra')

            # Obtenir les données détaillées avec confidence
            data = pytesseract.image_to_data(image, lang='fra', output_type=pytesseract.Output.DICT)

            # Calculer la confiance moyenne
            confidences = [int(conf) for conf in data['conf'] if conf != '-1']
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            return {
                'text': text,
                'confidence': avg_confidence / 100.0,
                'backend': 'tesseract',
                'model': 'tesseract-fra'
            }

        except Exception as e:
            _logger.error(f"Tesseract OCR failed: {str(e)}")
            raise
