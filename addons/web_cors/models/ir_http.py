from odoo import models
from odoo.http import request


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _cors_preflight_response(cls):
        """Handle CORS preflight requests"""
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
            'Access-Control-Max-Age': '86400',
        }
        return request.make_response('', headers=headers)

    @classmethod
    def _post_dispatch(cls, response):
        """Add CORS headers to all responses"""
        response = super()._post_dispatch(response)
        
        # Only add headers if response is not None
        if response and hasattr(response, 'headers'):
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
