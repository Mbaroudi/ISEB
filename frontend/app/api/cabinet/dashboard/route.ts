import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/cabinet/dashboard
 * Get cabinet dashboard statistics and overview
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
    const periodStart = searchParams.get("period_start");
    const periodEnd = searchParams.get("period_end");
    const refresh = searchParams.get("refresh") === "true";

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

    // Build domain for dashboard search
    const domain: any[] = [];

    if (periodStart) {
      domain.push(["period_start", ">=", periodStart]);
    }
    if (periodEnd) {
      domain.push(["period_end", "<=", periodEnd]);
    }

    // Search for dashboard (or create if not exists)
    let dashboard;
    const searchResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.dashboard",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: [
              "name",
              "company_id",
              "compute_date",
              "period_start",
              "period_end",
              "total_clients",
              "active_clients",
              "clients_excellent",
              "clients_warning",
              "clients_critical",
              "total_revenue_all",
              "total_expenses_all",
              "total_net_income",
              "average_margin_rate",
              "cabinet_revenue_mtd",
              "cabinet_revenue_ytd",
              "total_tasks",
              "tasks_overdue",
              "tasks_this_week",
              "documents_pending",
              "expenses_pending",
              "currency_id",
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

    const dashboards = searchResponse.data?.result || [];

    if (dashboards.length > 0) {
      dashboard = dashboards[0];

      // Refresh if requested
      if (refresh) {
        await axios.post(
          `${odooUrl}/web/dataset/call_kw`,
          {
            jsonrpc: "2.0",
            method: "call",
            params: {
              model: "cabinet.dashboard",
              method: "action_refresh",
              args: [[dashboard.id]],
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

        // Re-read dashboard data
        const refreshResponse = await axios.post(
          `${odooUrl}/web/dataset/call_kw`,
          {
            jsonrpc: "2.0",
            method: "call",
            params: {
              model: "cabinet.dashboard",
              method: "read",
              args: [[dashboard.id]],
              kwargs: {
                fields: [
                  "name",
                  "company_id",
                  "compute_date",
                  "period_start",
                  "period_end",
                  "total_clients",
                  "active_clients",
                  "clients_excellent",
                  "clients_warning",
                  "clients_critical",
                  "total_revenue_all",
                  "total_expenses_all",
                  "total_net_income",
                  "average_margin_rate",
                  "cabinet_revenue_mtd",
                  "cabinet_revenue_ytd",
                  "total_tasks",
                  "tasks_overdue",
                  "tasks_this_week",
                  "documents_pending",
                  "expenses_pending",
                  "currency_id",
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

        dashboard = refreshResponse.data?.result?.[0];
      }
    } else {
      // Create new dashboard if none exists
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const createResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "cabinet.dashboard",
            method: "create",
            args: [
              {
                period_start: periodStart || firstDay.toISOString().split("T")[0],
                period_end: periodEnd || lastDay.toISOString().split("T")[0],
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

      const dashboardId = createResponse.data?.result;

      // Read the created dashboard
      const readResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "cabinet.dashboard",
            method: "read",
            args: [[dashboardId]],
            kwargs: {
              fields: [
                "name",
                "company_id",
                "compute_date",
                "period_start",
                "period_end",
                "total_clients",
                "active_clients",
                "clients_excellent",
                "clients_warning",
                "clients_critical",
                "total_revenue_all",
                "total_expenses_all",
                "total_net_income",
                "average_margin_rate",
                "cabinet_revenue_mtd",
                "cabinet_revenue_ytd",
                "total_tasks",
                "tasks_overdue",
                "tasks_this_week",
                "documents_pending",
                "expenses_pending",
                "currency_id",
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

      dashboard = readResponse.data?.result?.[0];
    }

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error: any) {
    console.error("Get cabinet dashboard error:", error);

    let errorMessage = "Failed to fetch cabinet dashboard";
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
