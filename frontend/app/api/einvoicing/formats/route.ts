import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const odoo = getOdooClient();

    const formats = await odoo.searchRead({
      model: "einvoice.format",
      domain: [["active", "=", true]],
      fields: ["name", "code", "format_type", "description", "supported_countries", "mandatory_from_date", "active"],
      order: "name asc",
    });

    return NextResponse.json({ success: true, formats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
