#!/bin/bash

#############################################
# Script d'installation OCR Factures ISEB
# Version: 1.0
# Date: Novembre 2024
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     Installation OCR Factures ISEB                       ║"
echo "║     Configuration automatique en 5 minutes               ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running from ISEB directory
if [ ! -f "addons/invoice_ocr_config/__manifest__.py" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis le répertoire ISEB${NC}"
    echo "   Utilisez: cd /path/to/ISEB && ./scripts/setup_ocr.sh"
    exit 1
fi

echo -e "${GREEN}✓ Répertoire ISEB détecté${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Étape 1/5: Vérification des prérequis${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
    echo -e "${GREEN}✓ Python installé: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python 3 non trouvé${NC}"
    exit 1
fi

# Check if Odoo is accessible
if [ -z "$ODOO_RC" ]; then
    echo -e "${YELLOW}⚠ Variable ODOO_RC non définie${NC}"
    echo "   Définir manuellement le chemin Odoo plus tard"
else
    echo -e "${GREEN}✓ Configuration Odoo trouvée: $ODOO_RC${NC}"
fi

echo ""

# Step 2: API Key configuration
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Étape 2/5: Configuration API OCR${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "Choisissez votre fournisseur OCR:"
echo "  1) Google Vision API (Recommandé - Gratuit jusqu'à 1000/mois)"
echo "  2) AWS Textract"
echo "  3) Azure Computer Vision"
echo "  4) Configurer plus tard"
echo ""

read -p "Votre choix (1-4): " ocr_choice

case $ocr_choice in
    1)
        OCR_PROVIDER="google_vision"
        echo ""
        echo -e "${YELLOW}Configuration Google Vision API${NC}"
        echo ""
        echo "Pour obtenir une clé API:"
        echo "  1. Aller sur: https://console.cloud.google.com"
        echo "  2. Créer un projet"
        echo "  3. Activer 'Cloud Vision API'"
        echo "  4. Créer une clé API"
        echo ""
        read -p "Entrez votre clé API Google Vision (ou ENTER pour ignorer): " api_key

        if [ -n "$api_key" ]; then
            OCR_API_KEY="$api_key"
            echo -e "${GREEN}✓ Clé API enregistrée${NC}"
        else
            echo -e "${YELLOW}⚠ Clé API non configurée (à faire manuellement)${NC}"
            OCR_API_KEY=""
        fi
        ;;
    2)
        OCR_PROVIDER="aws_textract"
        echo ""
        echo -e "${YELLOW}Configuration AWS Textract${NC}"
        echo ""
        read -p "Access Key ID: " aws_access_key
        read -p "Secret Access Key: " aws_secret_key
        read -p "Région (ex: eu-west-1): " aws_region

        OCR_API_KEY="$aws_access_key"
        AWS_SECRET_KEY="$aws_secret_key"
        AWS_REGION="${aws_region:-eu-west-1}"
        echo -e "${GREEN}✓ Configuration AWS enregistrée${NC}"
        ;;
    3)
        OCR_PROVIDER="azure_vision"
        echo ""
        echo -e "${YELLOW}Configuration Azure Computer Vision${NC}"
        echo ""
        read -p "Clé API Azure: " azure_key
        read -p "Endpoint URL: " azure_endpoint

        OCR_API_KEY="$azure_key"
        AZURE_ENDPOINT="$azure_endpoint"
        echo -e "${GREEN}✓ Configuration Azure enregistrée${NC}"
        ;;
    4)
        echo -e "${YELLOW}⚠ Configuration API ignorée${NC}"
        OCR_PROVIDER=""
        OCR_API_KEY=""
        ;;
    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac

echo ""

# Step 3: Generate configuration file
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Étape 3/5: Génération fichier de configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CONFIG_FILE="config/ocr_config.conf"
mkdir -p config

cat > "$CONFIG_FILE" <<EOF
# Configuration OCR ISEB
# Généré automatiquement le $(date)

[ocr]
enabled = True
provider = ${OCR_PROVIDER:-google_vision}
api_key = ${OCR_API_KEY:-}
confidence_threshold = 0.85
auto_validate_threshold = 0.98
batch_processing = True
batch_size = 50
timeout = 30
retry_count = 3

[google_vision]
language = fr

[aws_textract]
access_key = ${aws_access_key:-}
secret_key = ${aws_secret_key:-}
region = ${AWS_REGION:-eu-west-1}

[azure_vision]
endpoint = ${AZURE_ENDPOINT:-}

[email]
enabled = False
alias = factures@votre-domaine.com

[logging]
level = INFO
file = logs/ocr.log
EOF

echo -e "${GREEN}✓ Configuration créée: $CONFIG_FILE${NC}"
echo ""

# Step 4: Create Python script to set Odoo parameters
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Étape 4/5: Création script de configuration Odoo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ODOO_SCRIPT="scripts/configure_odoo_ocr.py"

