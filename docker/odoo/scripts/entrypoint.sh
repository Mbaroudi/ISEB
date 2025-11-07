#!/bin/bash
# Entrypoint script pour Odoo - ISEB Accounting Platform

set -e

# Fonction pour logger
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting ISEB Odoo container..."

# Attendre que PostgreSQL soit prêt
log "Waiting for PostgreSQL to be ready..."
python3 /usr/local/bin/wait-for-psql.py

# Attendre que Redis soit prêt
log "Waiting for Redis to be ready..."
timeout=30
counter=0
until redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} -a ${REDIS_PASSWORD:-redispassword} ping > /dev/null 2>&1; do
    counter=$((counter+1))
    if [ $counter -gt $timeout ]; then
        log "ERROR: Redis is not available after ${timeout} seconds"
        exit 1
    fi
    log "Redis is unavailable - sleeping (attempt $counter/$timeout)"
    sleep 1
done
log "Redis is up and running!"

# Créer les répertoires nécessaires s'ils n'existent pas
mkdir -p /var/lib/odoo/sessions
mkdir -p /var/lib/odoo/filestore
mkdir -p /var/log/odoo

# Configuration des permissions
chown -R odoo:odoo /var/lib/odoo
chown -R odoo:odoo /var/log/odoo

# Si c'est la première installation, initialiser la base de données
if [ ! -f /var/lib/odoo/.initialized ]; then
    log "First run detected - initializing database..."

    # Créer un fichier de configuration temporaire si nécessaire
    if [ ! -f /etc/odoo/odoo.conf ]; then
        log "Creating default Odoo configuration..."
        cat > /etc/odoo/odoo.conf << EOF
[options]
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
data_dir = /var/lib/odoo
admin_passwd = ${ODOO_ADMIN_PASSWD:-admin}
db_host = ${HOST:-postgres}
db_port = ${PORT:-5432}
db_user = ${USER:-odoo}
db_password = ${PASSWORD:-odoo}
db_name = ${DATABASE:-odoo}
db_filter = ${ODOO_DB_FILTER:-.*}
workers = ${ODOO_WORKERS:-4}
max_cron_threads = ${ODOO_MAX_CRON_THREADS:-2}
limit_time_cpu = 600
limit_time_real = 1200
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648
log_level = info
logfile = /var/log/odoo/odoo.log
proxy_mode = True
EOF
        chown odoo:odoo /etc/odoo/odoo.conf
    fi

    # Marquer comme initialisé
    touch /var/lib/odoo/.initialized
    chown odoo:odoo /var/lib/odoo/.initialized

    log "Database initialization complete!"
fi

# Vérifier si des modules doivent être mis à jour
if [ -n "$UPDATE_MODULES" ]; then
    log "Updating modules: $UPDATE_MODULES"
    exec odoo --config=/etc/odoo/odoo.conf --update="$UPDATE_MODULES" --stop-after-init
fi

# Vérifier si des modules doivent être installés
if [ -n "$INSTALL_MODULES" ]; then
    log "Installing modules: $INSTALL_MODULES"
    exec odoo --config=/etc/odoo/odoo.conf --init="$INSTALL_MODULES" --stop-after-init
fi

# Démarrer Odoo
log "Starting Odoo with configuration: /etc/odoo/odoo.conf"
log "Addons paths:"
log "  - Core: /usr/lib/python3/dist-packages/odoo/addons"
log "  - Extra: /mnt/extra-addons"
log "  - Custom: /mnt/custom-addons"

# Afficher la version d'Odoo
odoo --version

# Lancer Odoo avec la configuration
exec "$@" --config=/etc/odoo/odoo.conf
