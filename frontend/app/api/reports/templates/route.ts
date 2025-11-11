import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

/**
 * GET /api/reports/templates
 * List report templates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateType = searchParams.get("type");
    const active = searchParams.get("active");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const odoo = getOdooClient();

    const domain: any[] = [];

    if (templateType) {
      domain.push(["template_type", "=", templateType]);
    }

    if (active !== null && active !== undefined) {
      domain.push(["active", "=", active === "true"]);
    }

    const templates = await odoo.searchRead({
      model: "report.template",
      domain,
      fields: [
        "name",
        "code",
        "template_type",
        "description",
        "active",
        "frequency",
        "line_ids",
        "create_date",
        "write_date",
      ],
      limit,
      offset,
      order: "name asc",
    });

    const total = await odoo.searchCount({
      model: "report.template",
      domain,
    });

    return NextResponse.json({
      success: true,
      templates,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching report templates:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des templates", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/templates
 * Create a new report template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, template_type, description, frequency, lines } = body;

    if (!name || !code || !template_type) {
      return NextResponse.json(
        { error: "name, code et template_type sont obligatoires" },
        { status: 400 }
      );
    }

    const odoo = getOdooClient();

    const templateId = await odoo.create({
      model: "report.template",
      values: {
        name,
        code,
        template_type,
        description: description || "",
        frequency: frequency || "manual",
        active: true,
      },
    });

    // Create lines if provided
    if (lines && Array.isArray(lines)) {
      for (const line of lines) {
        await odoo.create({
          model: "report.template.line",
          values: {
            template_id: templateId,
            sequence: line.sequence || 10,
            name: line.name,
            code: line.code,
            line_type: line.line_type || "line",
            account_domain: line.account_domain || "[]",
            formula: line.formula || false,
            style: line.style || "normal",
          },
        });
      }
    }

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
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating report template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du template", details: error.message },
      { status: 500 }
    );
  }
}
