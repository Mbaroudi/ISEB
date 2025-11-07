# Plateforme SaaS de Gestion Comptable Française - ISEB

[![License](https://img.shields.io/badge/license-AGPL--3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
[![Odoo Version](https://img.shields.io/badge/Odoo-17.0-purple.svg)](https://www.odoo.com)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://www.docker.com)

## 🎯 Vue d'ensemble

Plateforme SaaS complète de gestion comptable destinée aux cabinets d'expertise-comptable français, permettant de gérer efficacement leurs clients (micro-entrepreneurs, associations, PME) avec une solution moderne, automatisée et conforme à la législation française.

Inspirée du modèle **Dougs.fr**, cette solution basée sur **Odoo** offre une interface centralisée pour les cabinets et un espace client intuitif pour les entrepreneurs.

## 🚀 Caractéristiques principales

### Espace Cabinet (Back-office Expert-Comptable)
- ✅ Gestion multi-clients et multi-sociétés
- ✅ Vue centralisée de la situation comptable
- ✅ Workflow de validation des écritures
- ✅ Communication intégrée (chat, commentaires, alertes)
- ✅ Gestion des mandats et rôles utilisateurs
- ✅ Suivi des échéances fiscales et sociales

### Espace Client (Portail SaaS)
- 📊 Tableau de bord temps réel (trésorerie, CA, charges)
- 🧾 Gestion complète des factures
- 🏦 Synchronisation bancaire automatique
- 💰 Notes de frais avec OCR
- 📁 Dépôt de documents
- 📈 Simulation d'impôt et prévision de trésorerie
- 💬 Collaboration avec le cabinet

### Modules Comptables Français
- 📚 Comptabilité générale (PCG)
- 📋 Déclarations TVA automatisées
- 📑 Liasses fiscales (2033, 2035, 2050)
- 🏢 Immobilisations & amortissements
- 👥 Paie (intégration API)
- 📤 Exports normalisés (FEC, Excel, PDF)

## 🏗️ Architecture Technique

### Stack Technologique
- **Backend** : Odoo 17.0 (Community/Enterprise)
- **Base de données** : PostgreSQL 15
- **Proxy** : Nginx
- **Conteneurisation** : Docker & Docker Compose
- **Orchestration** : Kubernetes (option)
- **API** : REST/GraphQL
- **Authentification** : OAuth2 / SSO

### Infrastructure Docker
```
├── Odoo (application principale)
├── PostgreSQL (base de données)
├── Nginx (reverse proxy)
├── Redis (cache)
└── Workers (tâches asynchrones)
```

## 🔗 Intégrations

- **Banques** : Budget Insight, Bridge, Linxo, Powens
- **Signature électronique** : Yousign, DocuSign
- **Paie/RH** : PayFit, Silae, Odoo HR
- **E-commerce** : Shopify, PrestaShop, WooCommerce
- **Facturation électronique** : Chorus Pro (2026)

## 💰 Modèle Tarifaire

| Pack | Prix/mois | Fonctionnalités |
|------|-----------|-----------------|
| **Liberté** | 200€ | Comptabilité + Facturation + Synchro bancaire |
| **Sérénité** | 350€ | + Accompagnement fiscal + Notes de frais + Reporting |
| **PME** | 500€ | + Paie + Tableau de bord analytique + Support prioritaire |

## 🚀 Démarrage Rapide

### Prérequis
- Docker 20.10+
- Docker Compose 2.0+
- 4 GB RAM minimum
- 20 GB espace disque

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-org/iseb-accounting-saas.git
cd iseb-accounting-saas

# Lancer l'environnement de développement
docker-compose up -d

# Accéder à l'application
# Frontend: http://localhost:8069
# Backend Admin: http://localhost:8069/web (admin/admin)
```

### Configuration

```bash
# Copier le fichier de configuration
cp config/odoo.conf.example config/odoo.conf

# Éditer la configuration
nano config/odoo.conf

# Redémarrer les services
docker-compose restart
```

## 📚 Documentation

- [Cahier des charges fonctionnel](docs/cahier-des-charges.md)
- [Architecture technique](docs/architecture/)
- [Guide d'intégration](docs/integration/)
- [Guide de déploiement](docs/deployment/)
- [Prototypes UI/UX](docs/ui-prototypes/)

## 🛠️ Développement

### Structure des Modules Addons

```
addons/
├── french_accounting/       # Module comptabilité française
├── cabinet_portal/          # Portail cabinet comptable
├── client_portal/           # Portail client
└── integrations/            # Connecteurs externes
```

### Créer un nouveau module

```bash
./scripts/create-module.sh nom_du_module
```

### Tests

```bash
# Lancer tous les tests
docker-compose run --rm odoo odoo -u all -d test --test-enable --stop-after-init

# Tests d'un module spécifique
docker-compose run --rm odoo odoo -u french_accounting --test-enable --stop-after-init
```

## 🔒 Sécurité & Conformité

- ✅ Conformité RGPD
- ✅ Authentification sécurisée (OAuth2)
- ✅ Chiffrement des données sensibles
- ✅ Sauvegardes automatiques quotidiennes
- ✅ Logs d'audit complets
- ✅ Conformité FEC (Fichier des Écritures Comptables)

## 📊 Monitoring & Performance

- Prometheus + Grafana pour le monitoring
- ELK Stack pour les logs
- Sentry pour le suivi des erreurs
- Uptime monitoring avec StatusCake

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de consulter notre [guide de contribution](CONTRIBUTING.md).

## 📝 Licence

Ce projet est sous licence AGPL-3.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- 📧 Email : support@iseb-accounting.fr
- 💬 Chat : https://chat.iseb-accounting.fr
- 📚 Documentation : https://docs.iseb-accounting.fr
- 🐛 Issues : https://github.com/votre-org/iseb-accounting-saas/issues

## 🗺️ Roadmap

### Phase 1 - MVP (Q2 2025)
- [x] Infrastructure Docker
- [x] Module comptabilité française de base
- [ ] Portail client simplifié
- [ ] Synchronisation bancaire (1 fournisseur)

### Phase 2 - Production (Q3 2025)
- [ ] Portail cabinet complet
- [ ] Déclarations TVA automatisées
- [ ] Intégration paie (PayFit)
- [ ] Application mobile (notes de frais)

### Phase 3 - Scale (Q4 2025)
- [ ] Facturation électronique 2026
- [ ] IA pour catégorisation automatique
- [ ] Reporting analytique avancé
- [ ] API publique pour partenaires

## 👥 Équipe

Développé avec ❤️ par l'équipe ISEB

---

**⚠️ Note** : Ce projet est en cours de développement actif. La version production est prévue pour Q3 2025.