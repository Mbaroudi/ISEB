# -*- coding: utf-8 -*-

import base64
import re
import json
import logging
from datetime import datetime
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class OCRController(http.Controller):
    """Contrôleur pour l'OCR des reçus et factures"""

    @http.route(['/my/expense/ocr'], type='json', auth='user', methods=['POST'], website=True, csrf=True)
    def process_expense_ocr(self, image=None, **kw):
        """
        Traiter une image de reçu avec OCR pour extraire les données

        Args:
            image: Image en base64 ou URL data

        Returns:
            dict: Données extraites (montant, date, vendeur, etc.)
        """
        if not image:
            return {'success': False, 'error': 'No image provided'}

        try:
            # Extraire les données de l'image
            image_data = self._prepare_image_data(image)

            # Appeler le service OCR
            ocr_result = self._perform_ocr(image_data)

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
                'raw_text': ocr_result.get('text', '')
            }

        except Exception as e:
            _logger.error(f"OCR Error: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
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

    def _perform_ocr(self, image_data):
        """
        Effectuer l'OCR sur l'image

        Args:
            image_data: Données binaires de l'image

        Returns:
            dict: Résultat OCR avec texte extrait
        """
        try:
            # Option 1: Utiliser Tesseract si disponible
            import pytesseract
            from PIL import Image
            import io

            # Convertir bytes en image PIL
            image = Image.open(io.BytesIO(image_data))

            # Effectuer OCR avec Tesseract
            # Utiliser le français comme langue
            text = pytesseract.image_to_string(image, lang='fra')

            # Obtenir les données détaillées avec confidence
            data = pytesseract.image_to_data(image, lang='fra', output_type=pytesseract.Output.DICT)

            # Calculer la confiance moyenne
            confidences = [int(conf) for conf in data['conf'] if conf != '-1']
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            return {
                'text': text,
                'confidence': avg_confidence / 100.0,  # Normaliser à 0-1
                'method': 'tesseract'
            }

        except ImportError:
            _logger.warning("Tesseract not available, falling back to basic extraction")
            # Option 2: Fallback - utiliser un service externe ou extraction basique
            return self._fallback_ocr(image_data)

        except Exception as e:
            _logger.error(f"Tesseract OCR failed: {str(e)}")
            return self._fallback_ocr(image_data)

    def _fallback_ocr(self, image_data):
        """
        OCR de secours si Tesseract n'est pas disponible

        Args:
            image_data: Données binaires de l'image

        Returns:
            dict: Résultat OCR minimal
        """
        # Pour le moment, retourner un résultat vide
        # Dans une vraie implémentation, on pourrait:
        # - Utiliser une API externe (Google Vision, Azure OCR, etc.)
        # - Utiliser EasyOCR
        # - Utiliser un modèle ML local

        _logger.warning("Using fallback OCR - no text extraction available")
        return {
            'text': '',
            'confidence': 0.0,
            'method': 'fallback'
        }

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
        """
        Extraire le montant total du reçu

        Args:
            text: Texte OCR

        Returns:
            float: Montant extrait
        """
        # Chercher des patterns comme "TOTAL", "NET A PAYER", "MONTANT"
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
                # Normaliser le format (remplacer virgule par point, enlever espaces)
                amount_str = match.replace(',', '.').replace(' ', '')
                try:
                    amount = float(amount_str)
                    amounts.append(amount)
                except ValueError:
                    continue

        # Retourner le montant le plus élevé (généralement le total)
        return max(amounts) if amounts else 0.0

    def _extract_tva(self, text):
        """
        Extraire le montant de TVA

        Args:
            text: Texte OCR

        Returns:
            float: Montant TVA extrait
        """
        # Chercher des patterns TVA
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
        """
        Extraire la date du reçu

        Args:
            text: Texte OCR

        Returns:
            str: Date au format YYYY-MM-DD
        """
        # Patterns de date français
        date_patterns = [
            r'(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})',  # JJ/MM/AAAA
            r'(\d{2})[/\-\.](\d{2})[/\-\.](\d{2})',   # JJ/MM/AA
        ]

        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            if matches:
                day, month, year = matches[0]

                # Convertir année à 2 chiffres en 4 chiffres
                if len(year) == 2:
                    year = '20' + year if int(year) < 50 else '19' + year

                try:
                    # Valider et formater la date
                    date_obj = datetime.strptime(f"{day}/{month}/{year}", "%d/%m/%Y")
                    return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    continue

        return ''

    def _extract_vendor(self, text):
        """
        Extraire le nom du vendeur

        Args:
            text: Texte OCR

        Returns:
            str: Nom du vendeur
        """
        # Prendre la première ligne non vide (généralement le nom du commerce)
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        if lines:
            # Nettoyer et retourner la première ligne
            vendor = lines[0]
            # Limiter à 50 caractères
            return vendor[:50] if len(vendor) > 50 else vendor

        return ''

    def _guess_category(self, text):
        """
        Deviner la catégorie de dépense basée sur le texte

        Args:
            text: Texte OCR

        Returns:
            str: Catégorie devinée
        """
        # Dictionnaire de mots-clés par catégorie
        categories = {
            'meal': ['RESTAURANT', 'CAFE', 'BRASSERIE', 'PIZZERIA', 'SANDWICHERIE', 'FAST FOOD'],
            'fuel': ['STATION', 'ESSENCE', 'CARBURANT', 'DIESEL', 'TOTAL', 'SHELL', 'BP'],
            'transport': ['TAXI', 'UBER', 'SNCF', 'TRAIN', 'BUS', 'METRO', 'PEAGE'],
            'accommodation': ['HOTEL', 'AUBERGE', 'RESIDENCE', 'AIRBNB', 'BOOKING'],
            'parking': ['PARKING', 'STATIONNEMENT', 'PARCMETRE', 'GARAGE']
        }

        # Compter les correspondances pour chaque catégorie
        scores = {}
        for category, keywords in categories.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[category] = score

        # Retourner la catégorie avec le meilleur score
        if scores:
            return max(scores, key=scores.get)

        return 'other'

    @http.route(['/my/document/ocr'], type='json', auth='user', methods=['POST'], website=True, csrf=True)
    def process_document_ocr(self, image=None, document_type=None, **kw):
        """
        Traiter un document avec OCR (facture, RIB, etc.)

        Args:
            image: Image en base64
            document_type: Type de document (invoice, rib, etc.)

        Returns:
            dict: Données extraites selon le type de document
        """
        if not image:
            return {'success': False, 'error': 'No image provided'}

        try:
            image_data = self._prepare_image_data(image)
            ocr_result = self._perform_ocr(image_data)

            # Parser selon le type de document
            if document_type == 'invoice':
                extracted = self._parse_invoice(ocr_result.get('text', ''))
            elif document_type == 'rib':
                extracted = self._parse_rib(ocr_result.get('text', ''))
            else:
                extracted = {'text': ocr_result.get('text', '')}

            extracted['confidence'] = ocr_result.get('confidence', 0.0)
            extracted['success'] = True

            return extracted

        except Exception as e:
            _logger.error(f"Document OCR Error: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

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

        # Extraire IBAN (format FR76 XXXX XXXX XXXX XXXX XXXX XXX)
        iban_pattern = r'FR[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{3}'
        iban_matches = re.findall(iban_pattern, text.replace(' ', ''))

        # Extraire BIC
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
