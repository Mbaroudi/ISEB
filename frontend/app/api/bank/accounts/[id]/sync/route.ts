import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const accountId = parseInt(params.id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();

    // Call sync method on bank account
    await odoo.call({
      model: "bank.account",
      method: "action_sync_transactions",
      args: [[accountId]],
    });

    const account = await odoo.read("bank.account", [accountId], ["name", "balance", "last_sync_date", "sync_status"]);

    return NextResponse.json({ success: true, account: account[0], message: "Synchronisation lancée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
