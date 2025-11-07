# Guide de Déploiement - ISEB Accounting Platform

**Version** : 1.0
**Date** : Novembre 2025

---

## 1. Prérequis

### 1.1 Environnement serveur

| Composant | Minimum | Recommandé | Production |
|-----------|---------|------------|------------|
| **CPU** | 2 vCPU | 4 vCPU | 8 vCPU |
| **RAM** | 4 GB | 16 GB | 32 GB |
| **Disque** | 50 GB SSD | 200 GB SSD | 500 GB NVMe |
| **Réseau** | 100 Mbps | 1 Gbps | 10 Gbps |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 1.2 Logiciels requis

```bash
# Docker
Docker Engine >= 20.10
Docker Compose >= 2.0

# Optionnel (pour monitoring)
kubectl >= 1.28 (si Kubernetes)
```

---

## 2. Installation Development

### 2.1 Clone du repository

```bash
git clone https://github.com/votre-org/iseb-accounting-saas.git
cd iseb-accounting-saas
```

### 2.2 Configuration

```bash
# Copier le fichier d'environnement
cd docker
cp .env.example .env

# Éditer les variables
nano .env
```

**Variables critiques à modifier** :
```bash
POSTGRES_PASSWORD=votre_mot_de_passe_securise
REDIS_PASSWORD=votre_redis_password
ODOO_ADMIN_PASSWD=votre_master_password
```

### 2.3 Démarrage

```bash
# Lancer tous les services
docker-compose up -d

# Vérifier l'état
docker-compose ps

# Logs en temps réel
docker-compose logs -f odoo
```

### 2.4 Accès à l'application

- **Application** : http://localhost:8069
- **PgAdmin** : http://localhost:5050 (dev only)
- **Grafana** : http://localhost:3000 (si monitoring activé)

**Credentials par défaut** :
- User: admin
- Password: admin

  **IMPORTANT** : Changer le mot de passe immédiatement !

---

## 3. Installation Production

### 3.1 Préparation du serveur

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installation Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

### 3.2 Configuration firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3.3 Configuration SSL (Let's Encrypt)

```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Génération certificat
sudo certbot --nginx -d accounting.votredomaine.fr

# Auto-renewal
sudo certbot renew --dry-run
```

### 3.4 Fichier .env production

```bash
# Environment
APP_ENV=production

# Database
POSTGRES_DB=iseb_prod
POSTGRES_USER=odoo_prod
POSTGRES_PASSWORD=SUPER_STRONG_PASSWORD_123!@#

# Redis
REDIS_PASSWORD=REDIS_STRONG_PWD_456!@#

# Odoo
ODOO_ADMIN_PASSWD=MASTER_PASSWORD_789!@#
ODOO_DB_FILTER=^iseb_prod$
ODOO_WORKERS=8

# SSL
SSL_ENABLED=true
DOMAIN_NAME=accounting.votredomaine.fr

# Backup
BACKUP_SCHEDULE="@daily"
BACKUP_KEEP_DAYS=7
```

### 3.5 Configuration Odoo (odoo.conf)

```bash
cp config/odoo.conf.example config/odoo.conf
nano config/odoo.conf
```

**Paramètres critiques pour production** :
```ini
[options]
# Database
db_filter = ^iseb_prod$

# Security
list_db = False
db_create = False
db_drop = False

# Performance
workers = 8
max_cron_threads = 2
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648

# Proxy
proxy_mode = True
```

### 3.6 Démarrage production

```bash
# Build et démarrage
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérification
docker-compose ps
docker-compose logs -f
```

---

## 4. Kubernetes (Production Scale)

### 4.1 Architecture Kubernetes

```yaml
Namespaces:
  - iseb-prod
  - iseb-staging

Deployments:
  - odoo-web (replicas: 3)
  - odoo-worker (replicas: 2)

StatefulSets:
  - postgresql
  - redis

Services:
  - odoo-service (LoadBalancer)
  - postgres-service (ClusterIP)
```

### 4.2 Déploiement Kubernetes

```bash
# Créer namespace
kubectl create namespace iseb-prod

# Appliquer configurations
kubectl apply -f k8s/

# Vérifier
kubectl get pods -n iseb-prod
kubectl get services -n iseb-prod
```

