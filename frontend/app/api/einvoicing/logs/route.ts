import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get("invoice_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const odoo = getOdooClient();
    const domain: any[] = [];

    if (invoiceId) domain.push(["invoice_id", "=", parseInt(invoiceId)]);
    if (status) domain.push(["status", "=", status]);

    const logs = await odoo.searchRead({
      model: "einvoice.log",
      domain,
      fields: ["invoice_id", "send_date", "format_id", "status", "error_message", "chorus_pro_reference", "response_data"],
      limit,
      order: "send_date desc",
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
