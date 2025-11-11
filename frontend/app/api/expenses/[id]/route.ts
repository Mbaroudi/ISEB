import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = parseInt(params.id);
    if (isNaN(expenseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();
    const expense = await odoo.read("expense.note", [expenseId], ["name", "partner_id", "expense_date", "amount", "currency_id", "category", "state", "description", "receipt_attachment_id", "validated_by_id", "validated_date", "rejection_reason"]);

    if (!expense || expense.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, expense: expense[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(expenseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();
    const updateValues: any = {};

    if (body.name !== undefined) updateValues.name = body.name;
    if (body.expense_date !== undefined) updateValues.expense_date = body.expense_date;
    if (body.amount !== undefined) updateValues.amount = parseFloat(body.amount);
    if (body.category !== undefined) updateValues.category = body.category;
    if (body.description !== undefined) updateValues.description = body.description;

    await odoo.write("expense.note", [expenseId], updateValues);
    const expense = await odoo.read("expense.note", [expenseId], ["name", "expense_date", "amount", "category", "state"]);

    return NextResponse.json({ success: true, expense: expense[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = parseInt(params.id);
    if (isNaN(expenseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const odoo = getOdooClient();
    await odoo.unlink("expense.note", [expenseId]);

    return NextResponse.json({ success: true, message: "Note de frais supprimée" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
