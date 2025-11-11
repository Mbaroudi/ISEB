import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get("partner_id");
    const einvoicingStatus = searchParams.get("einvoicing_status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "100");

    const odoo = getOdooClient();
    const domain: any[] = [["move_type", "in", ["out_invoice", "out_refund"]]];

    if (partnerId) domain.push(["partner_id", "=", parseInt(partnerId)]);
    if (einvoicingStatus) domain.push(["einvoicing_status", "=", einvoicing Status]);
    if (startDate) domain.push(["invoice_date", ">=", startDate]);
    if (endDate) domain.push(["invoice_date", "<=", endDate]);

    const invoices = await odoo.searchRead({
      model: "account.move",
      domain,
      fields: ["name", "partner_id", "invoice_date", "amount_total", "currency_id", "state", "einvoicing_status", "einvoicing_format_id", "einvoicing_sent_date", "einvoicing_error"],
      limit,
      order: "invoice_date desc",
    });

    return NextResponse.json({ success: true, invoices, count: invoices.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