---

## 5. Configuration réseau

### 5.1 Nginx reverse proxy (configuration finale)

```nginx
# /etc/nginx/sites-available/iseb-accounting

upstream odoo {
    server localhost:8069;
}

upstream odoochat {
    server localhost:8072;
}

server {
    listen 80;
    server_name accounting.votredomaine.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name accounting.votredomaine.fr;

    ssl_certificate /etc/letsencrypt/live/accounting.votredomaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/accounting.votredomaine.fr/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    # Odoo main
    location / {
        proxy_pass http://odoo;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_redirect off;
    }

    # Longpolling
    location /longpolling {
        proxy_pass http://odoochat;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files (with cache)
    location ~* /web/static/ {
        proxy_pass http://odoo;
        proxy_cache_valid 200 304 60m;
        expires 864000;
    }
}
```

### 5.2 Activation Nginx

```bash
sudo ln -s /etc/nginx/sites-available/iseb-accounting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Initialisation de la base de données

### 6.1 Création de la base

```bash
# Accès au conteneur Odoo
docker exec -it iseb-odoo bash

# Initialisation base de données
odoo -d iseb_prod -i base,account,l10n_fr,french_accounting --stop-after-init

# Sortie du conteneur
exit
```

### 6.2 Installation des modules custom

```bash
# Depuis l'interface web Odoo
# Apps > Update Apps List > Search "French Accounting ISEB" > Install
```

---

## 7. Sauvegardes

### 7.1 Sauvegarde automatique PostgreSQL

```bash
# Le conteneur backup est déjà configuré dans docker-compose
# Vérifier les backups
docker exec iseb-backup ls -lah /backups/

# Restaurer une sauvegarde
docker exec -i iseb-postgres psql -U odoo_prod iseb_prod < /backups/iseb_prod_2025-01-15.sql
```

### 7.2 Sauvegarde filestore

```bash
# Backup du volume odoo-data
docker run --rm -v iseb_odoo-data:/data -v $(pwd):/backup ubuntu tar czf /backup/odoo-filestore-backup.tar.gz /data

# Restauration
docker run --rm -v iseb_odoo-data:/data -v $(pwd):/backup ubuntu tar xzf /backup/odoo-filestore-backup.tar.gz -C /
```

### 7.3 Backup complet (script automatisé)

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/iseb"
DATE=$(date +%Y-%m-%d_%H%M%S)

# Backup PostgreSQL
docker exec iseb-postgres pg_dump -U odoo_prod iseb_prod > "$BACKUP_DIR/db_$DATE.sql"

# Backup filestore
docker run --rm -v iseb_odoo-data:/data -v $BACKUP_DIR:/backup ubuntu tar czf "/backup/filestore_$DATE.tar.gz" /data

# Rotation (garder 7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Upload vers S3 (optionnel)
# aws s3 cp "$BACKUP_DIR/db_$DATE.sql" s3://iseb-backups/
```

**Cron job** :
```bash
crontab -e

# Backup quotidien à 2h du matin
0 2 * * * /opt/iseb/scripts/backup.sh
```

---

## 8. Monitoring

### 8.1 Prometheus + Grafana

```bash
# Activer le profil monitoring
docker-compose --profile monitoring up -d

# Accès Grafana
http://votre-serveur:3000
User: admin
Pass: (voir GRAFANA_PASSWORD dans .env)
```

### 8.2 Dashboards Grafana

Importer les dashboards pré-configurés :
- Infrastructure Overview : `docker/monitoring/grafana/dashboards/infrastructure.json`
- Odoo Performance : `docker/monitoring/grafana/dashboards/odoo.json`
- PostgreSQL : `docker/monitoring/grafana/dashboards/postgresql.json`

### 8.3 Alertes

Configurer les alertes dans Grafana :
- CPU > 80% pendant 5min
- Disk < 10% libre
- HTTP 5xx > 10/min
- PostgreSQL connections > 80% max

---

## 9. Sécurité post-installation

### 9.1 Checklist sécurité

