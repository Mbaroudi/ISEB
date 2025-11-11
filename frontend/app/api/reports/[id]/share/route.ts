import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * POST /api/reports/[id]/share
 * Share a report with users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);
    const body = await request.json();

    const { partner_ids, user_ids, message, send_email } = body;

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    if (!partner_ids && !user_ids) {
      return NextResponse.json(
        { error: "Au moins partner_ids ou user_ids est requis" },
        { status: 400 }
      );
    }

    const odoo = getOdooClient();

    // Get report template
    const template = await odoo.read("report.template", [reportId], ["name"]);

    if (!template || template.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Send email notification via Odoo mail system
    if (send_email) {
      const partnerIdsArray = partner_ids ? partner_ids.split(",").map((id: string) => parseInt(id)) : [];

      if (partnerIdsArray.length > 0) {
        await odoo.call({
          model: "report.template",
          method: "message_post",
          args: [[reportId]],
          kwargs: {
            body: message || `Rapport partagé: ${template[0].name}`,
            partner_ids: partnerIdsArray,
            message_type: "notification",
            subtype_xmlid: "mail.mt_comment",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rapport partagé avec succès",
    });
  } catch (error: any) {
    console.error("Error sharing report:", error);
    return NextResponse.json(
      { error: "Erreur lors du partage du rapport", details: error.message },
      { status: 500 }
    );
  }
}
