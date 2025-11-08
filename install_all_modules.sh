#!/bin/bash

# ISEB Module Installation Script
# This script installs all ISEB modules in the correct order

set -e

echo "=========================================="
echo "ISEB Module Installation"
echo "=========================================="
echo ""

# Database details
DB_NAME="iseb_db"
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
    -i french_accounting,client_portal,cabinet_portal,bank_sync,e_invoicing,reporting \
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
echo "  - client_portal (Client Portal)"
echo "  - cabinet_portal (Cabinet Portal)"
echo "  - bank_sync (Bank Synchronization)"
echo "  - e_invoicing (E-Invoicing)"
echo "  - reporting (Custom Reporting)"
echo ""
