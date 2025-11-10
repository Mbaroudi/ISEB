import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/fiscal/delegations
 * List payment delegations for current user/partner
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get("state");
    const partnerId = searchParams.get("partner_id");

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

    // Build domain filters
    const domain: any[] = [];

    if (state) {
      domain.push(["state", "=", state]);
    }

    if (partnerId) {
      domain.push(["partner_id", "=", parseInt(partnerId)]);
    }

    // Search delegations
    const searchResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "search_read",
          args: [domain],
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
              "notes",
              "create_date",
              "write_date",
            ],
            order: "create_date desc",
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

    const delegations = searchResponse.data?.result || [];

    return NextResponse.json({
      success: true,
      delegations,
      count: delegations.length,
    });
  } catch (error: any) {
    console.error("Get payment delegations error:", error);

    let errorMessage = "Failed to fetch payment delegations";
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
 * POST /api/fiscal/delegations
 * Create a new payment delegation
 */
export async function POST(request: NextRequest) {
  try {
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
      partner_id,
      delegated_types,
      start_date,
      end_date,
      max_amount_per_payment,
      max_amount_per_month,
      payment_method,
      require_client_validation,
      validation_delay_hours,
      notes,
    } = body;

    // Validate required fields
    if (!partner_id || !delegated_types || delegated_types.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "partner_id and delegated_types are required",
        },
        { status: 400 }
      );
    }

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

    // Create delegation
    const createResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "create",
          args: [
            {
              partner_id: parseInt(partner_id),
              delegated_types: delegated_types, // Array of codes like ['tva', 'urssaf']
              start_date: start_date || new Date().toISOString().split("T")[0],
              end_date: end_date || false,
              max_amount_per_payment: max_amount_per_payment
                ? parseFloat(max_amount_per_payment)
                : 0,
              max_amount_per_month: max_amount_per_month
                ? parseFloat(max_amount_per_month)
                : 0,
              payment_method: payment_method || "transfer",
              require_client_validation: require_client_validation || false,
              validation_delay_hours: validation_delay_hours
                ? parseInt(validation_delay_hours)
                : 24,
              notes: notes || false,
            },
          ],
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

    const delegationId = createResponse.data?.result;

    if (!delegationId) {
      throw new Error("Failed to create delegation");
    }

    // Fetch the created delegation with all fields
    const readResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "read",
          args: [[delegationId]],
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
      message: "Délégation créée avec succès",
    });
  } catch (error: any) {
    console.error("Create payment delegation error:", error);

    let errorMessage = "Failed to create payment delegation";
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
