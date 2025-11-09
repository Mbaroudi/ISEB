#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diagnostic script for 403 FORBIDDEN error on Odoo login
"""

import subprocess
import sys
import re

def run_command(cmd):
    """Execute a shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

def check_docker_containers():
    """Check Docker container status"""
    print("\n" + "="*70)
    print("  ÉTAPE 1: VÉRIFICATION DES CONTENEURS DOCKER")
    print("="*70)

    code, stdout, stderr = run_command("docker compose ps")
    if code != 0:
        print(f"❌ Erreur Docker: {stderr}")
        return False

    print(stdout)

    # Check if odoo is running
    if "iseb_odoo" in stdout and "Up" in stdout:
        print("✅ Conteneur Odoo est en cours d'exécution")

        # Check if healthy
        if "healthy" in stdout:
            print("✅ Conteneur Odoo est sain (healthy)")
        else:
            print("⚠️  Conteneur Odoo n'est pas encore healthy")
        return True
    else:
        print("❌ Conteneur Odoo n'est pas en cours d'exécution")
        return False

def check_database():
    """Check PostgreSQL database"""
    print("\n" + "="*70)
    print("  ÉTAPE 2: VÉRIFICATION DE LA BASE DE DONNÉES")
    print("="*70)

    # List databases
    cmd = "docker compose exec -T db psql -U odoo -c '\\l' 2>&1"
    code, stdout, stderr = run_command(cmd)

    if code != 0:
        print(f"❌ Impossible de se connecter à PostgreSQL: {stderr}")
        return None

    print(stdout)

    # Extract database names
    databases = []
    for line in stdout.split('\n'):
        # Look for lines with database info
        if '|' in line and 'odoo' in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) > 0 and parts[0] and parts[0] not in ['Name', '---']:
                databases.append(parts[0])

    print(f"\n📊 Bases de données trouvées: {databases}")

    # Check for iseb_prod specifically
    if 'iseb_prod' in databases:
        print("✅ Base de données 'iseb_prod' existe")
        return 'iseb_prod'
    else:
        print("❌ Base de données 'iseb_prod' n'existe PAS")
        print("⚠️  Le fichier config/odoo.conf exige 'iseb_prod' (dbfilter = ^iseb_prod$)")
        return databases[0] if databases else None

def check_odoo_logs():
    """Check recent Odoo logs for errors"""
    print("\n" + "="*70)
    print("  ÉTAPE 3: VÉRIFICATION DES LOGS ODOO")
    print("="*70)

    cmd = "docker compose logs --tail=50 odoo 2>&1"
    code, stdout, stderr = run_command(cmd)

    if code != 0:
        print(f"❌ Impossible de récupérer les logs: {stderr}")
        return

    # Look for specific errors
    errors = {
        'database': False,
        'forbidden': False,
        'permission': False,
        'static': False
    }

    for line in stdout.split('\n'):
        lower_line = line.lower()
        if 'database' in lower_line and ('not found' in lower_line or 'does not exist' in lower_line):
            errors['database'] = True
        if '403' in line or 'forbidden' in lower_line:
            errors['forbidden'] = True
        if 'permission denied' in lower_line:
            errors['permission'] = True
        if 'static' in lower_line and 'error' in lower_line:
            errors['static'] = True

    print("\n🔍 Analyse des logs:")
    for error_type, found in errors.items():
        status = "❌ TROUVÉ" if found else "✅ OK"
        print(f"  {status}: {error_type}")

    # Show last few lines
    print("\n📝 Dernières lignes de log:")
    print("-" * 70)
    lines = stdout.split('\n')
    for line in lines[-20:]:
        print(line)

def check_config():
    """Check Odoo configuration"""
    print("\n" + "="*70)
    print("  ÉTAPE 4: VÉRIFICATION DE LA CONFIGURATION")
    print("="*70)

    try:
        with open('config/odoo.conf', 'r') as f:
            content = f.read()

        # Check dbfilter
        dbfilter_match = re.search(r'dbfilter\s*=\s*(.+)', content)
        if dbfilter_match:
            dbfilter = dbfilter_match.group(1).strip()
            print(f"📌 dbfilter configuré: {dbfilter}")
            if dbfilter == '^iseb_prod$':
                print("⚠️  Configuration stricte: seule la base 'iseb_prod' est autorisée")

        # Check list_db
        list_db_match = re.search(r'list_db\s*=\s*(.+)', content)
        if list_db_match:
            list_db = list_db_match.group(1).strip()
            print(f"📌 list_db: {list_db}")
            if list_db == 'False':
                print("⚠️  Le listing des bases est désactivé (list_db = False)")

        # Check workers
        workers_match = re.search(r'workers\s*=\s*(\d+)', content)
        if workers_match:
            workers = workers_match.group(1)
            print(f"📌 workers: {workers}")
            if int(workers) > 0:
                print("ℹ️  Mode multi-workers activé")

    except Exception as e:
        print(f"❌ Erreur lors de la lecture de config/odoo.conf: {e}")

def provide_solutions(db_name):
    """Provide solutions based on findings"""
    print("\n" + "="*70)
    print("  SOLUTIONS PROPOSÉES")
    print("="*70)

    if db_name != 'iseb_prod':
        print("\n🔧 SOLUTION 1: Créer la base de données 'iseb_prod'")
        print("-" * 70)
        print("docker compose exec -T db createdb -U odoo iseb_prod")
        print("\nPuis redémarrer Odoo:")
        print("docker compose restart odoo")

        print("\n🔧 SOLUTION 2: Modifier le filtre de base de données")
        print("-" * 70)
        print("Éditez config/odoo.conf et changez:")
        print(f"  dbfilter = ^iseb_prod$")
        print("En:")
        if db_name:
            print(f"  dbfilter = ^{db_name}$")
        else:
            print("  ; dbfilter = ^iseb_prod$  # Commenté pour permettre toutes les bases")
        print("\nPuis redémarrer Odoo:")
        print("docker compose restart odoo")

    print("\n🔧 SOLUTION 3: Vérifier l'accès au port 8069")
    print("-" * 70)
    print("Testez l'accès:")
    print("curl -I http://localhost:8069")

    print("\n🔧 SOLUTION 4: Nettoyer et redémarrer")
    print("-" * 70)
    print("docker compose down")
    print("docker compose up -d")
    print("docker compose logs -f odoo")

def main():
    """Main diagnostic function"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*10 + "DIAGNOSTIC 403 FORBIDDEN - ODOO LOGIN" + " "*20 + "║")
    print("╚" + "="*68 + "╝")

    # Step 1: Check Docker
    docker_ok = check_docker_containers()

    if not docker_ok:
        print("\n❌ Docker n'est pas en cours d'exécution. Démarrez-le avec:")
        print("   docker compose up -d")
        sys.exit(1)

    # Step 2: Check database
    db_name = check_database()

    # Step 3: Check logs
    check_odoo_logs()

    # Step 4: Check config
    check_config()

    # Step 5: Provide solutions
    provide_solutions(db_name)

    print("\n" + "="*70)
    print("  DIAGNOSTIC TERMINÉ")
    print("="*70)
    print("\n")

if __name__ == "__main__":
    main()
