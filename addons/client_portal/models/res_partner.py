# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_iseb_client = fields.Boolean(string='Client ISEB', default=False)
    dashboard_ids = fields.One2many('client.dashboard', 'partner_id', string='Dashboards')
    dashboard_count = fields.Integer(string='Nombre de dashboards', compute='_compute_dashboard_count')
    latest_dashboard_id = fields.Many2one('client.dashboard', string='Dernier dashboard', compute='_compute_latest_dashboard')

    @api.depends('dashboard_ids')
    def _compute_dashboard_count(self):
        for partner in self:
            partner.dashboard_count = len(partner.dashboard_ids)

    @api.depends('dashboard_ids')
    def _compute_latest_dashboard(self):
        for partner in self:
            if partner.dashboard_ids:
                partner.latest_dashboard_id = partner.dashboard_ids.sorted('compute_date', reverse=True)[0]
            else:
                partner.latest_dashboard_id = False

    def action_view_dashboard(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Dashboard Client',
            'res_model': 'client.dashboard',
            'view_mode': 'form',
            'res_id': self.latest_dashboard_id.id if self.latest_dashboard_id else False,
            'target': 'current',
        }
