# -*- coding: utf-8 -*-

import base64
import io
from datetime import datetime
from odoo import http
from odoo.http import request
from odoo.addons.web.controllers.main import content_disposition


class ExportController(http.Controller):
    """Controller pour exports PDF et Excel"""

    @http.route(['/my/dashboard/export'], type='http', auth='user', website=True)
    def export_dashboard(self, format='pdf', **kw):
        """Export du dashboard en PDF ou Excel"""
        partner = request.env.user.partner_id
        dashboard = partner.latest_dashboard_id
        
        if not dashboard:
            return request.redirect('/my/dashboard')
        
        if format == 'pdf':
            return self._export_dashboard_pdf(dashboard)
        elif format == 'excel':
            return self._export_dashboard_excel(dashboard)
        else:
            return request.redirect('/my/dashboard')

    def _export_dashboard_pdf(self, dashboard):
        """Export PDF du dashboard"""
        try:
            # Utiliser wkhtmltopdf via Odoo
            pdf_content = request.env.ref('client_portal.report_dashboard_pdf')._render_qweb_pdf([dashboard.id])[0]
            
            filename = f"Dashboard_{dashboard.partner_id.name}_{dashboard.period_start.strftime('%Y%m')}.pdf"
            
            headers = [
                ('Content-Type', 'application/pdf'),
                ('Content-Length', len(pdf_content)),
                ('Content-Disposition', content_disposition(filename)),
            ]
            
            return request.make_response(pdf_content, headers)
        except Exception as e:
            # Fallback: Générer un PDF simple
            return self._generate_simple_pdf(dashboard)

    def _export_dashboard_excel(self, dashboard):
        """Export Excel du dashboard"""
        try:
            import xlsxwriter
            
            output = io.BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Dashboard')
            
            # Formats
            title_format = workbook.add_format({
                'bold': True,
                'font_size': 16,
                'align': 'center',
                'valign': 'vcenter'
            })
            
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1
            })
            
            currency_format = workbook.add_format({
                'num_format': '#,##0.00 €',
                'border': 1
            })
            
            percent_format = workbook.add_format({
                'num_format': '0.00%',
                'border': 1
            })
            
            # Titre
            worksheet.merge_range('A1:D1', f'Dashboard - {dashboard.partner_id.name}', title_format)
            worksheet.write('A2', f'Période: {dashboard.period_start} au {dashboard.period_end}')
            
            # Section Trésorerie
            row = 4
            worksheet.write(row, 0, 'Trésorerie', header_format)
            worksheet.write(row, 1, dashboard.cash_balance, currency_format)
            
            # Section CA
            row += 2
            worksheet.write(row, 0, 'Chiffre d\'affaires', header_format)
            worksheet.write(row, 1, '', header_format)
            row += 1
            worksheet.write(row, 0, 'CA du mois')
            worksheet.write(row, 1, dashboard.revenue_mtd, currency_format)
            row += 1
            worksheet.write(row, 0, 'CA annuel')
            worksheet.write(row, 1, dashboard.revenue_ytd, currency_format)
            row += 1
            worksheet.write(row, 0, 'Croissance')
            worksheet.write(row, 1, dashboard.revenue_growth_mtd / 100, percent_format)
            
            # Section Charges
            row += 2
            worksheet.write(row, 0, 'Charges', header_format)
            worksheet.write(row, 1, '', header_format)
            row += 1
            worksheet.write(row, 0, 'Charges du mois')
            worksheet.write(row, 1, dashboard.expenses_mtd, currency_format)
            row += 1
            worksheet.write(row, 0, 'Charges annuelles')
            worksheet.write(row, 1, dashboard.expenses_ytd, currency_format)
            
            # Section Résultat
            row += 2
            worksheet.write(row, 0, 'Résultat net', header_format)
            worksheet.write(row, 1, '', header_format)
            row += 1
            worksheet.write(row, 0, 'Résultat mois')
            worksheet.write(row, 1, dashboard.net_income_mtd, currency_format)
            row += 1
            worksheet.write(row, 0, 'Taux de marge')
            worksheet.write(row, 1, dashboard.margin_rate / 100, percent_format)
            
            # Section TVA
            row += 2
            worksheet.write(row, 0, 'TVA', header_format)
            worksheet.write(row, 1, '', header_format)
            row += 1
            worksheet.write(row, 0, 'TVA collectée')
            worksheet.write(row, 1, dashboard.tva_collectee, currency_format)
            row += 1
            worksheet.write(row, 0, 'TVA déductible')
            worksheet.write(row, 1, dashboard.tva_deductible, currency_format)
            row += 1
            worksheet.write(row, 0, 'TVA à payer')
            worksheet.write(row, 1, dashboard.tva_due, currency_format)
            
            # Section Créances/Dettes
            row += 2
            worksheet.write(row, 0, 'Créances/Dettes', header_format)
            worksheet.write(row, 1, '', header_format)
            row += 1
            worksheet.write(row, 0, 'Créances clients')
            worksheet.write(row, 1, dashboard.receivable_amount, currency_format)
            row += 1
            worksheet.write(row, 0, 'Créances échues')
            worksheet.write(row, 1, dashboard.overdue_receivable, currency_format)
            row += 1
            worksheet.write(row, 0, 'Dettes fournisseurs')
            worksheet.write(row, 1, dashboard.payable_amount, currency_format)
            row += 1
            worksheet.write(row, 0, 'Dettes échues')
            worksheet.write(row, 1, dashboard.overdue_payable, currency_format)
            
            # Ajuster les largeurs de colonnes
            worksheet.set_column('A:A', 30)
            worksheet.set_column('B:B', 15)
            
            workbook.close()
            output.seek(0)
            
            filename = f"Dashboard_{dashboard.partner_id.name}_{dashboard.period_start.strftime('%Y%m')}.xlsx"
            
            headers = [
                ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                ('Content-Length', len(output.getvalue())),
                ('Content-Disposition', content_disposition(filename)),
            ]
            
            return request.make_response(output.getvalue(), headers)
            
        except ImportError:
            # xlsxwriter n'est pas installé
            return request.redirect('/my/dashboard?error=excel_not_available')

    def _generate_simple_pdf(self, dashboard):
        """Génération PDF simple sans reportlab"""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib import colors
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Titre
            title = Paragraph(f"<b>Dashboard - {dashboard.partner_id.name}</b>", styles['Heading1'])
            elements.append(title)
            elements.append(Spacer(1, 12))
            
            # Période
            period = Paragraph(f"Période: {dashboard.period_start} au {dashboard.period_end}", styles['Normal'])
            elements.append(period)
            elements.append(Spacer(1, 24))
            
            # Données
            data = [
                ['Indicateur', 'Valeur'],
                ['Trésorerie', f"{dashboard.cash_balance:.2f} €"],
                ['CA du mois', f"{dashboard.revenue_mtd:.2f} €"],
                ['Charges du mois', f"{dashboard.expenses_mtd:.2f} €"],
                ['Résultat net', f"{dashboard.net_income_mtd:.2f} €"],
                ['TVA à payer', f"{dashboard.tva_due:.2f} €"],
                ['Taux de marge', f"{dashboard.margin_rate:.1f}%"],
            ]
            
            table = Table(data, colWidths=[300, 150])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(table)
            
            doc.build(elements)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            filename = f"Dashboard_{dashboard.partner_id.name}_{dashboard.period_start.strftime('%Y%m')}.pdf"
            
            headers = [
                ('Content-Type', 'application/pdf'),
                ('Content-Length', len(pdf_content)),
                ('Content-Disposition', content_disposition(filename)),
            ]
            
            return request.make_response(pdf_content, headers)
            
        except ImportError:
            # reportlab n'est pas installé non plus
            return request.redirect('/my/dashboard?error=pdf_not_available')

    @http.route(['/my/expenses/export'], type='http', auth='user', website=True)
    def export_expenses(self, format='excel', **kw):
        """Export des notes de frais en Excel"""
        partner = request.env.user.partner_id
        expenses = request.env['expense.note'].search([
            ('partner_id', '=', partner.id)
        ], order='expense_date desc')
        
        if format == 'excel':
            return self._export_expenses_excel(expenses, partner)
        
        return request.redirect('/my/expenses')

    def _export_expenses_excel(self, expenses, partner):
        """Export Excel des notes de frais"""
        try:
            import xlsxwriter
            
            output = io.BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Notes de Frais')
            
            # Formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1
            })
            
            currency_format = workbook.add_format({
                'num_format': '#,##0.00 €',
                'border': 1
            })
            
            date_format = workbook.add_format({
                'num_format': 'dd/mm/yyyy',
                'border': 1
            })
            
            # En-têtes
            headers = ['Date', 'Description', 'Catégorie', 'Montant HT', 'TVA', 'Total TTC', 'État']
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
            
            # Données
            for row, expense in enumerate(expenses, start=1):
                worksheet.write(row, 0, expense.expense_date, date_format)
                worksheet.write(row, 1, expense.name)
                worksheet.write(row, 2, dict(expense._fields['category'].selection).get(expense.category))
                worksheet.write(row, 3, expense.amount, currency_format)
                worksheet.write(row, 4, expense.tva_amount, currency_format)
                worksheet.write(row, 5, expense.total_amount, currency_format)
                worksheet.write(row, 6, dict(expense._fields['state'].selection).get(expense.state))
            
            # Totaux
            last_row = len(expenses) + 1
            worksheet.write(last_row, 2, 'TOTAL', header_format)
            worksheet.write_formula(last_row, 3, f'=SUM(D2:D{last_row})', currency_format)
            worksheet.write_formula(last_row, 4, f'=SUM(E2:E{last_row})', currency_format)
            worksheet.write_formula(last_row, 5, f'=SUM(F2:F{last_row})', currency_format)
            
            # Ajuster les colonnes
            worksheet.set_column('A:A', 12)
            worksheet.set_column('B:B', 40)
            worksheet.set_column('C:G', 15)
            
            workbook.close()
            output.seek(0)
            
            filename = f"Notes_de_Frais_{partner.name}_{datetime.now().strftime('%Y%m%d')}.xlsx"
            
            headers = [
                ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                ('Content-Length', len(output.getvalue())),
                ('Content-Disposition', content_disposition(filename)),
            ]
            
            return request.make_response(output.getvalue(), headers)
            
        except ImportError:
            return request.redirect('/my/expenses?error=excel_not_available')
