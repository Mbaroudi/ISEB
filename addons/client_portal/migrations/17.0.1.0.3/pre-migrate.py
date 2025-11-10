# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Add S3 storage backend field to ir.attachment"""
    
    # Add storage_backend field
    cr.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='ir_attachment' AND column_name='storage_backend'
            ) THEN
                ALTER TABLE ir_attachment ADD COLUMN storage_backend VARCHAR DEFAULT 'db';
                UPDATE ir_attachment SET storage_backend = 'db' WHERE storage_backend IS NULL;
                _logger.info('Added storage_backend column to ir_attachment');
            END IF;
        END $$;
    """)
    
    _logger.info('S3 storage migration completed')
