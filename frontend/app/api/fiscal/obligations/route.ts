import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/fiscal/obligations
 * List fiscal obligations with filters
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
    const obligationType = searchParams.get("type");
    const state = searchParams.get("state");
    const alertLevel = searchParams.get("alert_level");
    const isOverdue = searchParams.get("is_overdue");
    const periodicity = searchParams.get("periodicity");
    const partnerId = searchParams.get("partner_id");
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

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

    if (obligationType) {
      domain.push(["obligation_type_id.code", "=", obligationType]);
    }

    if (state) {
      domain.push(["state", "=", state]);
    }

    if (alertLevel) {
      domain.push(["alert_level", "=", alertLevel]);
    }

    if (isOverdue === "true") {
      domain.push(["is_overdue", "=", true]);
    }

    if (periodicity) {
      domain.push(["periodicity", "=", periodicity]);
    }

    if (partnerId) {
      domain.push(["partner_id", "=", parseInt(partnerId)]);
    }

    // Search obligations
    const searchResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "search_read",
          args: [domain],
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
              "create_date",
              "write_date",
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: "due_date asc, priority desc",
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

    const obligations = searchResponse.data?.result || [];

    // Get obligation types for reference
    const typesResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation.type",
          method: "search_read",
          args: [[]],
          kwargs: {
            fields: ["name", "code", "description", "periodicity", "color"],
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

    const types = typesResponse.data?.result || [];

    return NextResponse.json({
      success: true,
      obligations,
      types,
      count: obligations.length,
    });
  } catch (error: any) {
    console.error("Get fiscal obligations error:", error);

    let errorMessage = "Failed to fetch fiscal obligations";
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
 * POST /api/fiscal/obligations
 * Create a new fiscal obligation
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
      obligation_type_id,
      partner_id,
      description,
      due_date,
      periodicity,
      base_amount,
      penalty_amount,
      payment_method,
      paid_by,
      administrative_document_id,
      notes,
    } = body;

    // Validate required fields
    if (!obligation_type_id || !partner_id || !due_date) {
      return NextResponse.json(
        {
          success: false,
          error: "obligation_type_id, partner_id and due_date are required",
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

    // Create obligation
    const createResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "create",
          args: [
            {
              obligation_type_id: parseInt(obligation_type_id),
              partner_id: parseInt(partner_id),
              description: description || false,
              due_date,
              periodicity: periodicity || "one_time",
              base_amount: base_amount ? parseFloat(base_amount) : 0,
              penalty_amount: penalty_amount ? parseFloat(penalty_amount) : 0,
              payment_method: payment_method || "transfer",
              paid_by: paid_by || "client",
              administrative_document_id: administrative_document_id
                ? parseInt(administrative_document_id)
                : false,
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

    const obligationId = createResponse.data?.result;

    if (!obligationId) {
      throw new Error("Failed to create obligation");
    }

    // Fetch the created obligation with all fields
    const readResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "read",
          args: [[obligationId]],
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
      message: "Obligation créée avec succès",
    });
  } catch (error: any) {
    console.error("Create fiscal obligation error:", error);

    let errorMessage = "Failed to create fiscal obligation";
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
