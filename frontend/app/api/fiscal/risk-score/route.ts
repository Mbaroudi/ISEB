import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/fiscal/risk-score
 * Get fiscal risk score for current user's partner or specific partner
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
    const userId = authResponse.data.result.uid;

    let targetPartnerId = partnerId ? parseInt(partnerId) : null;

    // If no partner_id provided, get current user's partner
    if (!targetPartnerId) {
      const userResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "res.users",
            method: "read",
            args: [[userId]],
            kwargs: {
              fields: ["partner_id"],
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

      const user = userResponse.data?.result?.[0];
      if (!user || !user.partner_id) {
        throw new Error("User partner not found");
      }

      targetPartnerId = user.partner_id[0];
    }

    // Read partner with fiscal risk fields
    const partnerResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "res.partner",
          method: "read",
          args: [[targetPartnerId]],
          kwargs: {
            fields: [
              "name",
              "fiscal_risk_score",
              "fiscal_risk_level",
              "fiscal_risk_color",
              "late_obligations_count",
              "late_obligations_amount",
              "total_penalties_amount",
              "average_payment_delay",
              "compliance_rate",
              "last_risk_check_date",
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

    const partner = partnerResponse.data?.result?.[0];

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    // Get risk history
    const historyResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.risk.history",
          method: "search_read",
          args: [[["partner_id", "=", targetPartnerId]]],
          kwargs: {
            fields: [
              "date",
              "score",
              "level",
              "late_count",
              "penalties_amount",
              "notes",
            ],
            order: "date desc",
            limit: 12, // Last 12 entries for chart
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

    const history = historyResponse.data?.result || [];

    return NextResponse.json({
      success: true,
      risk_score: {
        partner_id: targetPartnerId,
        partner_name: partner.name,
        score: partner.fiscal_risk_score,
        level: partner.fiscal_risk_level,
        color: partner.fiscal_risk_color,
        statistics: {
          late_obligations_count: partner.late_obligations_count,
          late_obligations_amount: partner.late_obligations_amount,
          total_penalties_amount: partner.total_penalties_amount,
          average_payment_delay: partner.average_payment_delay,
          compliance_rate: partner.compliance_rate,
        },
        last_check_date: partner.last_risk_check_date,
        history: history.reverse(), // Oldest first for chart
      },
    });
  } catch (error: any) {
    console.error("Get fiscal risk score error:", error);

    let errorMessage = "Failed to fetch fiscal risk score";
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
