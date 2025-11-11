import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("account_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const reconciled = searchParams.get("reconciled");
    const limit = parseInt(searchParams.get("limit") || "100");

    const odoo = getOdooClient();
    const domain: any[] = [];

    if (accountId) domain.push(["bank_account_id", "=", parseInt(accountId)]);
    if (startDate) domain.push(["date", ">=", startDate]);
    if (endDate) domain.push(["date", "<=", endDate]);
    if (reconciled !== null) domain.push(["reconciled", "=", reconciled === "true"]);

    const transactions = await odoo.searchRead({
      model: "bank.transaction",
      domain,
      fields: ["name", "date", "amount", "currency_id", "bank_account_id", "partner_id", "description", "reference", "reconciled", "move_id"],
      limit,
      order: "date desc",
    });

    return NextResponse.json({ success: true, transactions, count: transactions.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
