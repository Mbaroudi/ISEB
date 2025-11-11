import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = parseInt(params.id);
    if (isNaN(expenseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();

    await odoo.call({
      model: "expense.note",
      method: "action_approve",
      args: [[expenseId]],
    });

    const expense = await odoo.read("expense.note", [expenseId], ["name", "state", "validated_by_id", "validated_date"]);

    return NextResponse.json({ success: true, expense: expense[0], message: "Note de frais approuvée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
