import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/cabinet/clients/[id]
 * Get detailed information about a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authSession = request.cookies.get("auth_session");

    if (!authSession) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
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

    // Read client data
    const clientResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "res.partner",
          method: "read",
          args: [[clientId]],
          kwargs: {
            fields: [
              "name",
              "email",
              "phone",
              "mobile",
              "website",
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
              "street",
              "street2",
              "zip",
              "city",
              "country_id",
              "comment",
              "create_date",
              "write_date",
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

    const client = clientResponse.data?.result?.[0];

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get client's latest dashboard
    const dashboardResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.dashboard",
          method: "search_read",
          args: [[["partner_id", "=", clientId]]],
          kwargs: {
            fields: [
              "name",
              "period_start",
              "period_end",
              "revenue_mtd",
              "expenses_mtd",
              "net_income_mtd",
              "margin_rate",
              "cash_balance",
              "compute_date",
            ],
            limit: 1,
            order: "compute_date desc",
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

    const dashboard = dashboardResponse.data?.result?.[0] || null;

    // Get pending tasks count
    const tasksResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "search_count",
          args: [
            [
              ["partner_id", "=", clientId],
              ["state", "not in", ["done", "cancelled"]],
            ],
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

    const pendingTasks = tasksResponse.data?.result || 0;

    // Get pending documents count
    const documentsResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document",
          method: "search_count",
          args: [[["partner_id", "=", clientId], ["state", "in", ["pending", "submitted"]]]],
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

    const pendingDocuments = documentsResponse.data?.result || 0;

    // Get pending expenses count
    const expensesResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "expense.note",
          method: "search_count",
          args: [[["partner_id", "=", clientId], ["state", "=", "submitted"]]],
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

    const pendingExpenses = expensesResponse.data?.result || 0;

    return NextResponse.json({
      success: true,
      client,
      dashboard,
      stats: {
        pendingTasks,
        pendingDocuments,
        pendingExpenses,
      },
    });
  } catch (error: any) {
    console.error("Get cabinet client detail error:", error);

    let errorMessage = "Failed to fetch client details";
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
