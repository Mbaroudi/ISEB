import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/fiscal/alerts
 * Get fiscal alerts and upcoming obligations summary
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
    const domain: any[] = [["state", "in", ["todo", "in_progress", "waiting"]]];

    if (partnerId) {
      domain.push(["partner_id", "=", parseInt(partnerId)]);
    }

    // Get critical obligations (overdue)
    const overdueResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "search_read",
          args: [[...domain, ["is_overdue", "=", true]]],
          kwargs: {
            fields: [
              "name",
              "obligation_type_id",
              "partner_id",
              "due_date",
              "days_until_due",
              "total_amount",
              "alert_level",
              "priority",
            ],
            order: "due_date asc",
            limit: 10,
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

    const overdueObligations = overdueResponse.data?.result || [];

    // Get urgent obligations (critical alert level)
    const urgentResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "search_read",
          args: [
            [
              ...domain,
              ["alert_level", "in", ["urgent", "critical"]],
              ["is_overdue", "=", false],
            ],
          ],
          kwargs: {
            fields: [
              "name",
              "obligation_type_id",
              "partner_id",
              "due_date",
              "days_until_due",
              "total_amount",
              "alert_level",
              "priority",
            ],
            order: "due_date asc",
            limit: 10,
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

    const urgentObligations = urgentResponse.data?.result || [];

    // Get upcoming obligations (next 30 days, warning level)
    const upcomingResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
          method: "search_read",
          args: [
            [
              ...domain,
              ["alert_level", "in", ["warning", "info"]],
              ["is_overdue", "=", false],
            ],
          ],
          kwargs: {
            fields: [
              "name",
              "obligation_type_id",
              "partner_id",
              "due_date",
              "days_until_due",
              "total_amount",
              "alert_level",
              "priority",
            ],
            order: "due_date asc",
            limit: 20,
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

    const upcomingObligations = upcomingResponse.data?.result || [];

    // Get statistics
    const statsResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.obligation",
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

    const totalCount = statsResponse.data?.result || 0;

    // Calculate total amounts
    const totalOverdueAmount = overdueObligations.reduce(
      (sum: number, ob: any) => sum + (ob.total_amount || 0),
      0
    );
    const totalUpcomingAmount =
      urgentObligations.reduce(
        (sum: number, ob: any) => sum + (ob.total_amount || 0),
        0
      ) +
      upcomingObligations.reduce(
        (sum: number, ob: any) => sum + (ob.total_amount || 0),
        0
      );

    return NextResponse.json({
      success: true,
      alerts: {
        overdue: {
          count: overdueObligations.length,
          total_amount: totalOverdueAmount,
          obligations: overdueObligations,
        },
        urgent: {
          count: urgentObligations.length,
          obligations: urgentObligations,
        },
        upcoming: {
          count: upcomingObligations.length,
          total_amount: totalUpcomingAmount,
          obligations: upcomingObligations,
        },
        statistics: {
          total_pending: totalCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Get fiscal alerts error:", error);

    let errorMessage = "Failed to fetch fiscal alerts";
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
