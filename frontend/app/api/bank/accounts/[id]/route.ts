import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const accountId = parseInt(params.id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();
    const account = await odoo.read("bank.account", [accountId], ["name", "account_number", "iban", "bank_id", "partner_id", "provider_id", "balance", "last_sync_date", "sync_status", "active"]);

    if (!account || account.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, account: account[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const accountId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();
    const updateValues: any = {};

    if (body.name !== undefined) updateValues.name = body.name;
    if (body.account_number !== undefined) updateValues.account_number = body.account_number;
    if (body.iban !== undefined) updateValues.iban = body.iban;
    if (body.active !== undefined) updateValues.active = body.active;

    await odoo.write("bank.account", [accountId], updateValues);
    const account = await odoo.read("bank.account", [accountId], ["name", "account_number", "iban", "bank_id", "partner_id", "balance", "active"]);

    return NextResponse.json({ success: true, account: account[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const accountId = parseInt(params.id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();
    await odoo.unlink("bank.account", [accountId]);

    return NextResponse.json({ success: true, message: "Compte supprimé" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