- [ ] Changer tous les mots de passe par défaut
- [ ] Configurer SSL/TLS
- [ ] Activer le firewall (UFW)
- [ ] Désactiver l'accès root SSH
- [ ] Configurer fail2ban
- [ ] Mettre en place les backups automatiques
- [ ] Configurer les alertes monitoring
- [ ] Auditer les accès (logs)
- [ ] Limiter les connexions DB (pg_hba.conf)
- [ ] Activer 2FA pour les comptes admin

### 9.2 Fail2ban

```bash
# Installation
sudo apt install fail2ban

# Configuration
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 10. Maintenance

### 10.1 Mise à jour mineure

```bash
# Backup avant mise à jour
./scripts/backup.sh

# Pull latest version
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Redémarrage
docker-compose down
docker-compose up -d

# Vérification
docker-compose logs -f
```

### 10.2 Mise à jour majeure (ex: Odoo 17 ’ 18)

```bash
# 1. Backup complet
./scripts/backup.sh

# 2. Staging test
# Tester la migration sur environnement staging

# 3. Maintenance window
# Planifier downtime (ex: dimanche 2h-6h AM)

# 4. Migration
docker-compose down
# Modifier ODOO_VERSION dans .env
docker-compose build --no-cache
docker-compose up -d

# 5. Update modules
docker exec iseb-odoo odoo -u all -d iseb_prod --stop-after-init

# 6. Vérification
# Tests fonctionnels complets

# 7. Rollback plan si problème
# Restaurer backup + version précédente
```

### 10.3 Nettoyage

```bash
# Nettoyage images Docker
docker system prune -a

# Nettoyage logs
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# Vacuum PostgreSQL
docker exec iseb-postgres psql -U odoo_prod -d iseb_prod -c "VACUUM FULL ANALYZE;"
```

---

## 11. Troubleshooting

### 11.1 Problèmes courants

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| **Odoo ne démarre pas** | Postgres pas prêt | Vérifier logs postgres, restart |
| **502 Bad Gateway** | Nginx ne peut pas joindre Odoo | Vérifier proxy_pass dans nginx.conf |
| **Slow queries** | Indexes manquants | EXPLAIN ANALYZE, créer indexes |
| **Out of memory** | Workers trop nombreux | Réduire ODOO_WORKERS |
| **Disk full** | Logs ou filestore | Nettoyer /var/log et backups anciens |

### 11.2 Commandes de diagnostic

```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Logs Odoo
docker-compose logs -f odoo

# Connexion PostgreSQL
docker exec -it iseb-postgres psql -U odoo_prod iseb_prod

# Vérifier performance
docker stats

# Espace disque
df -h
du -sh /var/lib/docker/volumes/*
```

---

## 12. Rollback procedure

### 12.1 Rollback rapide

```bash
# 1. Stopper les services
docker-compose down

# 2. Restaurer backup base de données
docker exec -i iseb-postgres psql -U odoo_prod iseb_prod < /backups/latest.sql

# 3. Restaurer filestore
docker run --rm -v iseb_odoo-data:/data -v /backups:/backup ubuntu tar xzf /backup/latest.tar.gz -C /

# 4. Redémarrer version précédente
git checkout <previous-version>
docker-compose up -d

# 5. Vérification
curl http://localhost:8069/web/health
```

---

## 13. SLA et support

### 13.1 SLA Production

| Métrique | Objectif |
|----------|----------|
| **Uptime** | 99.9% (43 min downtime/mois max) |
| **Response time** | < 2 secondes (p95) |
| **Time to resolve P1** | < 4 heures |
| **Time to resolve P2** | < 24 heures |
| **Backup retention** | 7 jours (quotidien), 4 semaines (hebdo) |

### 13.2 Contacts support

- **Critical (P1)** : support-urgent@iseb.fr + SMS on-call
- **High (P2)** : support@iseb.fr
- **Normal (P3)** : tickets@iseb.fr

---

## 14. Documentation supplémentaire

- [Architecture technique complète](../architecture/architecture-technique.md)
- [Guide d'intégration bancaire](../integration/plan-integration-bancaire.md)
- [Cahier des charges](../cahier-des-charges.md)

---

**Fin du document**

Version 1.0 - Novembre 2025
© ISEB - Tous droits réservés
