# Dockerfile pour Odoo 17.0 - ISEB Accounting Platform
FROM odoo:17.0

# Arguments
ARG ODOO_VERSION=17.0

# Métadonnées
LABEL maintainer="ISEB Dev Team <dev@iseb-accounting.fr>"
LABEL description="Odoo-based French Accounting SaaS Platform"
LABEL version="${ODOO_VERSION}"

# Variables d'environnement
ENV ODOO_RC=/etc/odoo/odoo.conf \
    ODOO_DATA_DIR=/var/lib/odoo \
    ODOO_EXTRA_ADDONS=/mnt/extra-addons \
    ODOO_CUSTOM_ADDONS=/mnt/custom-addons

# Passer en root pour les installations
USER root

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Outils de base
    curl \
    wget \
    git \
    vim \
    # Dépendances Python
    python3-dev \
    python3-pip \
    python3-venv \
    build-essential \
    libpq-dev \
    # Dépendances pour OCR et traitement d'images
    tesseract-ocr \
    tesseract-ocr-fra \
    poppler-utils \
    imagemagick \
    # Dépendances pour wkhtmltopdf (PDF generation)
    fontconfig \
    libxrender1 \
    xfonts-75dpi \
    xfonts-base \
    # Dépendances pour Excel
    libreoffice-calc \
    # Utilitaires
    postgresql-client \
    redis-tools \
    # Nettoyage
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installation de wkhtmltopdf depuis le site officiel (version avec patched qt)
RUN wget -q https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb \
    && apt-get update \
    && apt-get install -y ./wkhtmltox_0.12.6.1-2.bullseye_amd64.deb \
    && rm wkhtmltox_0.12.6.1-2.bullseye_amd64.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installation des dépendances Python supplémentaires
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# Création des répertoires nécessaires
RUN mkdir -p \
    ${ODOO_DATA_DIR} \
    ${ODOO_EXTRA_ADDONS} \
    ${ODOO_CUSTOM_ADDONS} \
    /var/log/odoo \
    /etc/odoo

# Configuration des permissions
RUN chown -R odoo:odoo \
    ${ODOO_DATA_DIR} \
    ${ODOO_EXTRA_ADDONS} \
    ${ODOO_CUSTOM_ADDONS} \
    /var/log/odoo \
    /etc/odoo

# Copie des scripts personnalisés
COPY --chown=odoo:odoo ./scripts/entrypoint.sh /entrypoint.sh
COPY --chown=odoo:odoo ./scripts/wait-for-psql.py /usr/local/bin/wait-for-psql.py

# Rendre les scripts exécutables
RUN chmod +x /entrypoint.sh /usr/local/bin/wait-for-psql.py

# Retour à l'utilisateur odoo
USER odoo

# Exposition des ports
# 8069: HTTP
# 8072: Longpolling
EXPOSE 8069 8072

# Volume pour les données persistantes
VOLUME ["${ODOO_DATA_DIR}", "${ODOO_EXTRA_ADDONS}", "${ODOO_CUSTOM_ADDONS}"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8069/web/health || exit 1

# Point d'entrée
ENTRYPOINT ["/entrypoint.sh"]
CMD ["odoo"]
