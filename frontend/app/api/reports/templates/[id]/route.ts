import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * GET /api/reports/templates/[id]
 * Get template details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);

    if (isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const odoo = getOdooClient();

    const template = await odoo.read("report.template", [templateId], [
      "name",
      "code",
      "template_type",
      "description",
      "active",
      "frequency",
      "line_ids",
      "create_date",
      "write_date",
    ]);

    if (!template || template.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Get template lines
    const lines = await odoo.searchRead({
      model: "report.template.line",
      domain: [["template_id", "=", templateId]],
      fields: [
        "sequence",
        "name",
        "code",
        "line_type",
        "account_domain",
        "formula",
        "style",
      ],
      order: "sequence asc",
    });

    return NextResponse.json({
      success: true,
      template: { ...template[0], lines },
    });
  } catch (error: any) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du template", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reports/templates/[id]
 * Update template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const odoo = getOdooClient();

    const updateValues: any = {};

    if (body.name !== undefined) updateValues.name = body.name;
    if (body.code !== undefined) updateValues.code = body.code;
    if (body.template_type !== undefined) updateValues.template_type = body.template_type;
    if (body.description !== undefined) updateValues.description = body.description;
    if (body.frequency !== undefined) updateValues.frequency = body.frequency;
    if (body.active !== undefined) updateValues.active = body.active;

    await odoo.write("report.template", [templateId], updateValues);

    const template = await odoo.read("report.template", [templateId], [
      "name",
      "code",
      "template_type",
      "description",
      "active",
      "frequency",
      "line_ids",
    ]);

    return NextResponse.json({
      success: true,
      template: template[0],
    });
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du template", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/templates/[id]
 * Delete template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);

    if (isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const odoo = getOdooClient();

    await odoo.unlink("report.template", [templateId]);

    return NextResponse.json({
      success: true,
      message: "Template supprimé avec succès",
    });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du template", details: error.message },
      { status: 500 }
    );
  }
}
