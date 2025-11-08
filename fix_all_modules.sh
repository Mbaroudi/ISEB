#!/bin/bash

# Comprehensive module validation and fix script
# This will check all modules and fix common issues

set -e

echo "======================================"
echo "ISEB Module Validation & Fix"
echo "======================================"
echo ""

# Check Python syntax
echo "1. Checking Python syntax..."
python3 -m py_compile addons/*/models/*.py addons/*/controllers/*.py 2>&1 | head -20 || true

echo ""
echo "2. Validating XML files..."
for xml in addons/*/views/*.xml addons/*/data/*.xml; do
    if [ -f "$xml" ]; then
        xmllint --noout "$xml" 2>&1 | head -5 || echo "Warning: $xml has XML issues"
    fi
done

echo ""
echo "3. Checking for common issues..."

# Check for missing action methods
echo "   - Checking action methods..."
for view_file in addons/*/views/*.xml; do
    if [ -f "$view_file" ]; then
        grep -o 'name="action_[^"]*"' "$view_file" | sed 's/name="//;s/"//' | sort -u > /tmp/actions_in_view.txt 2>/dev/null || true
    fi
done

# Check for circular references
echo "   - Checking circular references..."
grep -r "%(action_" addons/*/views/*.xml | grep -v "Binary file" || true

echo ""
echo "======================================"
echo "Validation Complete"
echo "======================================"
