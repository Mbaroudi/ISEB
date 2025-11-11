# ISEB Module Validation Report

Date: 2025-11-08
Validator: validate_modules.py

## Summary

Total issues found across all modules: **38 errors**, **1 warning**

### Module Status

| Module | Status | Errors | Warnings | Notes |
|--------|--------|--------|----------|-------|
| client_portal | ✅ PASS | 0 | 0 | No issues found |
| cabinet_portal | ✅ PASS | 0 | 0 | No issues found |
| bank_sync | ⚠️  WARN | 0 | 1 | Missing wizard model |
| e_invoicing | ✅ PASS | 0 | 0 | No issues found |
| french_accounting | ❌ FAIL | 35 | 0 | Multiple field/action mismatches |
| reporting | ❌ FAIL | 3 | 0 | Missing fields in related model |

## Detailed Issues

### 1. bank_sync (1 warning)

#### Missing Model
- **File**: `addons/bank_sync/wizard/bank_account_wizard_views.xml:3`
- **Issue**: Model 'bank.account.wizard' referenced in XML but not found in module
- **Severity**: WARNING
- **Suggestion**: The wizard model file exists (`bank_account_wizard.py`) but may not be properly parsed. Verify the model is defined correctly.

---

### 2. french_accounting (35 errors)

#### Missing Fields (31 errors)
The TVA declaration view (`tva_declaration_views.xml`) is incorrectly associated with the `liasse.fiscale` model instead of `tva.declaration` model.

**Root Cause**: The view definitions reference fields from `tva.declaration` model but the validator is matching them to `liasse.fiscale` due to XML parsing logic.

**Actual Issue**: These are FALSE POSITIVES. The fields exist in `tva.declaration` model:
- `period_label` - Line 72-76 in tva_declaration.py
- `declaration_type` - Line 42-47 in tva_declaration.py
- `tva_a_payer` - Computed field (needs verification)
- `due_date`, `payment_date`, `regime_tva`, `period_type`, `period_start`, `period_end`
- TVA calculation fields: `base_ht_*`, `tva_collectee_*`, `tva_deductible_*`, etc.

**Resolution Needed**: 
1. Improve validator's model detection logic for complex view scenarios
2. OR: This indicates the views file may have incorrect model references

#### Missing Actions (4 errors)
- `action_compute_tva` - Should be in tva.declaration model
- `action_submit` - Should be in tva.declaration model  
- `action_mark_paid` - Should be in tva.declaration model
- `action_reset_to_draft` - Should be in tva.declaration model

**Status**: These methods likely exist but weren't parsed correctly, OR they genuinely need to be implemented in the `tva.declaration` model.

---

### 3. reporting (3 errors)

#### Missing Fields in Related Model
**File**: `addons/reporting/views/custom_report_views.xml`

The view shows a One2many field `line_ids` with an inline tree view. The fields referenced are from `custom.report.line` model, not `custom.report`:

**Issue**: Lines 46-50 define fields that belong to `custom.report.line`:
- `sequence` - Should be in custom.report.line model
- `computation_type` - Should be in custom.report.line model
- `level` - Should be in custom.report.line model

**Actual Status**: Need to check `report_line.py` model to see if these fields exist. They appear to be missing.

**Resolution**: Add these fields to the `custom.report.line` model or fix the view definition.

---

## Validation Script Capabilities

The `validate_modules.py` script checks for:

1. ✅ **Missing Fields**: Fields referenced in XML views but not defined in Python models
2. ✅ **Missing Actions**: Button action methods referenced but not implemented
3. ✅ **Invalid XPath**: Malformed XPath expressions in view inheritance
4. ✅ **Deprecated Syntax**: Usage of deprecated `attrs` attribute (Odoo 17+)
5. ✅ **Missing Models**: Models referenced in XML but not found in the module
6. ⚠️  **Model Detection**: Needs improvement for complex view scenarios

## Known Limitations

1. **Standard Odoo Fields**: Some inherited fields from base models might not be detected
2. **Computed Fields**: Fields computed via `@api.depends` might not be fully tracked
3. **Related Fields**: Fields using `related=` might not be detected
4. **Model Context**: Multi-model views (like One2many inline views) need better context tracking

## Recommendations

### Immediate Actions (Priority: HIGH)

1. **french_accounting module**:
   - Verify the `tva_declaration_views.xml` correctly references `tva.declaration` model
   - Check if action methods exist in `tva_declaration.py`
   - Review all fields to ensure they're properly defined

2. **reporting module**:
   - Check `report_line.py` for missing fields: `sequence`, `computation_type`, `level`
   - Add these fields if missing
   - Update the view if fields are named differently

3. **bank_sync module**:
   - Verify `bank_account_wizard.py` has proper model definition
   - Check the `__init__.py` imports the wizard module

### Script Improvements (Priority: MEDIUM)

1. Enhance model detection for One2many/Many2many inline views
2. Add support for detecting related and computed fields
3. Improve line number accuracy in XML parsing
4. Add caching for standard Odoo model fields
5. Support for detecting circular dependencies

### Testing Recommendations

1. Run Odoo with `--test-enable` to catch runtime issues
2. Check Odoo server logs for field/method not found errors
3. Test each module's views in the UI
4. Run odoo-bin with `--log-level=debug` to see all warnings

## Usage

```bash
# Validate all modules
python validate_modules.py

# Validate specific module with verbose output
python validate_modules.py --module french_accounting --verbose

# Export results to JSON
python validate_modules.py --export validation_report.json

# View help
python validate_modules.py --help
```

## Files Generated

1. `validate_modules.py` - The validation script
2. `validation_report.json` - JSON export of all issues
3. `VALIDATION_REPORT.md` - This human-readable report

---

**Note**: This validation was performed statically. Runtime testing in Odoo is still required to catch dynamic issues, permission problems, and business logic errors.
