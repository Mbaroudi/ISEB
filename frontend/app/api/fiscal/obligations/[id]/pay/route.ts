import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/fiscal/obligations/[id]/pay
 * Mark a fiscal obligation as paid
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authSession = request.cookies.get("auth_session");

    if (!authSession) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const body = await request.json();

    const { payment_date, payment_reference, payment_method, paid_by, notes } =
      body;

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    // Authenticate with Odoo
    const authResponse = await axios.post(
      `${odooUrl}/web/session/authenticate`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: odooDb,
          login: auth.username,
          password: auth.password,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (!authResponse.data?.result?.uid) {
      throw new Error("Authentication failed");
    }

    const cookies = authResponse.headers["set-cookie"];
    const sessionCookie = cookies ? cookies.join("; ") : "";

    // Call mark_as_paid method
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "mark_as_paid",
          args: [[parseInt(id)]],
          kwargs: {
            payment_date: payment_date || new Date().toISOString().split("T")[0],
            payment_reference: payment_reference || false,
            payment_method: payment_method || undefined,
            paid_by: paid_by || undefined,
            notes: notes || false,
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        withCredentials: true,
      }
    );

    // Fetch updated obligation
    const readResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "read",
          args: [[parseInt(id)]],
          kwargs: {
            fields: [
              "name",
              "obligation_type_id",
              "partner_id",
              "description",
              "due_date",
              "state",
              "priority",
              "alert_level",
              "is_overdue",
              "days_until_due",
              "periodicity",
              "base_amount",
              "penalty_amount",
              "total_amount",
              "payment_method",
              "paid_by",
              "payment_date",
              "payment_reference",
              "administrative_document_id",
              "next_obligation_id",
              "notes",
            ],
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        withCredentials: true,
      }
    );

    const obligation = readResponse.data?.result?.[0];

    return NextResponse.json({
      success: true,
      obligation,
      message: "Obligation marquée comme payée avec succès",
    });
  } catch (error: any) {
    console.error("Mark obligation as paid error:", error);

    let errorMessage = "Failed to mark obligation as paid";
    if (error.response?.data?.error?.data?.message) {
      errorMessage = error.response.data.error.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
