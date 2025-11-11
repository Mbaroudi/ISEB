# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Add missing fields to client.document model"""
    
    # Add active field
    cr.execute("""
        ALTER TABLE client_document ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE
    """)
    
    cr.execute("""
        UPDATE client_document SET active = TRUE WHERE active IS NULL
    """)
    
    # Add archived_date field
    cr.execute("""
        ALTER TABLE client_document ADD COLUMN IF NOT EXISTS archived_date DATE
    """)
    
    _logger.info('Client portal migration completed')
