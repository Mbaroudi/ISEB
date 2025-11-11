#!/bin/bash
# Script wrapper pour lancer les tests automatiques

set -e

echo "========================================"
echo "  Tests Automatiques ISEB Platform"
echo "========================================"
echo ""

# Vérifie que Docker est en cours d'exécution
if ! docker ps &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution"
    echo "   Démarrez Docker et réessayez"
    exit 1
fi

echo "✓ Docker en cours d'exécution"

# Vérifie si Odoo est accessible
echo "Vérification de l'accessibilité d'Odoo..."
if curl -s http://localhost:8069 > /dev/null 2>&1; then
    echo "✓ Odoo accessible sur http://localhost:8069"
else
    echo "❌ Odoo n'est pas accessible"
    echo "   Démarrez Odoo avec: cd docker && docker-compose up -d"
    exit 1
fi

# Variables d'environnement par défaut
export ODOO_URL=${ODOO_URL:-http://localhost:8069}
export ODOO_DB=${ODOO_DB:-iseb}
export ODOO_USER=${ODOO_USER:-admin}
export ODOO_PASSWORD=${ODOO_PASSWORD:-admin}

echo ""
echo "Configuration:"
echo "  URL Odoo: $ODOO_URL"
echo "  Base de données: $ODOO_DB"
echo "  Utilisateur: $ODOO_USER"
echo ""

# Lance les tests Python
echo "Lancement des tests..."
python3 scripts/test_modules.py

exit $?
