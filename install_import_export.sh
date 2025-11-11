#!/bin/bash
# Script d'installation automatique du module Import/Export ISEB
# Usage: ./install_import_export.sh

set -e  # Arrêter en cas d'erreur

echo "=========================================================================="
echo "🚀 Installation du module ISEB Import/Export Comptable"
echo "=========================================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ODOO_CONTAINER="iseb-odoo-1"
DB_NAME="iseb_db"
ADMIN_PASSWORD="admin"

# Fonction d'affichage
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Vérifier si Docker est installé
print_step "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé"
    exit 1
fi
print_success "Docker trouvé"

# Vérifier si docker-compose est installé
print_step "Vérification de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé"
    exit 1
fi
print_success "Docker Compose trouvé"

# Vérifier si Odoo est démarré
print_step "Vérification du conteneur Odoo..."
if ! docker ps | grep -q "$ODOO_CONTAINER"; then
    print_warning "Le conteneur Odoo n'est pas démarré"
    print_step "Démarrage d'Odoo..."
    docker-compose -f docker-compose.frontend.yml up -d odoo
    sleep 10  # Attendre le démarrage
fi
print_success "Conteneur Odoo actif"

# Vérifier la connexion à Odoo
print_step "Vérification de la connexion Odoo..."
if ! curl -s http://localhost:8069 > /dev/null; then
    print_error "Impossible de se connecter à Odoo sur http://localhost:8069"
    print_warning "Vérifier que Odoo est bien démarré : docker-compose logs odoo"
    exit 1
fi
print_success "Odoo accessible sur http://localhost:8069"

# Installer le module account (Comptabilité)
print_step "Installation du module Comptabilité (account)..."
docker exec $ODOO_CONTAINER odoo-bin -d $DB_NAME -i account --stop-after-init --db-filter=^$DB_NAME$ 2>&1 | grep -v "WARNING" || true
print_success "Module Comptabilité installé"

# Mettre à jour la liste des applications
print_step "Mise à jour de la liste des applications..."
docker exec $ODOO_CONTAINER odoo-bin -d $DB_NAME -u all --stop-after-init --db-filter=^$DB_NAME$ 2>&1 | grep -v "WARNING" || true
print_success "Liste des applications mise à jour"

# Installer le module account_import_export
print_step "Installation du module ISEB Import/Export (account_import_export)..."
docker exec $ODOO_CONTAINER odoo-bin -d $DB_NAME -i account_import_export --stop-after-init --db-filter=^$DB_NAME$ 2>&1 | grep -v "WARNING" || true
print_success "Module ISEB Import/Export installé"

# Redémarrer Odoo pour charger les modules
print_step "Redémarrage d'Odoo..."
docker-compose -f docker-compose.frontend.yml restart odoo
sleep 5
print_success "Odoo redémarré"

# Vérification finale avec le script Python
print_step "Vérification finale des dépendances..."
echo ""

if command -v python3 &> /dev/null; then
    python3 check_dependencies.py
    RESULT=$?

    if [ $RESULT -eq 0 ]; then
        echo ""
        echo "=========================================================================="
        echo -e "${GREEN}✅ Installation réussie !${NC}"
        echo "=========================================================================="
        echo ""
        echo "🎉 Le module Import/Export est maintenant disponible :"
        echo ""
        echo "   📍 Interface Web (Recommandé) :"
        echo "      http://localhost:3000/settings"
        echo "      → Onglet 'Import/Export'"
        echo ""
        echo "   📍 Interface Odoo :"
        echo "      http://localhost:8069"
        echo "      → Comptabilité → Configuration → Import / Export"
        echo ""
        echo "📚 Documentation :"
        echo "   - Guide utilisateur  : IMPORT_EXPORT_GUIDE.md"
        echo "   - Guide installation : INSTALLATION_IMPORT_EXPORT.md"
        echo ""
        echo "🔧 Configuration à compléter :"
        echo "   1. Paramètres → Sociétés → Configurer le SIREN (9 chiffres)"
        echo "   2. Comptabilité → Configuration → Plan comptable"
        echo "   3. Comptabilité → Configuration → Journaux"
        echo ""
        echo "=========================================================================="
    else
        echo ""
        echo "=========================================================================="
        echo -e "${YELLOW}⚠ Installation terminée avec des avertissements${NC}"
        echo "=========================================================================="
        echo ""
        echo "Certains prérequis ne sont pas complètement configurés."
        echo "Consultez le rapport ci-dessus pour plus de détails."
        echo ""
        echo "📚 Documentation : INSTALLATION_IMPORT_EXPORT.md"
        echo ""
    fi
else
    print_warning "Python3 non trouvé, impossible de vérifier les dépendances"
    echo ""
    echo "=========================================================================="
    echo -e "${GREEN}Installation terminée${NC}"
    echo "=========================================================================="
    echo ""
    echo "Vérifiez manuellement que tout fonctionne :"
    echo "1. http://localhost:8069 → Apps → Chercher 'ISEB Import/Export'"
    echo "2. Comptabilité → Configuration → Import / Export"
    echo ""
fi

exit 0
