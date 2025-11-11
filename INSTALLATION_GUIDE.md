# ISEB Platform - Installation Guide

## Current Status

✓ **Odoo is running**: http://localhost:8069  
✓ **Database exists**: iseb_db  
✓ **All modules validated**: Ready to install  
✓ **All code issues fixed**: No validation errors  

---

## Installation Steps

### Step 1: Access Odoo Web Interface

Open your browser and navigate to:
```
http://localhost:8069
```

Login with:
- **Email**: admin
- **Password**: admin
- **Database**: iseb_db

### Step 2: Access Apps Menu

1. Click on the **Apps** icon in the top menu (grid icon)
2. Remove the "Apps" filter to see all modules
3. Click the **search icon** and search for each ISEB module

### Step 3: Install Modules in Order

Install the following modules **in this exact order**:

#### 1. French Accounting (Base Module)
```
Search: "french_accounting" or "Comptabilité Française"
Click: Install
Wait: ~10 seconds
```
This is the foundation module with French compliance features.

#### 2. Client Portal
```
Search: "client_portal" or "Portail Client"
Click: Install
Wait: ~15 seconds
```
Provides web interface for clients to access their accounting data.

#### 3. Cabinet Portal
```
Search: "cabinet_portal" or "Portail Cabinet"
Click: Install
Wait: ~10 seconds
```
Accountant dashboard for managing multiple clients.

#### 4. Bank Sync
```
Search: "bank_sync" or "Synchronisation Bancaire"
Click: Install
Wait: ~15 seconds
```
Automatic bank statement import and reconciliation.

#### 5. E-Invoicing
```
Search: "e_invoicing" or "Facturation Électronique"
Click: Install
Wait: ~10 seconds
```
Electronic invoicing with Chorus Pro integration.

#### 6. Reporting
```
Search: "reporting" or "Rapports Personnalisés"
Click: Install
Wait: ~10 seconds
```
Custom financial reports and analytics.

---

## Alternative: Command Line Installation

If the web interface doesn't work, try installing one module at a time:

### Method 1: Using docker exec

```bash
# Install french_accounting
docker-compose exec odoo odoo -d iseb_db -i french_accounting --stop-after-init

# Restart Odoo
docker-compose restart odoo
sleep 10

# Install client_portal
docker-compose exec odoo odoo -d iseb_db -i client_portal --stop-after-init

# Restart Odoo
docker-compose restart odoo
sleep 10

# Install cabinet_portal
docker-compose exec odoo odoo -d iseb_db -i cabinet_portal --stop-after-init

# Restart Odoo
docker-compose restart odoo
sleep 10

# Install bank_sync
docker-compose exec odoo odoo -d iseb_db -i bank_sync --stop-after-init

# Restart Odoo
docker-compose restart odoo
sleep 10

# Install e_invoicing
docker-compose exec odoo odoo -d iseb_db -i e_invoicing --stop-after-init

# Restart Odoo
docker-compose restart odoo
sleep 10

# Install reporting
docker-compose exec odoo odoo -d iseb_db -i reporting --stop-after-init

# Restart Odoo
docker-compose restart odoo
```

### Method 2: Using Python Script

I can create a Python script that uses Odoo's RPC API to install modules through the web interface programmatically.

---

## Verification

After installation, verify each module:

### Check in Web Interface

1. Go to **Apps** menu
2. Search for each module name
3. Should show green checkmark ✓ with "Installed" status

### Check in Database

```bash
docker-compose exec db psql -U odoo -d iseb_db -c \
  "SELECT name, state FROM ir_module_module WHERE name IN ('client_portal', 'french_accounting', 'cabinet_portal', 'bank_sync', 'e_invoicing', 'reporting') ORDER BY name;"
```

Expected output:
```
        name        |  state    
--------------------+-----------
 bank_sync          | installed
 cabinet_portal     | installed
 client_portal      | installed
 e_invoicing        | installed
 french_accounting  | installed
 reporting          | installed
```

---

## Post-Installation Configuration

### 1. Configure Company Settings

**Settings → General Settings → Companies**

- Company Name: Your accounting firm name
- Country: France 🇫🇷
- Currency: EUR (€)
- Language: French
- Tax ID: Your French SIREN/SIRET

### 2. Configure French Accounting

**Accounting → Configuration → Settings**

- ✓ Enable "French Accounting"
- ✓ Enable "FEC Export"
- ✓ Configure Chart of Accounts: "France - Plan Comptable Général"

### 3. Configure Journals

**Accounting → Configuration → Journals**

Make sure all journal codes are **exactly 3 characters**:
- VEN (Sales)
- ACH (Purchases)
- BNQ (Bank)
- CAI (Cash)
- OPE (Operations)

### 4. Configure TVA Rates

