import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/cabinet/clients
 * Get list of cabinet clients with filtering
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
    const healthScore = searchParams.get("health_score");
    const active = searchParams.get("active");
    const search = searchParams.get("search");
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
    const domain: any[] = [["is_iseb_client", "=", true]];

    if (healthScore) {
      domain.push(["health_score", "=", healthScore]);
    }

    if (active !== null && active !== undefined) {
      domain.push(["active", "=", active === "true"]);
    }

    if (search) {
      domain.push([
        "|",
        "|",
        ["name", "ilike", search],
        ["email", "ilike", search],
        ["siret", "ilike", search],
      ]);
    }

    // Search clients
    const searchResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "res.partner",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: [
              "name",
              "email",
              "phone",
              "mobile",
              "siret",
              "company_type",
              "legal_form",
              "active",
              "health_score",
              "monthly_fee",
              "contract_start_date",
              "contract_end_date",
              "cabinet_id",
              "is_iseb_client",
              "create_date",
              "write_date",
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: "name asc",
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

    const clients = searchResponse.data?.result || [];

    // Get total count for pagination
    const countResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "res.partner",
          method: "search_count",
          args: [domain],
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

    const total = countResponse.data?.result || 0;

    return NextResponse.json({
      success: true,
      clients,
      total,
      count: clients.length,
    });
  } catch (error: any) {
    console.error("Get cabinet clients error:", error);

    let errorMessage = "Failed to fetch cabinet clients";
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
