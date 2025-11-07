# =€ Démarrage Rapide - ISEB

## Installation en 5 minutes

### 1. Prérequis
```bash
Docker >= 20.10
Docker Compose >= 2.0
```

### 2. Clone et configuration
```bash
git clone https://github.com/votre-org/iseb-accounting-saas.git
cd iseb-accounting-saas
cd docker && cp .env.example .env
nano .env  # Éditer les mots de passe
```

### 3. Démarrage
```bash
chmod +x scripts/*.sh
./scripts/start.sh
```

### 4. Accès
- **Application** : http://localhost:8069
- **Identifiants** : admin / admin

### 5. Prochaines étapes
1. Changer le mot de passe admin
2. Créer votre première entreprise
3. Installer le module "French Accounting ISEB"
4. Consulter la [documentation complète](docs/)

## Scripts utiles
```bash
./scripts/start.sh    # Démarrer
./scripts/stop.sh     # Arrêter
docker-compose logs -f odoo  # Logs
```

## Documentation
- [README complet](README.md)
- [Cahier des charges](docs/cahier-des-charges.md)
- [Architecture technique](docs/architecture/)
- [Guide de déploiement](docs/deployment/)

## Support
- =ç support@iseb-accounting.fr
- =Ú [Documentation](docs/)
- = [Issues](https://github.com/votre-org/iseb-accounting-saas/issues)
