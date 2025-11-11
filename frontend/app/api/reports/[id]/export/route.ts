import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * POST /api/reports/[id]/export
 * Export report to Excel or PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);
    const body = await request.json();

    const { format, partner_id, period_start, period_end } = body;

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    if (!format || !["excel", "pdf", "xlsx"].includes(format)) {
      return NextResponse.json(
        { error: "format doit être 'excel', 'xlsx' ou 'pdf'" },
        { status: 400 }
      );
    }

    if (!partner_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: "partner_id, period_start et period_end sont requis" },
        { status: 400 }
      );
    }

    const odoo = getOdooClient();

    // Generate report first
    const generateResponse = await odoo.call({
      model: "report.template",
      method: "generate_report",
      args: [[reportId]],
      kwargs: {
        partner_id: parseInt(partner_id),
        period_start,
        period_end,
      },
    });

    // Export to requested format
    let exportMethod = "";
    let mimeType = "";
    let fileExtension = "";

    if (format === "excel" || format === "xlsx") {
      exportMethod = "export_xlsx";
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExtension = "xlsx";
    } else if (format === "pdf") {
      exportMethod = "export_pdf";
      mimeType = "application/pdf";
      fileExtension = "pdf";
    }

    const exportResponse = await odoo.call({
      model: "report.template",
      method: exportMethod,
      args: [[reportId]],
      kwargs: {
        partner_id: parseInt(partner_id),
        period_start,
        period_end,
      },
    });

    // Return file data (base64 encoded)
    return NextResponse.json({
      success: true,
      file_data: exportResponse,
      mime_type: mimeType,
      filename: `report_${reportId}_${period_start}_${period_end}.${fileExtension}`,
    });
  } catch (error: any) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export du rapport", details: error.message },
      { status: 500 }
    );
  }
}
