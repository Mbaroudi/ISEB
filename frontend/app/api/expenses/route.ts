import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get("partner_id");
    const state = searchParams.get("state");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "100");

    const odoo = getOdooClient();
    const domain: any[] = [];

    if (partnerId) domain.push(["partner_id", "=", parseInt(partnerId)]);
    if (state) domain.push(["state", "=", state]);
    if (startDate) domain.push(["expense_date", ">=", startDate]);
    if (endDate) domain.push(["expense_date", "<=", endDate]);

    const expenses = await odoo.searchRead({
      model: "expense.note",
      domain,
      fields: ["name", "partner_id", "expense_date", "amount", "currency_id", "category", "state", "description", "receipt_attachment_id", "validated_by_id", "validated_date", "rejection_reason"],
      limit,
      order: "expense_date desc",
    });

    return NextResponse.json({ success: true, expenses, count: expenses.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, partner_id, expense_date, amount, category, description, receipt_file } = body;

    if (!name || !partner_id || !expense_date || !amount) {
      return NextResponse.json({ error: "name, partner_id, expense_date et amount requis" }, { status: 400 });
    }

    const odoo = getOdooClient();
    const expenseId = await odoo.create({
      model: "expense.note",
      values: {
        name,
        partner_id: parseInt(partner_id),
        expense_date,
        amount: parseFloat(amount),
        category: category || "other",
        description: description || "",
        receipt_file: receipt_file || false,
        state: "draft",
      },
    });

    const expense = await odoo.read("expense.note", [expenseId], ["name", "expense_date", "amount", "category", "state"]);

    return NextResponse.json({ success: true, expense: expense[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
