import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseInt(params.id);
    const body = await request.json();
    const { format_id } = body;

    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();

    const validationResult = await odoo.call({
      model: "account.move",
      method: "action_validate_einvoice_format",
      args: [[invoiceId]],
      kwargs: { format_id: format_id ? parseInt(format_id) : false },
    });

    return NextResponse.json({ success: true, validation: validationResult, message: "Validation effectuée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
