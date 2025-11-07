#!/usr/bin/env python3
"""
Wait for PostgreSQL to be ready before starting Odoo
"""

import os
import sys
import time
import psycopg2
from psycopg2 import OperationalError

# Configuration depuis les variables d'environnement
DB_HOST = os.environ.get('HOST', 'postgres')
DB_PORT = int(os.environ.get('PORT', 5432))
DB_USER = os.environ.get('USER', 'odoo')
DB_PASSWORD = os.environ.get('PASSWORD', 'odoo')
DB_NAME = os.environ.get('DATABASE', 'postgres')  # Utiliser 'postgres' pour le test de connexion

TIMEOUT = 60  # Timeout en secondes
RETRY_INTERVAL = 1  # Intervalle entre les tentatives en secondes


def log(message):
    """Logger avec timestamp"""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)


def wait_for_postgres():
    """
    Attendre que PostgreSQL soit prêt à accepter des connexions
    """
    log(f"Waiting for PostgreSQL at {DB_HOST}:{DB_PORT}...")
    log(f"Database: {DB_NAME}, User: {DB_USER}")

    start_time = time.time()
    attempt = 0

    while True:
        attempt += 1
        elapsed_time = time.time() - start_time

        # Vérifier le timeout
        if elapsed_time > TIMEOUT:
            log(f"ERROR: Timeout after {TIMEOUT} seconds waiting for PostgreSQL")
            sys.exit(1)

        try:
            # Tentative de connexion
            log(f"Connection attempt {attempt} (elapsed: {int(elapsed_time)}s / {TIMEOUT}s)...")

            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                connect_timeout=5
            )

            # Test de la connexion avec une requête simple
            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            cursor.close()
            conn.close()

            log("PostgreSQL is ready! Connection successful.")
            return True

        except OperationalError as e:
            log(f"PostgreSQL not ready yet: {str(e)}")
            log(f"Retrying in {RETRY_INTERVAL} second(s)...")
            time.sleep(RETRY_INTERVAL)

        except Exception as e:
            log(f"Unexpected error while connecting to PostgreSQL: {str(e)}")
            log(f"Retrying in {RETRY_INTERVAL} second(s)...")
            time.sleep(RETRY_INTERVAL)


if __name__ == "__main__":
    try:
        wait_for_postgres()
        sys.exit(0)
    except KeyboardInterrupt:
        log("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        log(f"Fatal error: {str(e)}")
        sys.exit(1)
