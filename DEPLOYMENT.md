# 🚀 ISEB Platform - Guide de Déploiement

**Version** : 17.0
**Date** : Janvier 2025

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Rapide](#installation-rapide)
3. [Configuration](#configuration)
4. [Déploiement Docker](#déploiement-docker)
5. [Déploiement Production](#déploiement-production)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Logiciels Requis

| Logiciel | Version Min. | Installation |
|----------|--------------|--------------|
| **Docker** | 20.10+ | [docker.com](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.0+ | [docs.docker.com/compose](https://docs.docker.com/compose/install/) |
| **Git** | 2.30+ | `apt install git` ou `yum install git` |

### Ressources Matérielles

#### Minimum (Développement)
- **CPU** : 2 cores
- **RAM** : 4 GB
- **Disque** : 20 GB

#### Recommandé (Production)
- **CPU** : 4-8 cores
- **RAM** : 8-16 GB
- **Disque** : 100 GB SSD
- **Réseau** : 100 Mbps+

---

## ⚡ Installation Rapide

### Méthode 1 : Script Automatique (Recommandé)

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/ISEB.git
cd ISEB

# 2. Lancer l'installation
chmod +x install.sh
./install.sh

# 3. Accéder à l'application
http://localhost:8069
```

### Méthode 2 : Manuelle

```bash
# 1. Cloner
git clone https://github.com/votre-org/ISEB.git
cd ISEB

# 2. Configuration
cp .env.example .env
nano .env  # Personnaliser les valeurs

# 3. Build & Start
docker-compose build
docker-compose up -d

# 4. Vérifier
docker-compose ps
docker-compose logs -f odoo
```

---

## ⚙️ Configuration

### Fichier .env

Éditez `.env` et personnalisez :

```bash
# Database
DB_PASSWORD=votre_mot_de_passe_securise

# Odoo
ADMIN_PASSWORD=admin_password_fort
WORKERS=4  # (nb_cpu * 2) + 1

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASSWORD=votre_app_password

# Sécurité
SECRET_KEY=generer-cle-secrete-aleatoire
```

### Générer Clé Secrète

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🐳 Déploiement Docker

### Architecture

```
┌─────────────┐
│   Nginx     │  (Reverse Proxy + SSL)
│   :80/:443  │
└──────┬──────┘
       │
┌──────▼──────┐
│    Odoo     │  (Application)
│   :8069     │
└──────┬──────┘
       │
   ┌───┴───┬────────┐
   │       │        │
┌──▼──┐ ┌─▼──┐ ┌──▼───┐
│ DB  │ │Redis│ │Celery│
│:5432│ │:6379│ │Worker│
└─────┘ └─────┘ └──────┘
```

### Services

| Service | Description | Port |
|---------|-------------|------|
| **odoo** | Application principale | 8069, 8072 |
| **db** | PostgreSQL 15 | 5432 |
| **redis** | Cache + Celery broker | 6379 |
| **celery** | Workers asynchrones | - |
| **nginx** | Reverse proxy (optionnel) | 80, 443 |

### Commandes Utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
docker-compose logs -f odoo

# Redémarrer un service
docker-compose restart odoo

# Arrêter
docker-compose down

# Mettre à jour
docker-compose pull
docker-compose up -d --build

# Shell dans un conteneur
docker-compose exec odoo bash
docker-compose exec db psql -U odoo

# Voir l'utilisation des ressources
docker stats
```

---

## 🌐 Déploiement Production

### 1. Préparation Serveur

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Créer utilisateur
sudo useradd -m -s /bin/bash iseb
sudo usermod -aG docker iseb
```

### 2. Clonage & Configuration

```bash
# En tant qu'utilisateur iseb
su - iseb

# Cloner dans /opt
sudo mkdir -p /opt/iseb
sudo chown iseb:iseb /opt/iseb
cd /opt/iseb

git clone https://github.com/votre-org/ISEB.git .

# Configuration
cp .env.example .env
nano .env  # Configurer pour production
```

### 3. SSL/TLS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir certificat
sudo certbot --nginx -d iseb.votredomaine.fr

# Auto-renouvellement
sudo certbot renew --dry-run
```

### 4. Nginx Configuration

Créez `/etc/nginx/sites-available/iseb`:

```nginx
upstream odoo {
    server localhost:8069;
}

upstream odoochat {
    server localhost:8072;
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name iseb.votredomaine.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name iseb.votredomaine.fr;

    ssl_certificate /etc/letsencrypt/live/iseb.votredomaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iseb.votredomaine.fr/privkey.pem;

    client_max_body_size 100M;

    proxy_read_timeout 720s;
    proxy_connect_timeout 720s;
    proxy_send_timeout 720s;

    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;

    # Logs
    access_log /var/log/nginx/odoo.access.log;
    error_log /var/log/nginx/odoo.error.log;

    # Gzip
    gzip on;
    gzip_types text/css text/less text/plain text/xml application/xml application/json application/javascript;

    # Odoo
    location / {
        proxy_pass http://odoo;
        proxy_redirect off;
    }

    # Longpolling
    location /longpolling {
        proxy_pass http://odoochat;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }

    # Cache static files
    location ~* /web/static/ {
        proxy_pass http://odoo;
        proxy_cache_valid 200 60m;
        proxy_buffering on;
        expires 864000;
    }
}
```

Activer :

```bash
sudo ln -s /etc/nginx/sites-available/iseb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Démarrage

```bash
cd /opt/iseb
docker-compose up -d

# Vérifier
docker-compose ps
curl https://iseb.votredomaine.fr/web/health
```

### 6. Systemd Service (Optionnel)

Créez `/etc/systemd/system/iseb.service`:

```ini
[Unit]
Description=ISEB Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/iseb
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Activer :

```bash
sudo systemctl enable iseb
sudo systemctl start iseb
```

---

## 🔧 Maintenance

### Backups

#### 1. Base de Données

```bash
# Backup
docker-compose exec db pg_dump -U odoo odoo > backup_$(date +%Y%m%d_%H%M%S).sql

# Compression
gzip backup_*.sql

# Restauration
docker-compose exec -T db psql -U odoo odoo < backup.sql
```

#### 2. Filestore

```bash
# Backup
docker cp iseb_odoo:/var/lib/odoo filestore_backup/

# Restauration
docker cp filestore_backup/ iseb_odoo:/var/lib/odoo
```

#### 3. Script Automatique

Créez `/opt/iseb/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/iseb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database
docker-compose exec -T db pg_dump -U odoo odoo | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Filestore
docker cp iseb_odoo:/var/lib/odoo $BACKUP_DIR/filestore_$DATE

# Retention (30 jours)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Crontab :

```bash
# Backup quotidien à 2h du matin
0 2 * * * /opt/iseb/backup.sh >> /var/log/iseb-backup.log 2>&1
```

### Mises à Jour

```bash
# 1. Backup
./backup.sh

# 2. Pull dernière version
git pull origin main

# 3. Rebuild & restart
docker-compose build
docker-compose up -d

# 4. Update modules
docker-compose exec odoo odoo -u all -d production --stop-after-init

# 5. Vérifier
docker-compose logs -f
```

### Monitoring

#### Logs

```bash
# Logs temps réel
docker-compose logs -f

# Logs Odoo uniquement
docker-compose logs -f odoo

# Dernières 100 lignes
docker-compose logs --tail=100 odoo

# Logs avec timestamps
docker-compose logs -t odoo
```

#### Métriques

```bash
# Utilisation ressources
docker stats

# Espace disque
docker system df
du -sh /var/lib/docker/volumes/
```

---

## 🐛 Troubleshooting

### Problème : Odoo ne démarre pas

```bash
# Vérifier logs
docker-compose logs odoo

# Vérifier database
docker-compose logs db

# Redémarrer proprement
docker-compose down
docker-compose up -d
```

### Problème : Database connection error

```bash
# Vérifier PostgreSQL
docker-compose exec db pg_isready -U odoo

# Tester connexion
docker-compose exec db psql -U odoo -d odoo -c "SELECT 1"

# Vérifier .env
cat .env | grep DB_
```

### Problème : Module installation failed

```bash
# Vérifier dépendances Python
docker-compose exec odoo pip list

# Réinstaller
docker-compose exec odoo pip install -r /mnt/extra-addons/client_portal/requirements.txt

# Update module list
docker-compose exec odoo odoo --update=all --stop-after-init
```

### Problème : Performance lente

```bash
# Vérifier workers
docker-compose exec odoo ps aux | grep odoo

# Vérifier mémoire
docker stats iseb_odoo

# Ajuster WORKERS dans .env
# Formule: (nb_cpu * 2) + 1
```

### Problème : SSL Certificate

```bash
# Vérifier certificat
sudo certbot certificates

# Renouveler
sudo certbot renew

# Test nginx
sudo nginx -t
```

---

## 📚 Ressources

- **Documentation Utilisateur** : [USER_GUIDE.md](USER_GUIDE.md)
- **Documentation OCR** : [addons/client_portal/OCR_README.md](addons/client_portal/OCR_README.md)
- **Odoo Documentation** : https://www.odoo.com/documentation/17.0/
- **Docker Documentation** : https://docs.docker.com/

---

## 📞 Support

- **Email** : support@iseb.fr
- **Issues** : https://github.com/votre-org/ISEB/issues
- **Documentation** : https://docs.iseb.fr

---

**🚀 Bon déploiement avec ISEB Platform !**

*Guide rédigé par l'équipe ISEB - Janvier 2025*
