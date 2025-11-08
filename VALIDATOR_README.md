# ISEB Module Validator

A comprehensive Python validation script for Odoo modules that performs static analysis to identify potential issues before runtime.

## Quick Start

```bash
# Validate all modules
python validate_modules.py

# Validate specific module
python validate_modules.py --module client_portal

# Verbose output
python validate_modules.py --verbose

# Export to JSON
python validate_modules.py --export report.json
```

## Features

### Checks Performed

1. **Missing Fields** - Detects fields referenced in XML views but not defined in Python models
2. **Missing Actions** - Finds button action methods that are referenced but not implemented
3. **Invalid XPath** - Identifies malformed XPath expressions in view inheritance
4. **Deprecated Syntax** - Flags usage of deprecated `attrs` attribute (Odoo 17+)
5. **Missing Models** - Detects models referenced in XML but not found in the module

### Output Formats

- **Console**: Color-coded output with severity levels (ERROR, WARNING, INFO)
- **JSON**: Machine-readable format for CI/CD integration
- **Reports**: Detailed markdown reports with suggestions

## Architecture

```
validate_modules.py
├── OdooModelParser      # Parses Python model files (AST)
│   ├── Extract fields
│   ├── Extract methods
│   └── Track model inheritance
├── OdooXMLParser        # Parses XML view files
│   ├── Extract field references
│   ├── Extract button actions
│   └── Validate XPath expressions
├── ModuleValidator      # Validates a single module
│   └── Cross-references Python and XML
└── ISEBValidator        # Validates all ISEB modules
    └── Generates reports
```

## Technical Details

### Model Parsing (AST)
- Uses Python's `ast` module for reliable parsing
- Extracts field definitions: `Char`, `Integer`, `Many2one`, etc.
- Extracts method definitions
- Tracks `_name`, `_inherit` attributes

### XML Parsing
- Uses `xml.etree.ElementTree` for XML parsing
- Distinguishes between:
  - Record definitions (metadata)
  - View arch (actual view content)
- Tracks model context through nested elements

### Issue Tracking
Each issue includes:
- Severity (ERROR, WARNING, INFO)
- Type (missing_field, missing_action, etc.)
- File path and line number
- Descriptive message
- Suggested fix

## Known Limitations

1. **TransientModel**: Wizard models may not be detected correctly
2. **Multi-Model XML**: Can confuse context when multiple models in one file
3. **One2many/Many2many**: Inline views may reference fields from related models
4. **Computed Fields**: Not all `@api.depends` fields are tracked
5. **Inherited Fields**: Fields from `_inherit` models not fully tracked

## Examples

### Example 1: Clean Module
```bash
$ python validate_modules.py --module client_portal

Validating module: client_portal
Path: /Users/malek/ISEB/ISEB/addons/client_portal

client_portal: ✓ 0 errors, 0 warnings, 0 info
```

### Example 2: Issues Found
```bash
$ python validate_modules.py --module reporting

Validating module: reporting

ERROR [missing_field]
  File: views/custom_report_views.xml:46
  Field 'sequence' referenced in XML but not found in model 'custom.report'
  Suggestion: Add the field 'sequence' to the model or check for typos
```

### Example 3: JSON Export
```bash
$ python validate_modules.py --export report.json
$ cat report.json
{
  "modules": {
    "client_portal": {
      "summary": {
        "errors": 0,
        "warnings": 0,
        "info": 0
      },
      "issues": []
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions
```yaml
name: Validate Modules
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Validate Modules
        run: |
          python validate_modules.py --export report.json
          if [ $(jq '.modules | map(.summary.errors) | add' report.json) -gt 0 ]; then
            echo "Validation errors found"
            exit 1
          fi
```

### GitLab CI
```yaml
validate_modules:
  stage: test
  script:
    - python validate_modules.py --export report.json
    - errors=$(jq '.modules | map(.summary.errors) | add' report.json)
    - if [ $errors -gt 0 ]; then exit 1; fi
  artifacts:
    paths:
      - report.json
```

## Command Reference

```
usage: validate_modules.py [-h] [--module MODULE] [--verbose] [--export FILE]

Validate ISEB Odoo modules for common issues

optional arguments:
  -h, --help       show this help message and exit
  --module MODULE  Validate only specific module
                   choices: client_portal, cabinet_portal, bank_sync,
                           e_invoicing, french_accounting, reporting
  --verbose        Enable verbose output
  --export FILE    Export results to JSON file

Examples:
  python validate_modules.py                    # Validate all modules
  python validate_modules.py --module client_portal  # Validate specific module
  python validate_modules.py --verbose          # Verbose output
  python validate_modules.py --export report.json    # Export to JSON
```

## Extending the Validator

### Adding New Checks

```python
class ModuleValidator:
    def validate(self):
        # Existing validations
        self._validate_field_references()
        self._validate_method_references()
        
        # Add your custom validation
        self._validate_security_rules()
    
    def _validate_security_rules(self):
        """Check for missing security rules"""
        for model_name, model_parser in self.models.items():
            # Your validation logic
            pass
```

### Custom Issue Types

```python
class Issue:
    TYPE_MISSING_SECURITY = 'missing_security'
    TYPE_PERFORMANCE = 'performance_issue'
    # Add more types as needed
```

## Files Generated

- `validate_modules.py` - The validation script (this file)
- `validation_report.json` - JSON export of validation results
- `VALIDATION_REPORT.md` - Human-readable detailed report
- `VALIDATION_FINAL_SUMMARY.md` - Executive summary

## Performance

- Parses 32 Python files in ~1 second
- Analyzes 23 XML files in ~0.5 seconds
- Total validation time: ~2 seconds for all 6 modules

## Dependencies

- Python 3.7+
- Standard library only (ast, xml.etree.ElementTree, pathlib, argparse, json)
- No external dependencies required

## Contributing

To improve the validator:

1. **Add TransientModel support** - Detect wizard models
2. **Track inheritance** - Follow _inherit chains
3. **Improve context tracking** - Handle One2many inline views
4. **Add computed field detection** - Track @api.depends
5. **Performance optimization** - Cache standard Odoo fields

## Support

For issues or questions:
- Check VALIDATION_REPORT.md for detailed analysis
- Review VALIDATION_FINAL_SUMMARY.md for module health
- Run with --verbose for debugging information

## License

Part of the ISEB project - Intelligent System for Expert Boosters

---

**Version**: 1.0
**Created**: 2025-11-08
**Python**: 3.7+
**Lines of Code**: 650+
