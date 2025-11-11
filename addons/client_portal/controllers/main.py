# -*- coding: utf-8 -*-

import base64
from odoo import http, _
from odoo.http import request
from odoo.exceptions import AccessError, MissingError
from odoo.addons.portal.controllers.portal import CustomerPortal, pager as portal_pager


class ClientPortalController(http.Controller):
    """Controller principal pour le portail client ISEB"""

    @http.route(['/my/dashboard'], type='http', auth='user', website=True)
    def portal_my_dashboard(self, **kw):
        """Page du dashboard client"""
        partner = request.env.user.partner_id
        
        # Vérifier que c'est un client ISEB
        if not partner.is_iseb_client:
            return request.render('client_portal.not_client_error')
        
        # Récupérer le dernier dashboard
        dashboard = partner.latest_dashboard_id
        
        if not dashboard:
            # Créer un dashboard si aucun n'existe
            dashboard = request.env['client.dashboard'].sudo().create({
                'partner_id': partner.id,
                'period_start': request.env.context.get('period_start'),
                'period_end': request.env.context.get('period_end'),
            })
        
        values = {
            'partner': partner,
            'dashboard': dashboard,
            'page_name': 'dashboard',
        }
        
        return request.render('client_portal.portal_my_dashboard', values)

    @http.route(['/my/documents', '/my/documents/page/<int:page>'], 
                type='http', auth='user', website=True)
    def portal_my_documents(self, page=1, sortby=None, filterby=None, search=None, **kw):
        """Liste des documents client"""
        partner = request.env.user.partner_id
        
        if not partner.is_iseb_client:
            return request.render('client_portal.not_client_error')
        
        Document = request.env['client.document']
        
        # Domaine de recherche
        domain = [('partner_id', '=', partner.id)]
        
        # Filtres
        searchbar_filters = {
            'all': {'label': _('Tous'), 'domain': []},
            'draft': {'label': _('Brouillons'), 'domain': [('state', '=', 'draft')]},
            'pending': {'label': _('En attente'), 'domain': [('state', 'in', ['pending', 'submitted'])]},
            'validated': {'label': _('Validés'), 'domain': [('state', '=', 'validated')]},
        }
        
        # Tri
        searchbar_sortings = {
            'date': {'label': _('Date'), 'order': 'document_date desc'},
            'name': {'label': _('Nom'), 'order': 'name'},
            'state': {'label': _('État'), 'order': 'state'},
        }
        
        # Valeurs par défaut
        if not sortby:
            sortby = 'date'
        if not filterby:
            filterby = 'all'
        
        # Appliquer les filtres
        domain += searchbar_filters[filterby]['domain']
        order = searchbar_sortings[sortby]['order']
        
        # Recherche
        if search:
            domain += [('name', 'ilike', search)]
        
        # Nombre total de documents
        document_count = Document.search_count(domain)
        
        # Pagination
        pager = portal_pager(
            url='/my/documents',
            total=document_count,
            page=page,
            step=10,
            url_args={'sortby': sortby, 'filterby': filterby, 'search': search},
        )
        
        # Récupérer les documents
        documents = Document.search(domain, order=order, limit=10, offset=pager['offset'])
        
        values = {
            'partner': partner,
            'documents': documents,
            'page_name': 'documents',
            'pager': pager,
            'searchbar_sortings': searchbar_sortings,
            'searchbar_filters': searchbar_filters,
            'sortby': sortby,
            'filterby': filterby,
            'search': search or '',
            'default_url': '/my/documents',
        }
        
        return request.render('client_portal.portal_my_documents', values)

    @http.route(['/my/document/<int:document_id>'], type='http', auth='user', website=True)
    def portal_my_document(self, document_id, access_token=None, **kw):
        """Détail d'un document"""
        try:
            document = request.env['client.document'].browse(document_id)
            
            # Vérifier les droits d'accès
            if document.partner_id != request.env.user.partner_id:
                raise AccessError(_("Vous n'avez pas accès à ce document"))
            
            values = {
                'document': document,
                'page_name': 'document',
            }
            
            return request.render('client_portal.portal_my_document', values)
            
        except (AccessError, MissingError):
            return request.redirect('/my')

    @http.route(['/my/expenses', '/my/expenses/page/<int:page>'], 
                type='http', auth='user', website=True)
    def portal_my_expenses(self, page=1, sortby=None, filterby=None, search=None, **kw):
        """Liste des notes de frais"""
        partner = request.env.user.partner_id
        
        if not partner.is_iseb_client:
            return request.render('client_portal.not_client_error')
        
        Expense = request.env['expense.note']
        
        # Domaine de recherche
        domain = [('partner_id', '=', partner.id)]
        
        # Filtres
        searchbar_filters = {
            'all': {'label': _('Toutes'), 'domain': []},
            'draft': {'label': _('Brouillons'), 'domain': [('state', '=', 'draft')]},
            'submitted': {'label': _('Soumises'), 'domain': [('state', '=', 'submitted')]},
            'approved': {'label': _('Approuvées'), 'domain': [('state', '=', 'approved')]},
            'paid': {'label': _('Payées'), 'domain': [('state', '=', 'paid')]},
        }
        
        # Tri
        searchbar_sortings = {
            'date': {'label': _('Date'), 'order': 'expense_date desc'},
            'name': {'label': _('Nom'), 'order': 'name'},
            'amount': {'label': _('Montant'), 'order': 'total_amount desc'},
            'state': {'label': _('État'), 'order': 'state'},
        }
        
        # Valeurs par défaut
        if not sortby:
            sortby = 'date'
        if not filterby:
            filterby = 'all'
        
        # Appliquer les filtres
        domain += searchbar_filters[filterby]['domain']
        order = searchbar_sortings[sortby]['order']
        
        # Recherche
        if search:
            domain += [('name', 'ilike', search)]
        
        # Nombre total
        expense_count = Expense.search_count(domain)
        
        # Pagination
        pager = portal_pager(
            url='/my/expenses',
            total=expense_count,
            page=page,
            step=10,
            url_args={'sortby': sortby, 'filterby': filterby, 'search': search},
        )
        
        # Récupérer les notes de frais
        expenses = Expense.search(domain, order=order, limit=10, offset=pager['offset'])
        
        values = {
            'partner': partner,
            'expenses': expenses,
            'page_name': 'expenses',
            'pager': pager,
            'searchbar_sortings': searchbar_sortings,
            'searchbar_filters': searchbar_filters,
            'sortby': sortby,
            'filterby': filterby,
            'search': search or '',
            'default_url': '/my/expenses',
        }
        
        return request.render('client_portal.portal_my_expenses', values)

    @http.route(['/my/expense/<int:expense_id>'], type='http', auth='user', website=True)
    def portal_my_expense(self, expense_id, access_token=None, **kw):
        """Détail d'une note de frais"""
        try:
            expense = request.env['expense.note'].browse(expense_id)
            
            # Vérifier les droits d'accès
            if expense.partner_id != request.env.user.partner_id:
                raise AccessError(_("Vous n'avez pas accès à cette note de frais"))
            
            values = {
                'expense': expense,
                'page_name': 'expense',
            }
            
            return request.render('client_portal.portal_my_expense', values)
            
        except (AccessError, MissingError):
            return request.redirect('/my')

    @http.route(['/my/document/<int:document_id>/download'], 
                type='http', auth='user')
    def portal_document_download(self, document_id, **kw):
        """Téléchargement d'un document"""
        try:
            document = request.env['client.document'].browse(document_id)
            
            # Vérifier les droits d'accès
            if document.partner_id != request.env.user.partner_id:
                raise AccessError(_("Vous n'avez pas accès à ce document"))
            
            if not document.file_data:
                return request.redirect('/my/documents')
            
            # Préparer le téléchargement
            filecontent = base64.b64decode(document.file_data)
            
            headers = [
                ('Content-Type', document.mime_type or 'application/octet-stream'),
                ('Content-Length', len(filecontent)),
                ('Content-Disposition', f'attachment; filename="{document.file_name}"'),
            ]
            
            return request.make_response(filecontent, headers)
            
        except (AccessError, MissingError):
            return request.redirect('/my/documents')
