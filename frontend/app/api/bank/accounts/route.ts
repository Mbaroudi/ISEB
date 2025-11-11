import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get("partner_id");
    const active = searchParams.get("active");

    const odoo = getOdooClient();
    const domain: any[] = [];

    if (partnerId) domain.push(["partner_id", "=", parseInt(partnerId)]);
    if (active) domain.push(["active", "=", active === "true"]);

    const accounts = await odoo.searchRead({
      model: "bank.account",
      domain,
      fields: ["name", "account_number", "iban", "bank_id", "partner_id", "provider_id", "balance", "last_sync_date", "sync_status", "active"],
      order: "name asc",
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, account_number, iban, bank_id, partner_id, provider_id } = body;

    if (!name || !partner_id) {
      return NextResponse.json({ error: "name et partner_id requis" }, { status: 400 });
    }

    const odoo = getOdooClient();
    const accountId = await odoo.create({
      model: "bank.account",
      values: { name, account_number: account_number || false, iban: iban || false, bank_id: bank_id ? parseInt(bank_id) : false, partner_id: parseInt(partner_id), provider_id: provider_id ? parseInt(provider_id) : false },
    });

    const account = await odoo.read("bank.account", [accountId], ["name", "account_number", "iban", "bank_id", "partner_id", "provider_id", "balance", "active"]);

    return NextResponse.json({ success: true, account: account[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
