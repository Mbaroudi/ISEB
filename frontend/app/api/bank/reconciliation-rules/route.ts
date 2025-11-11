import { NextRequest, NextResponse } from "next/server";
import { getOdooClient } from "@/lib/odoo/client";

export async function GET(request: NextRequest) {
  try {
    const odoo = getOdooClient();

    const rules = await odoo.searchRead({
      model: "reconciliation.rule",
      domain: [["active", "=", true]],
      fields: ["name", "sequence", "rule_type", "partner_matching", "account_id", "auto_validate", "active"],
      order: "sequence asc",
    });

    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rule_type, partner_matching, account_id, auto_validate } = body;

    if (!name || !rule_type) {
      return NextResponse.json({ error: "name et rule_type requis" }, { status: 400 });
    }

    const odoo = getOdooClient();
    const ruleId = await odoo.create({
      model: "reconciliation.rule",
      values: { name, rule_type, partner_matching: partner_matching || false, account_id: account_id ? parseInt(account_id) : false, auto_validate: auto_validate || false },
    });

    const rule = await odoo.read("reconciliation.rule", [ruleId], ["name", "rule_type", "partner_matching", "account_id", "auto_validate"]);

    return NextResponse.json({ success: true, rule: rule[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
