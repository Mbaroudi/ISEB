#!/bin/bash
#
# Script de diagnostic pour client_portal
# Teste l'installation avec différentes configurations
#

set -e

ADDON_PATH="/home/user/ISEB/addons/client_portal"
MANIFEST="$ADDON_PATH/__manifest__.py"
MANIFEST_BACKUP="$MANIFEST.backup"
MANIFEST_MINIMAL="$MANIFEST.minimal"

echo "=========================================="
echo "  DIAGNOSTIC CLIENT_PORTAL INSTALLATION"
echo "=========================================="

# Fonction pour restaurer le manifest original
restore_manifest() {
    if [ -f "$MANIFEST_BACKUP" ]; then
        echo "→ Restauration du manifest original..."
        mv "$MANIFEST_BACKUP" "$MANIFEST"
    fi
}

# Assurer la restauration en cas d'erreur
trap restore_manifest EXIT

# Test 1: Version minimale
echo ""
echo "[TEST 1] Installation avec manifest minimal"
echo "--------------------------------------------"
echo "→ Sauvegarde du manifest actuel..."
cp "$MANIFEST" "$MANIFEST_BACKUP"

echo "→ Utilisation du manifest minimal..."
cp "$MANIFEST_MINIMAL" "$MANIFEST"

echo "→ Mise à jour de la liste des modules Odoo..."
docker compose exec -T odoo odoo-bin -d iseb_db -u base --stop-after-init 2>&1 | tail -5 || true

echo "→ Tentative d'installation..."
python3 test_client_portal_minimal.py
RESULT_MINIMAL=$?

# Restaurer le manifest
echo "→ Restauration du manifest complet..."
mv "$MANIFEST_BACKUP" "$MANIFEST"

# Test 2: Version complète
echo ""
echo "[TEST 2] Installation avec manifest complet"
echo "--------------------------------------------"
python3 test_client_portal_minimal.py
RESULT_FULL=$?

# Résultats
echo ""
echo "=========================================="
echo "  RÉSULTATS DES TESTS"
echo "=========================================="
echo ""

if [ $RESULT_MINIMAL -eq 0 ]; then
    echo "✓ TEST 1: Version minimale installée avec succès"
else
    echo "✗ TEST 1: Version minimale a échoué"
fi

if [ $RESULT_FULL -eq 0 ]; then
    echo "✓ TEST 2: Version complète installée avec succès"
else
    echo "✗ TEST 2: Version complète a échoué"
fi

echo ""
echo "DIAGNOSTIC:"
if [ $RESULT_MINIMAL -eq 0 ] && [ $RESULT_FULL -ne 0 ]; then
    echo "→ Le problème vient des fichiers de vues ou des dépendances externes"
    echo "  Vérifier:"
    echo "  - portal_templates.xml"
    echo "  - portal_templates_enhanced.xml"
    echo "  - assets.xml"
    echo "  - Dépendances Python: xlsxwriter, reportlab, pytesseract, Pillow"
elif [ $RESULT_MINIMAL -ne 0 ]; then
    echo "→ Le problème est dans les fichiers de base (security, models)"
    echo "  Vérifier:"
    echo "  - security/security.xml"
    echo "  - security/ir.model.access.csv"
    echo "  - models/*.py"
else
    echo "→ Aucun problème détecté - les deux versions s'installent"
fi

echo ""
