#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test automatique pour les modules ISEB
Vérifie l'installation et le bon fonctionnement des modules:
- french_accounting
- client_portal
- cabinet_portal
"""

import sys
import os
import xmlrpc.client
from datetime import datetime

# Configuration
ODOO_URL = os.environ.get('ODOO_URL', 'http://localhost:8069')
DB_NAME = os.environ.get('ODOO_DB', 'iseb')
USERNAME = os.environ.get('ODOO_USER', 'admin')
PASSWORD = os.environ.get('ODOO_PASSWORD', 'admin')

# Couleurs pour output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.ENDC}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg.center(60)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}\n")

class OdooTester:
    def __init__(self, url, db, username, password):
        self.url = url
        self.db = db
        self.username = username
        self.password = password
        self.uid = None
        self.models = None
        self.errors = []
        self.warnings = []
        
    def connect(self):
        """Se connecte à Odoo"""
        print_header("CONNEXION À ODOO")
        print_info(f"URL: {self.url}")
        print_info(f"Base de données: {self.db}")
        print_info(f"Utilisateur: {self.username}")
        
        try:
            common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.uid = common.authenticate(self.db, self.username, self.password, {})
            
            if not self.uid:
                print_error("Échec d'authentification")
                return False
            
            self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
            print_success(f"Connecté en tant que UID: {self.uid}")
            return True
            
        except Exception as e:
            print_error(f"Erreur de connexion: {str(e)}")
            return False
    
    def test_module_installed(self, module_name):
        """Vérifie qu'un module est installé"""
        try:
            module_ids = self.models.execute_kw(
                self.db, self.uid, self.password,
                'ir.module.module', 'search',
                [[('name', '=', module_name), ('state', '=', 'installed')]]
            )
            
            if module_ids:
                print_success(f"Module '{module_name}' installé")
                return True
            else:
                print_warning(f"Module '{module_name}' non installé")
                self.warnings.append(f"Module {module_name} non installé")
                return False
                
        except Exception as e:
            print_error(f"Erreur lors de la vérification du module '{module_name}': {str(e)}")
            self.errors.append(f"Module {module_name}: {str(e)}")
            return False
    
    def test_model_exists(self, model_name):
        """Vérifie qu'un modèle existe"""
        try:
            model_ids = self.models.execute_kw(
                self.db, self.uid, self.password,
                'ir.model', 'search',
                [[('model', '=', model_name)]]
            )
            
            if model_ids:
                print_success(f"Modèle '{model_name}' existe")
                return True
            else:
                print_error(f"Modèle '{model_name}' introuvable")
                self.errors.append(f"Modèle {model_name} introuvable")
                return False
                
        except Exception as e:
            print_error(f"Erreur lors de la vérification du modèle '{model_name}': {str(e)}")
            self.errors.append(f"Modèle {model_name}: {str(e)}")
            return False
    
    def test_model_access(self, model_name, operation='read'):
        """Teste l'accès à un modèle"""
        try:
            # Essaie de compter les enregistrements
            count = self.models.execute_kw(
                self.db, self.uid, self.password,
                model_name, 'search_count',
                [[]]
            )
            
            print_success(f"Accès {operation} au modèle '{model_name}' OK ({count} enreg.)")
            return True
            
        except Exception as e:
            print_error(f"Erreur d'accès au modèle '{model_name}': {str(e)}")
            self.errors.append(f"Accès {model_name}: {str(e)}")
            return False
    
    def test_demo_data(self, model_name, expected_min=1):
        """Vérifie que les données de démo sont présentes"""
        try:
            count = self.models.execute_kw(
                self.db, self.uid, self.password,
                model_name, 'search_count',
                [[]]
            )
            
            if count >= expected_min:
                print_success(f"Données de démo présentes pour '{model_name}' ({count} enreg.)")
                return True
            else:
                print_warning(f"Peu de données de démo pour '{model_name}' ({count} enreg., attendu: {expected_min}+)")
                self.warnings.append(f"Peu de données de démo: {model_name}")
                return False
                
        except Exception as e:
            print_error(f"Erreur lors de la vérification des données de démo '{model_name}': {str(e)}")
            self.errors.append(f"Données démo {model_name}: {str(e)}")
            return False
    
    def test_field_exists(self, model_name, field_name):
        """Vérifie qu'un champ existe sur un modèle"""
        try:
            fields = self.models.execute_kw(
                self.db, self.uid, self.password,
                model_name, 'fields_get',
                [[field_name]]
            )
            
            if field_name in fields:
                print_success(f"Champ '{field_name}' existe sur '{model_name}'")
                return True
            else:
                print_error(f"Champ '{field_name}' introuvable sur '{model_name}'")
                self.errors.append(f"Champ {model_name}.{field_name} introuvable")
                return False
                
        except Exception as e:
            print_error(f"Erreur lors de la vérification du champ '{model_name}.{field_name}': {str(e)}")
            self.errors.append(f"Champ {model_name}.{field_name}: {str(e)}")
            return False
    
    def test_french_accounting(self):
        """Tests spécifiques au module french_accounting"""
        print_header("TESTS MODULE FRENCH_ACCOUNTING")
        
        # Test module installé
        self.test_module_installed('french_accounting')
        
        # Test modèles
        models = [
            'fec.export',
            'tva.declaration',
            'liasse.fiscale',
        ]
        
        for model in models:
            self.test_model_exists(model)
            self.test_model_access(model)
        
        # Test données de démo
        self.test_demo_data('tva.declaration', 2)
        self.test_demo_data('fec.export', 1)
        
        # Test champs spécifiques
        self.test_field_exists('account.move', 'fec_export_date')
        self.test_field_exists('account.move', 'fec_match_hash')
    
    def test_client_portal(self):
        """Tests spécifiques au module client_portal"""
        print_header("TESTS MODULE CLIENT_PORTAL")
        
        # Test module installé
        self.test_module_installed('client_portal')
        
        # Test modèles
        models = [
            'client.dashboard',
            'client.document',
            'expense.note',
        ]
        
        for model in models:
            self.test_model_exists(model)
            self.test_model_access(model)
        
        # Test données de démo
        self.test_demo_data('client.dashboard', 3)
        self.test_demo_data('client.document', 3)
        self.test_demo_data('expense.note', 5)
        
        # Test champs spécifiques sur res.partner
        self.test_field_exists('res.partner', 'is_iseb_client')
        self.test_field_exists('res.partner', 'dashboard_ids')
    
    def test_cabinet_portal(self):
        """Tests spécifiques au module cabinet_portal"""
        print_header("TESTS MODULE CABINET_PORTAL")
        
        # Test module installé
        self.test_module_installed('cabinet_portal')
        
        # Test modèles
        models = [
            'cabinet.task',
            'cabinet.dashboard',
        ]
        
        for model in models:
            self.test_model_exists(model)
            self.test_model_access(model)
        
        # Test données de démo
        self.test_demo_data('cabinet.task', 5)
        self.test_demo_data('cabinet.dashboard', 1)
        
        # Test champs spécifiques sur res.partner
        self.test_field_exists('res.partner', 'cabinet_id')
        self.test_field_exists('res.partner', 'accountant_id')
        self.test_field_exists('res.partner', 'health_score')
    
    def run_all_tests(self):
        """Exécute tous les tests"""
        print(f"\n{Colors.BOLD}TESTS AUTOMATIQUES MODULES ISEB{Colors.ENDC}")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        if not self.connect():
            return False
        
        # Tests des modules
        self.test_french_accounting()
        self.test_client_portal()
        self.test_cabinet_portal()
        
        # Résumé
        self.print_summary()
        
        return len(self.errors) == 0
    
    def print_summary(self):
        """Affiche le résumé des tests"""
        print_header("RÉSUMÉ DES TESTS")
        
        total_errors = len(self.errors)
        total_warnings = len(self.warnings)
        
        if total_errors == 0 and total_warnings == 0:
            print(f"{Colors.GREEN}{Colors.BOLD}✓ TOUS LES TESTS RÉUSSIS{Colors.ENDC}")
        else:
            if total_errors > 0:
                print(f"{Colors.RED}{Colors.BOLD}✗ {total_errors} ERREUR(S){Colors.ENDC}")
                for error in self.errors:
                    print(f"  {Colors.RED}• {error}{Colors.ENDC}")
            
            if total_warnings > 0:
                print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠ {total_warnings} AVERTISSEMENT(S){Colors.ENDC}")
                for warning in self.warnings:
                    print(f"  {Colors.YELLOW}• {warning}{Colors.ENDC}")
        
        print()

def main():
    """Fonction principale"""
    tester = OdooTester(ODOO_URL, DB_NAME, USERNAME, PASSWORD)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
