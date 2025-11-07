#!/bin/bash
# Script de démarrage ISEB Accounting Platform

echo "=€ Démarrage de la plateforme ISEB..."

cd "$(dirname "$0")/../docker" || exit

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "   Fichier .env introuvable"
    echo "=Ý Copie de .env.example vers .env..."
    cp .env.example .env
    echo " Veuillez éditer le fichier .env avec vos paramètres"
    exit 1
fi

# Démarrage des conteneurs
echo "=3 Lancement des conteneurs Docker..."
docker-compose up -d

# Attendre que les services soient prêts
echo "ó Attente du démarrage des services..."
sleep 10

# Vérifier l'état
echo ""
echo "=Ê État des services:"
docker-compose ps

echo ""
echo " Plateforme démarrée avec succès!"
echo ""
echo "< Accès:"
echo "   - Application Odoo: http://localhost:8069"
echo "   - PgAdmin (dev):    http://localhost:5050"
echo ""
echo "=Ú Documentation: /docs"
echo "=Ý Logs: ./scripts/logs.sh"
