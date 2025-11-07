# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class ClientDocument(models.Model):
    _inherit = 'client.document'

    def action_validate(self):
        """Envoyer email de notification lors de la validation"""
        res = super().action_validate()
        
        for document in self:
            if document.partner_id.email:
                self._send_validation_email(document)
        
        return res

    def action_reject(self):
        """Envoyer email de notification lors du rejet"""
        res = super().action_reject()
        
        for document in self:
            if document.partner_id.email:
                self._send_rejection_email(document)
        
        return res

    def _send_validation_email(self, document):
        """Envoyer email de validation"""
        template = self.env.ref('client_portal.email_document_validated', raise_if_not_found=False)
        if template:
            template.send_mail(document.id, force_send=True)

    def _send_rejection_email(self, document):
        """Envoyer email de rejet"""
        template = self.env.ref('client_portal.email_document_rejected', raise_if_not_found=False)
        if template:
            template.send_mail(document.id, force_send=True)


class ExpenseNote(models.Model):
    _inherit = 'expense.note'

    def action_approve(self):
        """Envoyer email de notification lors de l'approbation"""
        res = super().action_approve()
        
        for expense in self:
            if expense.partner_id.email:
                self._send_approval_email(expense)
        
        return res

    def action_reject(self):
        """Envoyer email de notification lors du rejet"""
        res = super().action_reject()
        
        for expense in self:
            if expense.partner_id.email:
                self._send_rejection_email(expense)
        
        return res

    def action_pay(self):
        """Envoyer email de notification lors du paiement"""
        res = super().action_pay()
        
        for expense in self:
            if expense.partner_id.email:
                self._send_payment_email(expense)
        
        return res

    def _send_approval_email(self, expense):
        """Envoyer email d'approbation"""
        template = self.env.ref('client_portal.email_expense_approved', raise_if_not_found=False)
        if template:
            template.send_mail(expense.id, force_send=True)

    def _send_rejection_email(self, expense):
        """Envoyer email de rejet"""
        template = self.env.ref('client_portal.email_expense_rejected', raise_if_not_found=False)
        if template:
            template.send_mail(expense.id, force_send=True)

    def _send_payment_email(self, expense):
        """Envoyer email de paiement"""
        template = self.env.ref('client_portal.email_expense_paid', raise_if_not_found=False)
        if template:
            template.send_mail(expense.id, force_send=True)


class ClientDashboard(models.Model):
    _inherit = 'client.dashboard'

    def action_validate(self):
        """Envoyer email mensuel du dashboard"""
        res = super().action_validate()
        
        for dashboard in self:
            if dashboard.partner_id.email:
                self._send_monthly_dashboard_email(dashboard)
        
        return res

    def _send_monthly_dashboard_email(self, dashboard):
        """Envoyer email mensuel avec résumé"""
        template = self.env.ref('client_portal.email_dashboard_monthly', raise_if_not_found=False)
        if template:
            template.send_mail(dashboard.id, force_send=True)
