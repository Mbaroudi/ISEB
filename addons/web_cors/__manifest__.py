{
    'name': 'Web CORS',
    'version': '17.0.1.0.0',
    'category': 'Hidden',
    'summary': 'Enable CORS for external frontend access',
    'description': """
Enable CORS Headers
===================
Enables Cross-Origin Resource Sharing (CORS) for XML-RPC and JSON-RPC endpoints.
Required for Next.js frontend to communicate with Odoo backend.
    """,
    'author': 'ISEB',
    'depends': ['web'],
    'data': [],
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
}
