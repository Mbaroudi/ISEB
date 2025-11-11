import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = parseInt(params.id);
    const body = await request.json();
    const { partner_id, credentials } = body;

    if (isNaN(providerId) || !partner_id) {
      return NextResponse.json({ error: "Invalid provider ID ou partner_id manquant" }, { status: 400 });
    }

    const odoo = getOdooClient();

    // Connect to bank provider (creates auth link or connects directly)
    const result = await odoo.call({
      model: "bank.provider",
      method: "action_connect",
      args: [[providerId]],
      kwargs: { partner_id: parseInt(partner_id), credentials: credentials || {} },
    });

    return NextResponse.json({ success: true, result, message: "Connexion initiée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
