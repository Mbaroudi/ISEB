# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Add S3 storage backend field to ir.attachment"""
    
    # Add storage_backend field
    cr.execute("""
        ALTER TABLE ir_attachment ADD COLUMN IF NOT EXISTS storage_backend VARCHAR DEFAULT 'db'
    """)
    
    cr.execute("""
        UPDATE ir_attachment SET storage_backend = 'db' WHERE storage_backend IS NULL
    """)
    
    _logger.info('S3 storage migration completed')
