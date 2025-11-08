# ISEB Platform - Quick Start Guide

## 🚀 Current Status
✅ All containers running and healthy
✅ All code issues fixed
✅ Ready for module installation

## 📍 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Admin Backend** | http://localhost:8069 | admin / (your password) |
| **Client Portal** | http://localhost:8069/my | (portal user) |
| **Health Check** | http://localhost:8069/web/health | - |

## 📦 ISEB Modules

### Installation Order (IMPORTANT!)

1. **Base Odoo Accounting** (first!)
   - Accounting
   - Invoicing

2. **French Localization** (second!)
   - France - Accounting (includes PCG, TVA)

3. **ISEB Custom Modules** (in this order):
   - `french_accounting` - FEC export, TVA declarations
   - `client_portal` - Client web interface
   - `reporting` - Custom financial reports
   - `e_invoicing` - Factur-X, Chorus Pro
   - `bank_sync` - Bank synchronization
   - `cabinet_portal` - Accounting firm portal

## 🔧 Installation Steps

### Step 1: Access Odoo
```bash
# Open browser
open http://localhost:8069
```

### Step 2: Install Base Modules
1. Go to **Apps**
2. Search **"Accounting"** → Click **Install**
3. Wait for installation to complete

### Step 3: Install French Localization
1. **Apps** → Remove **"Apps"** filter (top left)
2. Search **"France - Accounting"**
3. Click **Install**
4. This installs:
   - French Chart of Accounts (PCG)
   - French Tax Rules (TVA 20%, 10%, 5.5%, 2.1%)
   - FEC compliance

### Step 4: Configure Company
1. **Settings** → **General Settings** → **Companies**
2. Edit your company:
   - **Country**: France
   - **Currency**: EUR (€)
   - **Language**: French

### Step 5: Install ISEB Modules
1. **Apps** → Remove **"Apps"** filter
2. Click **"Update Apps List"** (⟳ icon, top right)
3. Install in order:

```
french_accounting    → FEC Export, TVA Declarations
client_portal        → Client Interface
reporting            → Custom Reports
e_invoicing          → Electronic Invoicing
bank_sync            → Bank Synchronization
cabinet_portal       → Cabinet Management
```

## 👥 Create Test Users

### Admin User (Already exists)
- Username: `admin`
- Access: Full backend access

### Portal User (Create new)
1. **Settings** → **Users & Companies** → **Users**
2. Click **Create**
3. Fill in:
   - **Name**: Test Client
   - **Email**: client@test.com
   - **Access Rights**: Portal
4. Link to Partner (create if needed)
5. Set password: `test123` (or your choice)
6. Click **Save**

## 🧪 Test the Platform

### Test Client Portal
1. Open incognito/private window
2. Go to: http://localhost:8069/my
3. Login with portal user credentials
4. You should see:
   - Dashboard with financial indicators
   - Document upload area
   - Expense notes
   - Reports

### Test Document Upload
1. As portal user, go to **Documents**
2. Click **Upload**
3. Select a PDF invoice
4. Fill in details
5. Click **Submit**
6. As admin, validate the document

### Test Dashboard
1. As admin: **Client Portal** → **Dashboards**
2. Create a dashboard for a client
3. Click **Refresh Data**
4. View financial indicators

## 🐳 Docker Commands

```bash
# View logs
docker compose logs -f odoo

# Restart Odoo
docker compose restart odoo

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Check status
docker compose ps

# Access Odoo shell
docker compose exec odoo odoo shell -d iseb_prod

# Access PostgreSQL
docker compose exec db psql -U odoo -d iseb_prod
```

## 📊 Key Features to Test

### 1. Client Portal
- ✅ Document upload with OCR
- ✅ Financial dashboard
- ✅ Expense notes
- ✅ Document validation workflow

### 2. French Accounting
- ✅ FEC export
- ✅ TVA declarations (CA3, CA12)
- ✅ French chart of accounts (PCG)

### 3. Reporting
- ✅ Custom financial reports
- ✅ Balance sheet
- ✅ Income statement
- ✅ Cash flow

### 4. E-Invoicing
- ✅ Factur-X generation
- ✅ Chorus Pro integration (needs config)
- ✅ Electronic signature

### 5. Bank Sync
- ✅ Bank account connection
- ✅ Automatic transaction import
- ✅ Reconciliation rules

## 🔍 Troubleshooting

### Module not found
```bash
# Update app list in Odoo
Apps → Update Apps List (⟳ icon)

# Or restart Odoo
docker compose restart odoo
```

### Installation error
```bash
# Check logs
docker compose logs odoo --tail=100

# Look for Python errors or missing dependencies
```

### Portal not accessible
```bash
# Verify user has portal access
Settings → Users → Check "Portal" group

# Verify partner is linked
User → Related Partner field must be set
```

### OCR not working
```bash
# Verify Tesseract is installed
docker compose exec odoo tesseract --version

# Should show: tesseract 5.x.x
```

## 📞 Support & Documentation

- **Installation Guide**: `install_modules.sh`
- **User Guide**: `USER_GUIDE.md`
- **OCR Documentation**: `addons/client_portal/OCR_README.md`
- **Deployment Guide**: `DEPLOYMENT.md`

## 🎯 Next Steps

1. ✅ Install all modules
2. ✅ Create test data (clients, invoices)
3. ✅ Test client portal workflow
4. ✅ Configure email notifications
5. ✅ Set up automatic backups
6. 🔄 Deploy to production server
7. 🔄 Configure domain name & SSL
8. 🔄 Set up bank connections

## 💡 Pro Tips

- Always install **French Localization** before ISEB modules
- Use **incognito mode** to test portal as different users
- Check logs frequently: `docker compose logs -f odoo`
- Update apps list after code changes
- Test with real PDF invoices for OCR

---

**All set! Your ISEB Platform is ready to use locally! 🚀**
