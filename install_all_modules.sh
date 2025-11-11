#!/bin/bash

# ISEB Module Installation Script
# This script installs all ISEB modules in the correct order

set -e

echo "=========================================="
echo "ISEB Module Installation"
echo "=========================================="
echo ""

# Database details
DB_NAME="iseb_prod"
ADMIN_PASSWORD="admin"

echo "Installing ISEB modules..."
echo ""

# Stop the current Odoo instance
echo "1. Stopping Odoo..."
docker-compose stop odoo

# Install modules in the correct order
echo "2. Installing modules..."
docker-compose run --rm odoo odoo \
    -d $DB_NAME \
    -i french_accounting,website,web_cors,client_portal,cabinet_portal,invoice_ocr_config,accounting_collaboration,account_import_export,bank_sync,e_invoicing,reporting,integrations \
    --stop-after-init \
    --without-demo=all

echo ""
echo "3. Starting Odoo..."
docker-compose up -d odoo

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Access your ISEB platform at:"
echo "  URL: http://localhost:8069"
echo "  Database: $DB_NAME"
echo "  Login: admin"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "Installed modules:"
echo "  - french_accounting (French Accounting)"
echo "  - website (Website - required for client_portal frontend)"
echo "  - web_cors (CORS Configuration for Next.js frontend)"
echo "  - client_portal (Client Portal with OCR, Documents, Fiscal)"
echo "  - cabinet_portal (Cabinet Portal)"
echo "  - invoice_ocr_config (OCR Configuration - Google Vision, AWS Textract, Azure)"
echo "  - accounting_collaboration (Questions & Messaging)"
echo "  - account_import_export (FEC/XIMPORT Import & Export)"
echo "  - bank_sync (Bank Synchronization)"
echo "  - e_invoicing (E-Invoicing - Chorus Pro, Factur-X)"
echo "  - reporting (Custom Reporting)"
echo "  - integrations (Third-party Integrations)"
echo ""
