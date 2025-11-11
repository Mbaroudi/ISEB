# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Add fiscal risk score fields to res.partner"""
    
    # Add fiscal_risk_score field
    cr.execute("""
        ALTER TABLE res_partner ADD COLUMN IF NOT EXISTS fiscal_risk_score INTEGER DEFAULT 100
    """)
    
    # Add fiscal_risk_level field  
    cr.execute("""
        ALTER TABLE res_partner ADD COLUMN IF NOT EXISTS fiscal_risk_level VARCHAR
    """)
    
    cr.execute("""
        UPDATE res_partner SET fiscal_risk_level = 'low' WHERE fiscal_risk_level IS NULL
    """)
    
    # Add last_risk_check_date field
    cr.execute("""
        ALTER TABLE res_partner ADD COLUMN IF NOT EXISTS last_risk_check_date DATE
    """)
    
    _logger.info('Fiscal risk score migration completed')
