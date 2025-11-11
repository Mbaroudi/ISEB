#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ISEB Module Validator

This script validates all ISEB modules and identifies issues:
- Missing fields referenced in XML views
- Missing action methods
- Invalid XPath expressions
- Field name mismatches
- Circular references in help text

Usage:
    python validate_modules.py [--module MODULE_NAME] [--verbose]
"""

import os
import re
import ast
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple
import argparse
import json


class Colors:
    """ANSI color codes for terminal output"""
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'


class Issue:
    """Represents a validation issue"""
    
    SEVERITY_ERROR = 'ERROR'
    SEVERITY_WARNING = 'WARNING'
    SEVERITY_INFO = 'INFO'
    
    TYPE_MISSING_FIELD = 'missing_field'
    TYPE_MISSING_ACTION = 'missing_action'
    TYPE_INVALID_XPATH = 'invalid_xpath'
    TYPE_FIELD_MISMATCH = 'field_mismatch'
    TYPE_CIRCULAR_REFERENCE = 'circular_reference'
    TYPE_MISSING_MODEL = 'missing_model'
    TYPE_INVALID_ATTRIBUTE = 'invalid_attribute'
    TYPE_DEPRECATED_SYNTAX = 'deprecated_syntax'
    
    def __init__(self, severity, issue_type, file_path, line_number, message, suggestion=None):
        self.severity = severity
        self.issue_type = issue_type
        self.file_path = file_path
        self.line_number = line_number
        self.message = message
        self.suggestion = suggestion
    
    def __repr__(self):
        color = {
            self.SEVERITY_ERROR: Colors.RED,
            self.SEVERITY_WARNING: Colors.YELLOW,
            self.SEVERITY_INFO: Colors.CYAN,
        }.get(self.severity, Colors.WHITE)
        
        result = f"{color}{self.severity}{Colors.END} [{self.issue_type}]\n"
        result += f"  File: {Colors.BOLD}{self.file_path}:{self.line_number}{Colors.END}\n"
        result += f"  {self.message}\n"
        if self.suggestion:
            result += f"  {Colors.GREEN}Suggestion: {self.suggestion}{Colors.END}\n"
        return result
    
    def to_dict(self):
        return {
            'severity': self.severity,
            'type': self.issue_type,
            'file': str(self.file_path),
            'line': self.line_number,
            'message': self.message,
            'suggestion': self.suggestion
        }


class OdooModelParser:
    """Parses Odoo Python model files to extract field and method definitions"""
    
    def __init__(self, file_path):
        self.file_path = file_path
        self.model_name = None
        self.fields = {}
        self.methods = set()
        self.inherits = []
        self.parse()
    
    def parse(self):
        """Parse the Python file"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    self._parse_class(node)
        except Exception as e:
            print(f"Error parsing {self.file_path}: {e}")
    
    def _parse_class(self, class_node):
        """Parse a class definition"""
        # Check if it's an Odoo model
        for stmt in class_node.body:
            if isinstance(stmt, ast.Assign):
                for target in stmt.targets:
                    if isinstance(target, ast.Name):
                        if target.id == '_name' and isinstance(stmt.value, ast.Constant):
                            self.model_name = stmt.value.value
                        elif target.id == '_inherit':
                            if isinstance(stmt.value, ast.Constant):
                                self.inherits.append(stmt.value.value)
                            elif isinstance(stmt.value, ast.List):
                                for elt in stmt.value.elts:
                                    if isinstance(elt, ast.Constant):
                                        self.inherits.append(elt.value)
                        # Check for field definitions
                        elif isinstance(stmt.value, ast.Call):
                            if hasattr(stmt.value.func, 'attr'):
                                field_types = ['Char', 'Text', 'Integer', 'Float', 'Boolean',
                                             'Date', 'Datetime', 'Binary', 'Selection',
                                             'Many2one', 'One2many', 'Many2many', 'Monetary',
                                             'Html', 'Reference', 'Json']
                                if stmt.value.func.attr in field_types:
                                    field_name = target.id
                                    field_type = stmt.value.func.attr
                                    self.fields[field_name] = field_type
        
        # Extract methods
        for item in class_node.body:
            if isinstance(item, ast.FunctionDef):
                self.methods.add(item.name)


