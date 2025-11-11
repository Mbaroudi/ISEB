import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const odoo = getOdooClient();

    // Get company e-invoicing settings
    const companies = await odoo.searchRead({
      model: "res.company",
      domain: [],
      fields: ["name", "einvoicing_enabled", "einvoicing_default_format_id", "chorus_pro_login", "chorus_pro_siret", "einvoicing_test_mode"],
      limit: 1,
    });

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, config: companies[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { einvoicing_enabled, default_format_id, chorus_pro_login, chorus_pro_siret, test_mode } = body;

    const odoo = getOdooClient();

    const updateValues: any = {};
    if (einvoicing_enabled !== undefined) updateValues.einvoicing_enabled = einvoicing_enabled;
    if (default_format_id !== undefined) updateValues.einvoicing_default_format_id = default_format_id ? parseInt(default_format_id) : false;
    if (chorus_pro_login !== undefined) updateValues.chorus_pro_login = chorus_pro_login;
    if (chorus_pro_siret !== undefined) updateValues.chorus_pro_siret = chorus_pro_siret;
    if (test_mode !== undefined) updateValues.einvoicing_test_mode = test_mode;

    // Get current company
    const companies = await odoo.searchRead({
      model: "res.company",
      domain: [],
      fields: ["id"],
      limit: 1,
    });

    if (companies && companies.length > 0) {
      await odoo.write("res.company", [companies[0].id], updateValues);

      const updatedCompany = await odoo.read("res.company", [companies[0].id], ["einvoicing_enabled", "einvoicing_default_format_id", "chorus_pro_login", "einvoicing_test_mode"]);

      return NextResponse.json({ success: true, config: updatedCompany[0], message: "Configuration mise à jour" });
    } else {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
