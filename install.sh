#!/bin/bash

# ===================================================================
# ISEB Platform - Installation Script
# ===================================================================
#
# Ce script automatise l'installation d'ISEB Platform
#
# Usage:
#   chmod +x install.sh
#   ./install.sh
#
# ===================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_header() {
    echo ""
    echo "===================================================================="
    echo "$1"
    echo "===================================================================="
    echo ""
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Ne lancez pas ce script en tant que root"
    exit 1
fi

print_header "ISEB PLATFORM - INSTALLATION"

# ===================================================================
# 1. Vérification des prérequis
# ===================================================================

print_header "1. Vérification des prérequis"

# Check Docker
if command -v docker &> /dev/null; then
    print_success "Docker est installé ($(docker --version))"
else
    print_error "Docker n'est pas installé"
    print_info "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command -v docker compose &> /dev/null; then
    print_success "Docker Compose est installé ($(docker compose --version))"
else
    print_error "Docker Compose n'est pas installé"
    print_info "Installez Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git est installé"
else
    print_error "Git n'est pas installé"
    exit 1
fi

# ===================================================================
# 2. Configuration
# ===================================================================

print_header "2. Configuration"

# Create .env if not exists
if [ ! -f .env ]; then
    print_info "Création du fichier .env..."
    cp .env.example .env
    print_success "Fichier .env créé"
    print_info "IMPORTANT: Éditez .env et personnalisez les valeurs"
    read -p "Voulez-vous éditer .env maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    print_success "Fichier .env existe déjà"
fi

# ===================================================================
# 3. Build Docker Images
# ===================================================================

print_header "3. Build des images Docker"

print_info "Construction de l'image ISEB..."
docker compose build
print_success "Image ISEB construite"

# ===================================================================
# 4. Démarrage des services
# ===================================================================

print_header "4. Démarrage des services"

print_info "Démarrage de PostgreSQL et Redis..."
docker compose up -d db redis

# Wait for database
print_info "Attente de PostgreSQL..."
sleep 10

print_info "Démarrage d'Odoo..."
docker compose up -d odoo

print_info "Démarrage de Celery..."
docker compose up -d celery

print_success "Tous les services sont démarrés"

# ===================================================================
# 5. Vérification
# ===================================================================

print_header "5. Vérification"

sleep 5

# Check services health
docker compose ps

print_success "Installation terminée!"

# ===================================================================
# 6. Instructions finales
# ===================================================================

print_header "INSTALLATION TERMINÉE !"

echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "  1. Accédez à ISEB Platform:"
echo "     http://localhost:8069"
echo ""
echo "  2. Créez votre première base de données:"
echo "     - Master password: voir ADMIN_PASSWORD dans .env"
echo "     - Database name: iseb_prod"
echo "     - Email: admin@iseb.fr"
echo "     - Password: (choisissez un mot de passe)"
echo ""
echo "  3. Installez les modules:"
echo "     Apps → Update Apps List"
echo "     Recherchez et installez:"
echo "       - client_portal"
echo "       - bank_sync"
echo "       - reporting"
echo "       - e_invoicing"
echo ""
echo "  4. Configurez les modules:"
echo "     Suivez le USER_GUIDE.md"
echo ""
echo "📚 Documentation:"
echo "   - Guide utilisateur: USER_GUIDE.md"
echo "   - Documentation OCR: addons/client_portal/OCR_README.md"
echo ""
echo "🔧 Commandes utiles:"
echo "   - docker compose logs -f          # Voir les logs"
echo "   - docker compose restart odoo     # Redémarrer Odoo"
echo "   - docker compose down             # Arrêter tous les services"
echo "   - docker compose exec odoo bash   # Shell dans le conteneur"
echo ""
echo "⚠️  SÉCURITÉ:"
echo "   - Changez les mots de passe dans .env"
echo "   - Configurez SSL/TLS pour la production"
echo "   - Configurez les backups réguliers"
echo ""

print_success "Profitez d'ISEB Platform! 🚀"
