import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transactionId = parseInt(params.id);
    const body = await request.json();
    const { move_id, auto_reconcile } = body;

    if (isNaN(transactionId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();

    if (auto_reconcile) {
      // Call automatic reconciliation
      await odoo.call({
        model: "bank.transaction",
        method: "action_auto_reconcile",
        args: [[transactionId]],
      });
    } else if (move_id) {
      // Manual reconciliation with specific move
      await odoo.write("bank.transaction", [transactionId], {
        move_id: parseInt(move_id),
        reconciled: true,
      });
    } else {
      return NextResponse.json({ error: "move_id ou auto_reconcile requis" }, { status: 400 });
    }

    const transaction = await odoo.read("bank.transaction", [transactionId], ["name", "amount", "reconciled", "move_id"]);

    return NextResponse.json({ success: true, transaction: transaction[0], message: "Transaction rapprochée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
