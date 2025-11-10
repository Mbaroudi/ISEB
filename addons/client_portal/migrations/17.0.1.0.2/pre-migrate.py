# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Add fiscal risk score fields to res.partner"""
    
    # Add fiscal_risk_score field
    cr.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='res_partner' AND column_name='fiscal_risk_score'
            ) THEN
                ALTER TABLE res_partner ADD COLUMN fiscal_risk_score INTEGER DEFAULT 100;
                _logger.info('Added fiscal_risk_score column to res_partner');
            END IF;
        END $$;
    """)
    
    # Add fiscal_risk_level field
    cr.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='res_partner' AND column_name='fiscal_risk_level'
            ) THEN
                ALTER TABLE res_partner ADD COLUMN fiscal_risk_level VARCHAR;
                UPDATE res_partner SET fiscal_risk_level = 'low';
                _logger.info('Added fiscal_risk_level column to res_partner');
            END IF;
        END $$;
    """)
    
    # Add last_risk_check_date field
    cr.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='res_partner' AND column_name='last_risk_check_date'
            ) THEN
                ALTER TABLE res_partner ADD COLUMN last_risk_check_date DATE;
                _logger.info('Added last_risk_check_date column to res_partner');
            END IF;
        END $$;
    """)
    
    _logger.info('Fiscal risk score migration completed')