**Accounting → Configuration → Taxes**

Create standard French TVA rates:
- 20% - Standard rate
- 10% - Reduced rate
- 5.5% - Super-reduced rate
- 2.1% - Special rate

### 5. Create Test Client

**Contacts → Create**

- Name: "Test Client SAS"
- ✓ Check: "Is a Company"
- ✓ Check: "Is ISEB Client" (custom field)
- Country: France
- Email: test@client.example.com

### 6. Create Portal User

**Settings → Users & Companies → Users → Create**

- Name: Test Client User
- Email: client@example.com
- Access Rights: Portal
- Partner: Link to "Test Client SAS"

---

## Testing

### Test Client Portal

1. Open http://localhost:8069 in **incognito/private window**
2. Login as: client@example.com / password
3. Should see:
   - Dashboard with financial metrics
   - Documents section
   - Expense notes section

### Test Document Upload

1. As client user, go to **Documents**
2. Click **Upload**
3. Select a PDF invoice
4. Should process and appear in list

### Test Expense Note

1. As client user, go to **Expense Notes**
2. Click **Create**
3. Fill in details and attach receipt photo
4. Submit for approval
5. Should appear in accountant's dashboard

### Test FEC Export

1. As admin, go to **Accounting → Reporting → FEC Export**
2. Select date range
3. Click **Generate**
4. Should download .txt file in FEC format

---

## Troubleshooting

### Module Not Found

**Symptom**: Can't find module in Apps menu

**Solution**:
1. Go to **Apps** menu
2. Click **Update Apps List** in the top menu
3. Wait 30 seconds
4. Search again

### Installation Failed

**Symptom**: Error during module installation

**Solution**:
```bash
# Check logs
docker-compose logs odoo --tail 100

# Run validator
python validate_modules.py --module <module_name> --verbose

# Restart Odoo
docker-compose restart odoo
```

### Journal Code Error

**Symptom**: "Le code du journal ne doit pas dépasser 3 caractères"

**Solution**:
1. Go to **Accounting → Configuration → Journals**
2. Edit each journal
3. Change code to exactly 3 characters (e.g., "VENTE" → "VEN")

### Portal Not Accessible

**Symptom**: Client can't access portal

**Solution**:
1. Check user has "Portal" access rights
2. Verify partner is marked as "is_iseb_client = True"
3. Check user email is correct
4. Send password reset email

---

## Quick Reference

### Container Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose stop

# Restart Odoo only
docker-compose restart odoo

# View logs
docker-compose logs -f odoo

# Access Odoo shell
docker-compose exec odoo python3 -c "import odoo; print(odoo.__version__)"
```

### Database Management

```bash
# Backup database
docker-compose exec db pg_dump -U odoo iseb_db > backup.sql

# Restore database
docker-compose exec -T db psql -U odoo iseb_db < backup.sql

# Reset database (WARNING: Deletes all data)
docker-compose exec db dropdb -U odoo iseb_db
docker-compose exec db createdb -U odoo iseb_db
docker-compose restart odoo
```

### Module Management

```bash
# List installed modules
docker-compose exec db psql -U odoo -d iseb_db -c \
  "SELECT name, state FROM ir_module_module WHERE state='installed';"

# Update module
docker-compose exec odoo odoo -d iseb_db -u <module_name> --stop-after-init
docker-compose restart odoo

# Uninstall module
docker-compose exec odoo odoo -d iseb_db -u <module_name> --stop-after-init
docker-compose restart odoo
```

---

## Support Resources

### Documentation

- **DEPLOYMENT_SUCCESS.md** - Complete deployment guide
- **VALIDATOR_README.md** - Module validation guide
- **VALIDATION_REPORT.md** - Detailed issue analysis

### Validation

```bash
# Validate all modules before installation
python validate_modules.py

# Validate specific module with details
python validate_modules.py --module client_portal --verbose
```

### Logs

```bash
# Odoo application logs
docker-compose logs odoo

# Database logs
docker-compose logs db

# All logs
docker-compose logs
```

---

## Next Steps After Installation

1. **Configure Company** - Set up French company details
2. **Create Clients** - Add client companies and portal users  
3. **Configure Journals** - Ensure 3-character codes
4. **Set Up TVA** - Create French tax rates
5. **Test Workflows** - Try document upload, expense submission
6. **Generate FEC** - Test compliance export
7. **Train Users** - Show accountants and clients how to use portal

---

## Success Criteria

✓ All 6 modules show "Installed" status  
✓ Client portal accessible at /my/dashboard  
✓ Document upload works with OCR  
✓ Expense notes can be submitted  
✓ FEC export generates valid file  
✓ French accounting rules enforced  

---

*Last Updated: 2025-11-08*  
*Platform: ISEB - Odoo 17.0*
