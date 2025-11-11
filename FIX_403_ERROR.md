# Fix 403 FORBIDDEN Error on Odoo Login

## Problem
When accessing `http://localhost:8069`, you see a 403 FORBIDDEN error.

## Most Common Cause

The `config/odoo.conf` file has a strict database filter:

```ini
dbfilter = ^iseb_prod$
```

This means Odoo will **ONLY** accept a database named exactly `iseb_prod`. If this database doesn't exist or has a different name, Odoo returns 403 FORBIDDEN.

---

## Quick Diagnostic

Run the diagnostic script:

```bash
cd ~/ISEB
python3 diagnose_403_error.py
```

This will check:
- ✅ Docker containers are running
- ✅ Database exists and name matches configuration
- ✅ Odoo logs for errors
- ✅ Configuration issues

---

## Solutions

### Solution 1: Create the Required Database

If the database `iseb_prod` doesn't exist, create it:

```bash
# Create the database
docker compose exec -T db createdb -U odoo iseb_prod

# Restart Odoo
docker compose restart odoo

# Watch logs
docker compose logs -f odoo
```

Then navigate to `http://localhost:8069` and initialize the database.

---

### Solution 2: Modify Database Filter (Development)

If you're in development and want to use any database name:

**Edit `config/odoo.conf`:**

```ini
# Before:
dbfilter = ^iseb_prod$

# After (comment it out):
; dbfilter = ^iseb_prod$
```

Or change it to match your existing database name:

```ini
dbfilter = ^your_database_name$
```

Then restart:

```bash
docker compose restart odoo
```

---

### Solution 3: Allow Database Selection (Development Only)

For development, you can enable database listing:

**Edit `config/odoo.conf`:**

```ini
# Change:
list_db = False

# To:
list_db = True
```

And comment out dbfilter:

```ini
; dbfilter = ^iseb_prod$
```

Then restart:

```bash
docker compose restart odoo
```

**⚠️ WARNING:** Never use `list_db = True` in production! It's a security risk.

---

### Solution 4: Fresh Start

If nothing works, try a clean restart:

```bash
# Stop all containers
docker compose down

# Start fresh
docker compose up -d

# Watch logs for errors
docker compose logs -f odoo
```

---

## Verify the Fix

After applying a solution:

1. **Check Odoo is accessible:**
   ```bash
   curl -I http://localhost:8069
   ```

   You should see `HTTP/1.0 303 SEE OTHER` or `200 OK`

2. **Access in browser:**
   Navigate to `http://localhost:8069`

3. **Check logs:**
   ```bash
   docker compose logs --tail=50 odoo
   ```

   Look for successful startup messages, no 403 errors

---

## Understanding the Error

### Why 403 Instead of 404?

Odoo returns **403 FORBIDDEN** (not 404) when:
- Database filter (`dbfilter`) is configured
- The requested database doesn't match the filter
- Or no database exists that matches

This is intentional security behavior to:
- Prevent database enumeration
- Hide which databases exist
- Enforce strict database naming in production

### Production vs Development

**Production Setup (Current):**
```ini
list_db = False        # Hide database selector
dbfilter = ^iseb_prod$ # Only allow iseb_prod
```

**Development Setup:**
```ini
list_db = True         # Show database selector
; dbfilter = .*        # Allow any database
```

---

## Related Files

- `config/odoo.conf` - Main Odoo configuration (line 61: dbfilter)
- `docker-compose.yml` - Docker setup
- `diagnose_403_error.py` - Diagnostic script

---

## Next Steps After Fixing

Once you can access Odoo:

1. **Initialize or select database**
2. **Install modules:**
   ```bash
   ./install_all_modules.sh
   ```

3. **Check module visibility:**
   ```bash
   python3 check_modules_status.py
   ```

4. **Load demo data (optional):**
   ```bash
   python3 load_demo_data.py
   ```

---

## Still Having Issues?

Run the full diagnostic and share the output:

```bash
python3 diagnose_403_error.py > diagnostic_output.txt 2>&1
cat diagnostic_output.txt
```

Common additional issues:
- **Port already in use:** Another service using port 8069
- **Docker not running:** Start Docker Desktop
- **Database connection failed:** PostgreSQL container not healthy
- **Static files 403:** File permission issues (check volumes)
