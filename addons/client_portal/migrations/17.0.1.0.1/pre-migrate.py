# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Add missing fields to client.document model"""
    
    # Add active field
    cr.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='client_document' AND column_name='active'
            ) THEN
                ALTER TABLE client_document ADD COLUMN active BOOLEAN DEFAULT TRUE;
                UPDATE client_document SET active = TRUE WHERE active IS NULL;
                _logger.info('Added active column to client_document');
            END IF;
        END $$;
    """)
    
    # Add archived_date field
    cr.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='client_document' AND column_name='archived_date'
            ) THEN
                ALTER TABLE client_document ADD COLUMN archived_date DATE;
                _logger.info('Added archived_date column to client_document');
            END IF;
        END $$;
    """)
    
    _logger.info('Client portal migration completed')
