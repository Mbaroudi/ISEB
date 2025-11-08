# ISEB Module Validator - Quick Reference

## One-Line Summary
Python script that validates Odoo module integrity by cross-referencing Python models with XML views to detect missing fields, actions, and common issues.

## Quick Start
```bash
python validate_modules.py                          # Validate all modules
python validate_modules.py --module client_portal   # Single module
python validate_modules.py --verbose                # Debug output
python validate_modules.py --export report.json     # JSON export
```

## What It Checks
- ✓ Missing fields (XML references but not in model)
- ✓ Missing action methods (buttons without implementations)
- ✓ Invalid XPath expressions (malformed syntax)
- ✓ Deprecated syntax (attrs in Odoo 17+)
- ✓ Missing models (referenced but not defined)

## Results Summary
| Module | Status | Issues |
|--------|--------|--------|
| client_portal | ✅ | 0 |
| cabinet_portal | ✅ | 0 |
| bank_sync | ✅ | 0 |
| e_invoicing | ✅ | 0 |
| french_accounting | ✅ | 0 |
| reporting | ✅ | 0 |

**Total: 6/6 modules pass validation**

## Files
- `validate_modules.py` - Main script (631 lines)
- `validation_report.json` - JSON results
- `VALIDATOR_README.md` - Full documentation
- `VALIDATION_REPORT.md` - Detailed analysis
- `VALIDATION_FINAL_SUMMARY.md` - Executive summary

## Key Features
- AST-based Python parsing (not regex)
- Context-aware XML analysis
- File:line error reporting
- Color-coded output
- CI/CD ready
- No external dependencies

## Performance
- 32 Python files in ~1s
- 23 XML files in ~0.5s
- Total: ~2 seconds

## Exit Codes
- 0: Success (validation complete)
- 1: Error (script failure)

## Integration
```yaml
# GitHub Actions
- run: python validate_modules.py --export report.json
```

## Known Limitations
- TransientModel detection
- One2many inline views
- Computed field tracking
- Inherited field detection

## Documentation
- Quick Start: This file
- User Guide: VALIDATOR_README.md
- Analysis: VALIDATION_REPORT.md
- Summary: VALIDATION_FINAL_SUMMARY.md

## Contact
Part of ISEB project - see main README.md

---
v1.0 | 2025-11-08 | Python 3.7+
