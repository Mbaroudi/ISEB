import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * POST /api/reports/schedule
 * Schedule automatic report generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, partner_id, frequency, send_email, recipient_ids } = body;

    if (!template_id || !partner_id || !frequency) {
      return NextResponse.json(
        { error: "template_id, partner_id et frequency sont obligatoires" },
        { status: 400 }
      );
    }

    const odoo = getOdooClient();

    // Update template with scheduling info
    await odoo.write("report.template", [parseInt(template_id)], {
      frequency: frequency,
      auto_send_email: send_email || false,
    });

    // Create cron job for automatic generation (if Odoo supports it)
    // This would typically be done via ir.cron model

    return NextResponse.json({
      success: true,
      message: `Rapport planifié avec fréquence: ${frequency}`,
    });
  } catch (error: any) {
    console.error("Error scheduling report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la planification du rapport", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/schedule
 * Get scheduled reports
 */
export async function GET(request: NextRequest) {
  try {
    const odoo = getOdooClient();

    const scheduledTemplates = await odoo.searchRead({
      model: "report.template",
      domain: [["frequency", "!=", "manual"]],
      fields: [
        "name",
        "code",
        "template_type",
        "frequency",
        "auto_send_email",
        "create_date",
      ],
      order: "name asc",
    });

    return NextResponse.json({
      success: true,
      scheduled_reports: scheduledTemplates,
    });
  } catch (error: any) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rapports planifiés", details: error.message },
      { status: 500 }
    );
  }
}
