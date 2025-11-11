import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("account_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const odoo = getOdooClient();
    const domain: any[] = [];

    if (accountId) domain.push(["bank_account_id", "=", parseInt(accountId)]);
    if (status) domain.push(["status", "=", status]);

    const logs = await odoo.searchRead({
      model: "bank.sync.log",
      domain,
      fields: ["bank_account_id", "sync_date", "status", "transactions_created", "transactions_updated", "errors_count", "error_message", "duration"],
      limit,
      order: "sync_date desc",
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
