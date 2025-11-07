# ===================================================================
# ISEB Platform - Dockerfile
# ===================================================================
#
# Build:
#   docker build -t iseb-platform:latest .
#
# Run:
#   docker run -d -p 8069:8069 --name iseb iseb-platform
#
# ===================================================================

FROM odoo:17.0

# Metadata
LABEL maintainer="ISEB Dev Team <dev@iseb.fr>"
LABEL description="ISEB Platform - SaaS Comptable pour TPE"
LABEL version="17.0"

USER root

# ===================================================================
# SYSTEM DEPENDENCIES
# ===================================================================

# Update package list and install system dependencies
RUN apt-get update && apt-get install -y \
    # Tesseract OCR + French language
    tesseract-ocr \
    tesseract-ocr-fra \
    # Image processing libraries for Pillow
    libjpeg-dev \
    zlib1g-dev \
    # XML processing
    libxml2-dev \
    libxslt1-dev \
    # Cryptography
    libssl-dev \
    libffi-dev \
    # Build tools
    build-essential \
    python3-dev \
    # Git (for some Python packages)
    git \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# ===================================================================
# PYTHON DEPENDENCIES
# ===================================================================

# Fix lxml issue for Odoo 17 - Install lxml_html_clean separately first
RUN pip3 install --no-cache-dir lxml_html_clean

# Copy requirements file
COPY requirements.txt /tmp/requirements.txt

# Install Python dependencies
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# ===================================================================
# ODOO CONFIGURATION
# ===================================================================

# Copy Odoo configuration
COPY ./config/odoo.conf /etc/odoo/odoo.conf

# ===================================================================
# ADDONS
# ===================================================================

# Copy custom addons
COPY ./addons /mnt/extra-addons

# Set ownership
RUN chown -R odoo:odoo /mnt/extra-addons

# ===================================================================
# VOLUMES
# ===================================================================

# Odoo data directory
VOLUME ["/var/lib/odoo"]

# Odoo logs
VOLUME ["/var/log/odoo"]

# ===================================================================
# PORTS
# ===================================================================

# Expose Odoo HTTP port
EXPOSE 8069

# Expose Odoo Longpolling port (optional)
EXPOSE 8072

# ===================================================================
# HEALTHCHECK
# ===================================================================

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8069/web/health || exit 1

# ===================================================================
# USER & ENTRYPOINT
# ===================================================================

# Switch back to odoo user
USER odoo

# Default command
CMD ["odoo", "--config=/etc/odoo/odoo.conf"]

# ===================================================================
# USAGE EXAMPLES
# ===================================================================
#
# Build:
#   docker build -t iseb-platform:17.0 .
#
# Run standalone:
#   docker run -d \
#     -p 8069:8069 \
#     --name iseb \
#     -v odoo-data:/var/lib/odoo \
#     iseb-platform:17.0
#
# Run with PostgreSQL:
#   docker run -d \
#     -p 8069:8069 \
#     --name iseb \
#     --link postgres:db \
#     -e HOST=db \
#     -e USER=odoo \
#     -e PASSWORD=odoo \
#     -v odoo-data:/var/lib/odoo \
#     iseb-platform:17.0
#
# Use Docker Compose (recommended):
#   docker-compose up -d
#
# ===================================================================