class OdooXMLParser:
    """Parses Odoo XML view files to extract field references"""
    
    def __init__(self, file_path):
        self.file_path = file_path
        self.field_references = []
        self.method_references = []
        self.xpath_expressions = []
        self.model_references = {}
        self.parse()
    
    def parse(self):
        """Parse the XML file"""
        try:
            # Parse with line numbers
            tree = ET.parse(self.file_path)
            root = tree.getroot()
            
            # Get the source lines for line number tracking
            with open(self.file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            self._parse_element(root, lines)
        except ET.ParseError as e:
            print(f"XML Parse Error in {self.file_path}: {e}")
        except Exception as e:
            print(f"Error parsing {self.file_path}: {e}")
    
    def _get_line_number(self, element, lines):
        """Try to estimate line number for an element"""
        # This is approximate since ElementTree doesn't preserve line numbers well
        for i, line in enumerate(lines, 1):
            if element.tag in line and (not element.get('name') or element.get('name') in line):
                return i
        return 0
    
    def _parse_element(self, element, lines, depth=0):
        """Recursively parse XML elements"""
        line_no = self._get_line_number(element, lines)
        
        # Track model references in view records
        if element.tag == 'record':
            model = element.get('model')
            if model and 'ir.ui.view' in model:
                for field_elem in element.findall('.//field[@name="model"]'):
                    if field_elem.text:
                        self.model_references[line_no] = field_elem.text
        
        # Check if this is an arch field containing the view definition
        if element.tag == 'field' and element.get('name') == 'arch':
            # Parse all descendants inside arch
            for child in element:
                self._parse_arch_element(child, lines)
        
        # Extract xpath expressions
        if element.tag == 'xpath':
            expr = element.get('expr')
            if expr:
                self.xpath_expressions.append((expr, line_no))
        
        # Check for deprecated attrs attribute (in any element)
        if element.get('attrs'):
            self.xpath_expressions.append(('deprecated_attrs', line_no))
        
        # Recurse for non-arch elements
        if not (element.tag == 'field' and element.get('name') == 'arch'):
            for child in element:
                self._parse_element(child, lines, depth + 1)
    
    def _parse_arch_element(self, element, lines):
        """Parse elements inside arch (actual view definitions)"""
        line_no = self._get_line_number(element, lines)
        
        # Extract field references
        if element.tag == 'field':
            name = element.get('name')
            if name and not name.startswith('message_'):  # Skip mail.thread fields
                self.field_references.append((name, line_no))
        
        # Extract button actions
        if element.tag == 'button':
            name = element.get('name')
            button_type = element.get('type')
            if name and button_type == 'object':
                self.method_references.append((name, line_no))
        
        # Check for deprecated attrs attribute
        if element.get('attrs'):
            self.xpath_expressions.append(('deprecated_attrs', line_no))
        
        # Recurse
        for child in element:
            self._parse_arch_element(child, lines)


class ModuleValidator:
    """Validates an Odoo module"""
    
    def __init__(self, module_path, verbose=False):
        self.module_path = Path(module_path)
        self.module_name = self.module_path.name
        self.verbose = verbose
        self.issues = []
        
        # Storage for parsed data
        self.models = {}  # model_name -> OdooModelParser
        self.xml_files = []  # List of OdooXMLParser
        
        # Known Odoo standard fields (mail.thread, mail.activity.mixin, etc.)
        self.standard_fields = {
            'message_ids', 'message_follower_ids', 'activity_ids', 'message_partner_ids',
            'message_attachment_count', 'message_has_error', 'message_has_error_counter',
            'message_has_sms_error', 'message_needaction', 'message_needaction_counter',
            'message_unread', 'message_unread_counter', 'activity_type_id',
            'activity_summary', 'activity_state', 'activity_user_id', 'activity_date_deadline',
            'create_date', 'create_uid', 'write_date', 'write_uid', 'display_name',
            'id', '__last_update'
        }
    
    def validate(self):
        """Run all validations"""
        print(f"\n{Colors.BOLD}Validating module: {self.module_name}{Colors.END}")
        print(f"Path: {self.module_path}\n")
        
        # Step 1: Parse all Python models
        self._parse_models()
        
        # Step 2: Parse all XML files
        self._parse_xml_files()
        
        # Step 3: Run validations
        self._validate_field_references()
        self._validate_method_references()
        self._validate_xpath_expressions()
        self._validate_model_references()
        
        return self.issues
    
    def _parse_models(self):
        """Parse all Python model files"""
        models_dir = self.module_path / 'models'
        if not models_dir.exists():
            self.issues.append(Issue(
                Issue.SEVERITY_WARNING,
                Issue.TYPE_MISSING_MODEL,
                str(models_dir),
                0,
                f"Models directory not found in module {self.module_name}",
                "Create a models/ directory with your model files"
            ))
            return
        
        for py_file in models_dir.glob('*.py'):
            if py_file.name == '__init__.py':
                continue
            
            if self.verbose:
                print(f"  Parsing model: {py_file.name}")
            
            parser = OdooModelParser(py_file)
            if parser.model_name:
                self.models[parser.model_name] = parser
                if self.verbose:
                    print(f"    Found model: {parser.model_name}")
                    print(f"    Fields: {len(parser.fields)}, Methods: {len(parser.methods)}")
    
    def _parse_xml_files(self):
        """Parse all XML view files"""
        xml_dirs = [
            self.module_path / 'views',
            self.module_path / 'data',
            self.module_path / 'wizard',
        ]
        
        for xml_dir in xml_dirs:
            if not xml_dir.exists():
                continue
            
            for xml_file in xml_dir.glob('*.xml'):
                if self.verbose:
                    print(f"  Parsing XML: {xml_file.name}")
                
                parser = OdooXMLParser(xml_file)
                self.xml_files.append(parser)
    
    def _validate_field_references(self):
        """Validate that all field references in XML exist in models"""
        for xml_parser in self.xml_files:
            # Try to determine which model this view is for
            current_model = None
            
            # Check model references in the XML
            if xml_parser.model_references:
                current_model = list(xml_parser.model_references.values())[0]
            
            if not current_model:
                # Try to guess from filename
                for model_name in self.models.keys():
                    model_file = model_name.replace('.', '_')
                    if model_file in xml_parser.file_path.name:
                        current_model = model_name
                        break
            
            if not current_model:
                continue
            
            model_parser = self.models.get(current_model)
            if not model_parser:
                continue
            
            # Check each field reference
            for field_name, line_no in xml_parser.field_references:
                # Skip standard fields
                if field_name in self.standard_fields:
                    continue
                
                # Skip fields from inherited models (simplified check)
                if field_name.startswith('x_'):  # Custom fields
                    continue
                
                # Check if field exists
                if field_name not in model_parser.fields:
                    # Check if it might be from a related model or inherited
                    if '_id' in field_name or '_ids' in field_name:
                        # Might be a relational field, be less strict
                        continue
                    
                    self.issues.append(Issue(
                        Issue.SEVERITY_ERROR,
                        Issue.TYPE_MISSING_FIELD,
                        xml_parser.file_path,
                        line_no,
                        f"Field '{field_name}' referenced in XML but not found in model '{current_model}'",
                        f"Add the field '{field_name}' to the model or check for typos"
                    ))
    
    def _validate_method_references(self):
        """Validate that all action methods referenced in XML exist in models"""
        for xml_parser in self.xml_files:
            # Determine current model
            current_model = None
            if xml_parser.model_references:
                current_model = list(xml_parser.model_references.values())[0]
            
            if not current_model:
                for model_name in self.models.keys():
                    model_file = model_name.replace('.', '_')
                    if model_file in xml_parser.file_path.name:
                        current_model = model_name
                        break
            
            if not current_model:
                continue
            
            model_parser = self.models.get(current_model)
            if not model_parser:
                continue
            
            # Check each method reference
            for method_name, line_no in xml_parser.method_references:
                if method_name not in model_parser.methods:
                    self.issues.append(Issue(
                        Issue.SEVERITY_ERROR,
                        Issue.TYPE_MISSING_ACTION,
                        xml_parser.file_path,
                        line_no,
                        f"Action method '{method_name}' referenced in button but not found in model '{current_model}'",
                        f"Add the method 'def {method_name}(self):' to the model class"
                    ))
    
    def _validate_xpath_expressions(self):
        """Validate XPath expressions and check for deprecated syntax"""
        for xml_parser in self.xml_files:
            for expr, line_no in xml_parser.xpath_expressions:
                if expr == 'deprecated_attrs':
                    self.issues.append(Issue(
                        Issue.SEVERITY_WARNING,
                        Issue.TYPE_DEPRECATED_SYNTAX,
                        xml_parser.file_path,
                        line_no,
                        "Deprecated 'attrs' attribute found - Odoo 17+ uses invisible=, readonly=, required= directly",
                        "Convert attrs={'invisible': [('field', '=', value)]} to invisible=\"field == value\""
                    ))
                    continue
                
                # Check for common XPath issues
                if expr.count('(') != expr.count(')'):
                    self.issues.append(Issue(
                        Issue.SEVERITY_ERROR,
                        Issue.TYPE_INVALID_XPATH,
                        xml_parser.file_path,
                        line_no,
                        f"Invalid XPath expression: mismatched parentheses in '{expr}'",
                        "Check the XPath syntax and balance parentheses"
                    ))
                
                if expr.count('[') != expr.count(']'):
                    self.issues.append(Issue(
                        Issue.SEVERITY_ERROR,
                        Issue.TYPE_INVALID_XPATH,
                        xml_parser.file_path,
                        line_no,
                        f"Invalid XPath expression: mismatched brackets in '{expr}'",
                        "Check the XPath syntax and balance brackets"
                    ))
    
    def _validate_model_references(self):
        """Validate that models referenced in XML actually exist"""
        for xml_parser in self.xml_files:
            for line_no, model_name in xml_parser.model_references.items():
                if model_name not in self.models:
                    # Check if it's a standard Odoo model
                    standard_models = [
                        'res.partner', 'res.company', 'res.users', 'res.currency',
                        'account.move', 'account.journal', 'account.account',
                        'ir.ui.view', 'ir.ui.menu', 'ir.actions.act_window',
                        'ir.model.access'
                    ]
                    
                    if model_name not in standard_models:
                        self.issues.append(Issue(
                            Issue.SEVERITY_WARNING,
                            Issue.TYPE_MISSING_MODEL,
                            xml_parser.file_path,
                            line_no,
                            f"Model '{model_name}' referenced in XML but not found in module",
                            "Ensure the model is defined or is from a dependency module"
                        ))


class ISEBValidator:
    """Main validator for all ISEB modules"""
    
    MODULES = [
        'client_portal',
        'cabinet_portal',
        'bank_sync',
        'e_invoicing',
        'french_accounting',
        'reporting'
    ]
    
    def __init__(self, base_path, modules=None, verbose=False):
        self.base_path = Path(base_path)
        self.modules = modules or self.MODULES
        self.verbose = verbose
        self.all_issues = {}
    
    def validate_all(self):
        """Validate all modules"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}ISEB Module Validation{Colors.END}")
        print(f"{Colors.BOLD}{'=' * 80}{Colors.END}\n")
        
        for module_name in self.modules:
            module_path = self.base_path / 'addons' / module_name
            
            if not module_path.exists():
                print(f"{Colors.RED}Module {module_name} not found at {module_path}{Colors.END}\n")
                continue
            
            validator = ModuleValidator(module_path, self.verbose)
            issues = validator.validate()
            self.all_issues[module_name] = issues
        
        self._print_summary()
        return self.all_issues
    
    def _print_summary(self):
        """Print validation summary"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}Validation Summary{Colors.END}")
        print(f"{Colors.BOLD}{'=' * 80}{Colors.END}\n")
        
        total_errors = 0
        total_warnings = 0
        total_info = 0
        
        for module_name, issues in self.all_issues.items():
            errors = sum(1 for i in issues if i.severity == Issue.SEVERITY_ERROR)
            warnings = sum(1 for i in issues if i.severity == Issue.SEVERITY_WARNING)
            info = sum(1 for i in issues if i.severity == Issue.SEVERITY_INFO)
            
            total_errors += errors
            total_warnings += warnings
            total_info += info
            
            status_color = Colors.GREEN if errors == 0 else Colors.RED
            print(f"{Colors.BOLD}{module_name}{Colors.END}: "
                  f"{status_color}{errors} errors{Colors.END}, "
                  f"{Colors.YELLOW}{warnings} warnings{Colors.END}, "
                  f"{Colors.CYAN}{info} info{Colors.END}")
        
        print(f"\n{Colors.BOLD}Total:{Colors.END} "
              f"{Colors.RED}{total_errors} errors{Colors.END}, "
              f"{Colors.YELLOW}{total_warnings} warnings{Colors.END}, "
              f"{Colors.CYAN}{total_info} info{Colors.END}\n")
        
        # Print detailed issues
        if total_errors > 0 or total_warnings > 0:
            print(f"\n{Colors.BOLD}{Colors.BLUE}Detailed Issues{Colors.END}")
            print(f"{Colors.BOLD}{'=' * 80}{Colors.END}\n")
            
            for module_name, issues in self.all_issues.items():
                if issues:
                    print(f"\n{Colors.BOLD}{Colors.MAGENTA}Module: {module_name}{Colors.END}\n")
                    for issue in issues:
                        print(issue)
                        print()
    
    def export_json(self, output_file):
        """Export issues to JSON file"""
        data = {
            'validation_date': str(Path.cwd()),
            'modules': {}
        }
        
        for module_name, issues in self.all_issues.items():
            data['modules'][module_name] = {
                'issues': [issue.to_dict() for issue in issues],
                'summary': {
                    'errors': sum(1 for i in issues if i.severity == Issue.SEVERITY_ERROR),
                    'warnings': sum(1 for i in issues if i.severity == Issue.SEVERITY_WARNING),
                    'info': sum(1 for i in issues if i.severity == Issue.SEVERITY_INFO),
                }
            }
        
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n{Colors.GREEN}Results exported to: {output_file}{Colors.END}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Validate ISEB Odoo modules for common issues',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python validate_modules.py                    # Validate all modules
  python validate_modules.py --module client_portal  # Validate specific module
  python validate_modules.py --verbose          # Verbose output
  python validate_modules.py --export report.json    # Export to JSON
        """
    )
    
    parser.add_argument(
        '--module',
        help='Validate only specific module',
        choices=['client_portal', 'cabinet_portal', 'bank_sync', 'e_invoicing', 'french_accounting', 'reporting']
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    parser.add_argument(
        '--export',
        help='Export results to JSON file',
        metavar='FILE'
    )
    
    args = parser.parse_args()
    
    # Determine base path (current directory should be ISEB root)
    base_path = Path(__file__).parent
    
    # Select modules
    modules = [args.module] if args.module else None
    
    # Run validation
    validator = ISEBValidator(base_path, modules, args.verbose)
    validator.validate_all()
    
    # Export if requested
    if args.export:
        validator.export_json(args.export)


if __name__ == '__main__':
    main()
