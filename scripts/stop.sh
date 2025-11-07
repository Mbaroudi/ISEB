#!/bin/bash
echo "=Ñ Arrêt de la plateforme ISEB..."
cd "$(dirname "$0")/../docker" && docker-compose down
echo " Plateforme arrêtée"