cat > "$ODOO_SCRIPT" <<'EOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de configuration des paramètres OCR dans Odoo
Usage: python3 configure_odoo_ocr.py --url http://localhost:8069 --db iseb --user admin --password admin
"""

import xmlrpc.client
import argparse
import configparser
import sys

def configure_odoo_ocr(url, db, username, password, config_file):
    """Configure OCR parameters in Odoo via XML-RPC"""

    print("🔌 Connexion à Odoo...")

    # Connect to Odoo
    common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
    uid = common.authenticate(db, username, password, {})

    if not uid:
        print("❌ Échec de l'authentification")
        sys.exit(1)

    print(f"✓ Connecté en tant que UID: {uid}")

    models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

    # Read config file
    config = configparser.ConfigParser()
    config.read(config_file)

    # Set system parameters
    params = [
        ('ocr.provider', config.get('ocr', 'provider', fallback='google_vision')),
        ('ocr.api_key', config.get('ocr', 'api_key', fallback='')),
        ('ocr.confidence_threshold', config.get('ocr', 'confidence_threshold', fallback='0.85')),
        ('ocr.auto_validate_threshold', config.get('ocr', 'auto_validate_threshold', fallback='0.98')),
        ('ocr.batch_processing', config.get('ocr', 'batch_processing', fallback='True')),
        ('ocr.batch_size', config.get('ocr', 'batch_size', fallback='50')),
        ('ocr.timeout', config.get('ocr', 'timeout', fallback='30')),
        ('ocr.retry_count', config.get('ocr', 'retry_count', fallback='3')),
        ('ocr.language', config.get('google_vision', 'language', fallback='fr')),
    ]

    # AWS specific
    if config.get('ocr', 'provider', fallback='') == 'aws_textract':
        params.extend([
            ('ocr.aws_access_key', config.get('aws_textract', 'access_key', fallback='')),
            ('ocr.aws_secret_key', config.get('aws_textract', 'secret_key', fallback='')),
            ('ocr.aws_region', config.get('aws_textract', 'region', fallback='eu-west-1')),
        ])

    print("\n📝 Configuration des paramètres OCR...")

    for key, value in params:
        if not value:
            continue

        # Check if parameter exists
        param_ids = models.execute_kw(db, uid, password,
            'ir.config_parameter', 'search',
            [[['key', '=', key]]])

        if param_ids:
            # Update
            models.execute_kw(db, uid, password,
                'ir.config_parameter', 'write',
                [param_ids, {'value': value}])
            print(f"  ✓ Mis à jour: {key}")
        else:
            # Create
            models.execute_kw(db, uid, password,
                'ir.config_parameter', 'create',
                [{'key': key, 'value': value}])
            print(f"  ✓ Créé: {key}")

    print("\n✅ Configuration OCR terminée avec succès!")
    print("\nProchaines étapes:")
    print("  1. Aller dans Odoo → Paramètres → Comptabilité")
    print("  2. Section 'Configuration OCR Factures'")
    print("  3. Cliquer sur 'Tester la configuration OCR'")
    print("  4. Uploader votre première facture test")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Configure OCR in Odoo')
    parser.add_argument('--url', required=True, help='Odoo URL (ex: http://localhost:8069)')
    parser.add_argument('--db', required=True, help='Database name')
    parser.add_argument('--user', required=True, help='Username')
    parser.add_argument('--password', required=True, help='Password')
    parser.add_argument('--config', default='config/ocr_config.conf', help='Config file path')

    args = parser.parse_args()

    configure_odoo_ocr(args.url, args.db, args.user, args.password, args.config)
EOF

chmod +x "$ODOO_SCRIPT"
echo -e "${GREEN}✓ Script créé: $ODOO_SCRIPT${NC}"
echo ""

# Step 5: Summary and next steps
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Étape 5/5: Résumé et prochaines étapes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✅ Installation terminée!${NC}"
echo ""
echo "Fichiers créés:"
echo "  • $CONFIG_FILE - Configuration OCR"
echo "  • $ODOO_SCRIPT - Script de configuration Odoo"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo ""
echo "1️⃣  Installer le module dans Odoo:"
echo "    • Odoo → Apps → Update Apps List"
echo "    • Rechercher 'Invoice OCR Configuration Helper'"
echo "    • Installer"
echo ""
echo "2️⃣  Configurer Odoo avec le script:"
echo "    python3 $ODOO_SCRIPT \\"
echo "      --url http://localhost:8069 \\"
echo "      --db votre_base \\"
echo "      --user admin \\"
echo "      --password votre_password"
echo ""
echo "3️⃣  Ou configurer manuellement:"
echo "    • Paramètres → Comptabilité → Configuration OCR Factures"
echo "    • Activer OCR"
echo "    • Renseigner clé API"
echo ""
echo "4️⃣  Tester avec une facture:"
echo "    • Documents → Upload"
echo "    • Sélectionner une facture PDF"
echo "    • Vérifier extraction automatique"
echo ""

if [ -n "$OCR_API_KEY" ]; then
    echo -e "${GREEN}✓ Clé API configurée${NC}"
else
    echo -e "${YELLOW}⚠ Clé API non configurée - À faire manuellement${NC}"
fi

echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  • Guide rapide : docs/OCR_QUICK_START.md"
echo "  • Guide complet: docs/OCR_INVOICE_SETUP.md"
echo "  • README module: addons/invoice_ocr_config/README.md"
echo ""
echo -e "${GREEN}Installation terminée! Bonne utilisation! 🚀${NC}"
