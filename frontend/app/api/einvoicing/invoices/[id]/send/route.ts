import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseInt(params.id);
    const body = await request.json();
    const { format_id } = body;

    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();

    await odoo.call({
      model: "account.move",
      method: "action_send_einvoice",
      args: [[invoiceId]],
      kwargs: { format_id: format_id ? parseInt(format_id) : false },
    });

    const invoice = await odoo.read("account.move", [invoiceId], ["name", "einvoicing_status", "einvoicing_sent_date", "einvoicing_error"]);

    return NextResponse.json({ success: true, invoice: invoice[0], message: "Facture électronique envoyée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
