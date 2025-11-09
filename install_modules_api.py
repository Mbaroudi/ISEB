#!/usr/bin/env python3
"""
ISEB Module Installer via Odoo XML-RPC API

This script installs ISEB modules using Odoo's external API,
which is more reliable than docker-compose run commands.
"""

import xmlrpc.client
import time
import sys

# Configuration
ODOO_URL = 'http://localhost:8069'
DB_NAME = 'iseb_prod'
USERNAME = 'admin'
PASSWORD = 'admin'

# Modules to install in order
MODULES = [
    ('french_accounting', 'Comptabilité Française'),
    ('website', 'Website (requis pour client_portal frontend assets)'),  # Dependency for client_portal
    ('client_portal', 'Portail Client'),
    ('cabinet_portal', 'Portail Cabinet'),
    ('bank_sync', 'Synchronisation Bancaire'),
    ('e_invoicing', 'Facturation Électronique'),
    ('reporting', 'Rapports Personnalisés'),
]


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_step(step, total, text):
    """Print formatted step"""
    print(f"\n[{step}/{total}] {text}")


def connect_to_odoo():
    """Connect to Odoo and authenticate"""
    print_header("Connecting to Odoo")
    
    try:
        # Connect to common endpoint
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        
        # Get version
        version_info = common.version()
        print(f"✓ Connected to Odoo {version_info['server_version']}")
        
        # Authenticate
        uid = common.authenticate(DB_NAME, USERNAME, PASSWORD, {})
        if not uid:
            print("✗ Authentication failed")
            print(f"  Database: {DB_NAME}")
            print(f"  Username: {USERNAME}")
            sys.exit(1)
        
        print(f"✓ Authenticated as user ID {uid}")
        
        # Connect to object endpoint
        models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
        
        return uid, models
    
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        print("\nMake sure:")
        print("  - Odoo is running: docker-compose ps")
        print("  - Database exists: iseb_prod")
        print("  - Credentials are correct")
        sys.exit(1)


def get_module_state(models, uid, module_name):
    """Get the current state of a module"""
    try:
        module_ids = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'search',
            [[('name', '=', module_name)]]
        )
        
        if not module_ids:
            return 'not_found'
        
        module_data = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'read',
            [module_ids, ['state']]
        )
        
        return module_data[0]['state']
    
    except Exception as e:
        print(f"  Warning: Could not check module state: {e}")
        return 'unknown'


def update_module_list(models, uid):
    """Update the list of available modules"""
    print("\n→ Updating module list...")
    
    try:
        models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'update_list',
            [[]]
        )
        print("  ✓ Module list updated")
        time.sleep(2)
        return True
    
    except Exception as e:
        print(f"  ✗ Failed to update module list: {e}")
        return False


def install_module(models, uid, module_name, display_name, step, total):
    """Install a single module"""
    print_step(step, total, f"Installing {display_name}")
    
    # Check current state
    state = get_module_state(models, uid, module_name)
    print(f"  Current state: {state}")
    
    if state == 'installed':
        print(f"  ✓ Already installed")
        return True
    
    if state == 'not_found':
        print(f"  ✗ Module not found in database")
        print(f"    Try updating module list or check module name")
        return False
    
    try:
        # Find module ID
        module_ids = models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'search',
            [[('name', '=', module_name)]]
        )
        
        if not module_ids:
            print(f"  ✗ Module {module_name} not found")
            return False
        
        module_id = module_ids[0]
        print(f"  Module ID: {module_id}")
        
        # Install module using button_immediate_install
        print(f"  → Installing...")
        models.execute_kw(
            DB_NAME, uid, PASSWORD,
            'ir.module.module', 'button_immediate_install',
            [[module_id]]
        )
        
        # Wait for installation
        print(f"  → Waiting for installation to complete...")
        max_wait = 300  # 5 minutes max for complex modules
        waited = 0
        
        while waited < max_wait:
            time.sleep(5)
            waited += 5
            
            state = get_module_state(models, uid, module_name)
            
            if state == 'installed':
                print(f"  ✓ Installed successfully ({waited}s)")
                return True
            elif state == 'to install' or state == 'to upgrade':
                print(f"  ... still installing ({waited}s)")
            else:
                print(f"  Current state: {state}")
        
        print(f"  ✗ Installation timeout after {max_wait}s")
        return False
    
    except Exception as e:
        print(f"  ✗ Installation failed: {e}")
        return False


def verify_installation(models, uid):
    """Verify all modules are installed"""
    print_header("Verifying Installation")
    
    all_installed = True
    
    for module_name, display_name in MODULES:
        state = get_module_state(models, uid, module_name)
        status = "✓" if state == 'installed' else "✗"
        print(f"{status} {display_name:30} [{state}]")
        
        if state != 'installed':
            all_installed = False
    
    return all_installed


def main():
    """Main installation process"""
    print_header("ISEB Module Installer")
    print(f"URL: {ODOO_URL}")
    print(f"Database: {DB_NAME}")
    print(f"Modules: {len(MODULES)}")
    
    # Connect to Odoo
    uid, models = connect_to_odoo()
    
    # Update module list
    if not update_module_list(models, uid):
        print("\nWarning: Could not update module list")
        print("Continuing with installation anyway...")
    
    # Install modules
    print_header("Installing Modules")
    
    failed_modules = []
    
    for i, (module_name, display_name) in enumerate(MODULES, 1):
        success = install_module(models, uid, module_name, display_name, i, len(MODULES))
        
        if not success:
            failed_modules.append((module_name, display_name))
        
        # Wait between installations
        if i < len(MODULES):
            time.sleep(3)
    
    # Verify installation
    all_installed = verify_installation(models, uid)
    
    # Print summary
    print_header("Installation Summary")
    
    if all_installed:
        print("\n✓ SUCCESS! All modules installed successfully")
        print("\nNext steps:")
        print("  1. Access Odoo: http://localhost:8069")
        print("  2. Login with: admin / admin")
        print("  3. Configure company settings")
        print("  4. Create test client")
        print("\nSee INSTALLATION_GUIDE.md for detailed configuration steps.")
        sys.exit(0)
    else:
        print("\n✗ PARTIAL SUCCESS - Some modules failed to install")
        print("\nFailed modules:")
        for module_name, display_name in failed_modules:
            print(f"  - {display_name} ({module_name})")
        
        print("\nTroubleshooting:")
        print("  1. Check Odoo logs: docker-compose logs odoo --tail 100")
        print("  2. Validate module: python validate_modules.py --module <name>")
        print("  3. Try manual installation via web interface")
        print("\nSee INSTALLATION_GUIDE.md for more help.")
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInstallation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
