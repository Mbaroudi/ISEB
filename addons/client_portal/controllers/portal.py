# -*- coding: utf-8 -*-

import base64
from collections import OrderedDict
from odoo import http, _
from odoo.http import request
from odoo.addons.portal.controllers.portal import CustomerPortal


class ClientCustomerPortal(CustomerPortal):
    """Extension du portail pour ajouter les compteurs ISEB"""

    def _prepare_home_portal_values(self, counters):
        """Ajoute les compteurs de documents et notes de frais au portail"""
        values = super()._prepare_home_portal_values(counters)
        
        partner = request.env.user.partner_id
        
        if partner.is_iseb_client:
            Document = request.env['client.document']
            Expense = request.env['expense.note']
            
            if 'document_count' in counters:
                values['document_count'] = Document.search_count([
                    ('partner_id', '=', partner.id)
                ])
            
            if 'expense_count' in counters:
                values['expense_count'] = Expense.search_count([
                    ('partner_id', '=', partner.id)
                ])
            
            if 'dashboard_count' in counters:
                Dashboard = request.env['client.dashboard']
                values['dashboard_count'] = Dashboard.search_count([
                    ('partner_id', '=', partner.id)
                ])
        
        return values

    def _prepare_portal_layout_values(self):
        """Prépare les valeurs pour le layout du portail"""
        values = super()._prepare_portal_layout_values()
        
        partner = request.env.user.partner_id
        
        if partner.is_iseb_client:
            values.update({
                'is_iseb_client': True,
                'latest_dashboard': partner.latest_dashboard_id,
            })
        
        return values

    @http.route(['/my/home'], type='http', auth='user', website=True)
    def home(self, **kw):
        """Page d'accueil du portail avec redirection vers dashboard si client ISEB"""
        partner = request.env.user.partner_id
        
        if partner.is_iseb_client:
            # Rediriger vers le dashboard pour les clients ISEB
            return request.redirect('/my/dashboard')
        
        return super().home(**kw)
