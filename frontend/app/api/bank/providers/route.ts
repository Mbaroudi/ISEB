import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const odoo = getOdooClient();

    const providers = await odoo.searchRead({
      model: "bank.provider",
      domain: [["active", "=", true]],
      fields: ["name", "code", "api_type", "logo", "supported_countries", "description", "active"],
      order: "name asc",
    });

    return NextResponse.json({ success: true, providers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
