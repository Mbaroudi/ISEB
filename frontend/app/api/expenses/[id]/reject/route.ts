import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = parseInt(params.id);
    const body = await request.json();
    const { reason } = body;

    if (isNaN(expenseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();

    await odoo.call({
      model: "expense.note",
      method: "action_reject",
      args: [[expenseId]],
      kwargs: { reason: reason || "Non conforme" },
    });

    const expense = await odoo.read("expense.note", [expenseId], ["name", "state", "rejection_reason"]);

    return NextResponse.json({ success: true, expense: expense[0], message: "Note de frais rejetée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
