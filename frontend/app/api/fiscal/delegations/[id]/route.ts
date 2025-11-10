import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/fiscal/delegations/[id]
 * Get a specific payment delegation
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

    // Read delegation
    const readResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "read",
          args: [[parseInt(id)]],
          kwargs: {
            fields: [
              "name",
              "partner_id",
              "delegated_types",
              "start_date",
              "end_date",
              "is_active",
              "is_expired",
              "max_amount_per_payment",
              "max_amount_per_month",
              "payment_method",
              "require_client_validation",
              "validation_delay_hours",
              "state",
              "signed_by_client",
              "signed_by_accountant",
              "signature_date_client",
              "signature_date_accountant",
              "client_signature",
              "accountant_signature",
              "delegation_document_id",
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

    const delegation = readResponse.data?.result?.[0];

    if (!delegation) {
      return NextResponse.json(
        { error: "Delegation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      delegation,
    });
  } catch (error: any) {
    console.error("Get payment delegation error:", error);

    let errorMessage = "Failed to fetch payment delegation";
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
 * PUT /api/fiscal/delegations/[id]
 * Update a payment delegation
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
      delegated_types,
      end_date,
      max_amount_per_payment,
      max_amount_per_month,
      payment_method,
      require_client_validation,
      validation_delay_hours,
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

    if (delegated_types !== undefined) values.delegated_types = delegated_types;
    if (end_date !== undefined) values.end_date = end_date;
    if (max_amount_per_payment !== undefined)
      values.max_amount_per_payment = parseFloat(max_amount_per_payment);
    if (max_amount_per_month !== undefined)
      values.max_amount_per_month = parseFloat(max_amount_per_month);
    if (payment_method !== undefined) values.payment_method = payment_method;
    if (require_client_validation !== undefined)
      values.require_client_validation = require_client_validation;
    if (validation_delay_hours !== undefined)
      values.validation_delay_hours = parseInt(validation_delay_hours);
    if (notes !== undefined) values.notes = notes;

    // Update delegation
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
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

    // Fetch updated delegation
    const readResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "read",
          args: [[parseInt(id)]],
          kwargs: {
            fields: [
              "name",
              "partner_id",
              "delegated_types",
              "start_date",
              "end_date",
              "is_active",
              "is_expired",
              "max_amount_per_payment",
              "max_amount_per_month",
              "payment_method",
              "require_client_validation",
              "validation_delay_hours",
              "state",
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

    const delegation = readResponse.data?.result?.[0];

    return NextResponse.json({
      success: true,
      delegation,
      message: "Délégation mise à jour avec succès",
    });
  } catch (error: any) {
    console.error("Update payment delegation error:", error);

    let errorMessage = "Failed to update payment delegation";
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
