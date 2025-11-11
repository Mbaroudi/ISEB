import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/fiscal/obligations/[id]
 * Get a specific fiscal obligation
 */
export async function GET(
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

    // Read obligation
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
              "delegation_id",
              "next_obligation_id",
              "notes",
              "create_date",
              "write_date",
              "message_ids",
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

    if (!obligation) {
      return NextResponse.json(
        { error: "Obligation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      obligation,
    });
  } catch (error: any) {
    console.error("Get fiscal obligation error:", error);

    let errorMessage = "Failed to fetch fiscal obligation";
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

/**
 * PUT /api/fiscal/obligations/[id]
 * Update a fiscal obligation
 */
export async function PUT(
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

    const {
      description,
      due_date,
      state,
      base_amount,
      penalty_amount,
      payment_method,
      paid_by,
      administrative_document_id,
      notes,
    } = body;

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

    // Build update values
    const values: any = {};

    if (description !== undefined) values.description = description;
    if (due_date !== undefined) values.due_date = due_date;
    if (state !== undefined) values.state = state;
    if (base_amount !== undefined)
      values.base_amount = parseFloat(base_amount);
    if (penalty_amount !== undefined)
      values.penalty_amount = parseFloat(penalty_amount);
    if (payment_method !== undefined) values.payment_method = payment_method;
    if (paid_by !== undefined) values.paid_by = paid_by;
    if (administrative_document_id !== undefined)
      values.administrative_document_id = administrative_document_id
        ? parseInt(administrative_document_id)
        : false;
    if (notes !== undefined) values.notes = notes;

    // Update obligation
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "write",
          args: [[parseInt(id)], values],
          kwargs: {},
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
      message: "Obligation mise à jour avec succès",
    });
  } catch (error: any) {
    console.error("Update fiscal obligation error:", error);

    let errorMessage = "Failed to update fiscal obligation";
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

/**
 * DELETE /api/fiscal/obligations/[id]
 * Delete a fiscal obligation (set to cancelled state)
 */
export async function DELETE(
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

    // Set obligation to cancelled instead of deleting
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "write",
          args: [[parseInt(id)], { state: "cancelled" }],
          kwargs: {},
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

    return NextResponse.json({
      success: true,
      message: "Obligation annulée avec succès",
    });
  } catch (error: any) {
    console.error("Delete fiscal obligation error:", error);

    let errorMessage = "Failed to delete fiscal obligation";
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
