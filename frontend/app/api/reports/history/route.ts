import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * GET /api/reports/history
 * Get history of generated reports
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("template_id");
    const partnerId = searchParams.get("partner_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const odoo = getOdooClient();

    const domain: any[] = [];

    if (templateId) {
      domain.push(["template_id", "=", parseInt(templateId)]);
    }

    if (partnerId) {
      domain.push(["partner_id", "=", parseInt(partnerId)]);
    }

    if (startDate) {
      domain.push(["period_start", ">=", startDate]);
    }

    if (endDate) {
      domain.push(["period_end", "<=", endDate]);
    }

    // Search for generated reports (report.line records grouped by generation)
    const reports = await odoo.searchRead({
      model: "report.line",
      domain,
      fields: [
        "template_id",
        "partner_id",
        "period_start",
        "period_end",
        "create_date",
        "write_date",
      ],
      limit,
      offset,
      order: "create_date desc",
    });

    // Group by generation (same template, partner, period)
    const groupedReports: Record<string, any> = {};

    reports.forEach((report: any) => {
      const key = `${report.template_id[0]}_${report.partner_id[0]}_${report.period_start}_${report.period_end}`;

      if (!groupedReports[key]) {
        groupedReports[key] = {
          template_id: report.template_id,
          partner_id: report.partner_id,
          period_start: report.period_start,
          period_end: report.period_end,
          generated_date: report.create_date,
        };
      }
    });

    const history = Object.values(groupedReports);

    return NextResponse.json({
      success: true,
      history,
      total: history.length,
    });
  } catch (error: any) {
    console.error("Error fetching report history:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique", details: error.message },
      { status: 500 }
    );
  }
}
