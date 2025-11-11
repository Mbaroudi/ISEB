import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const authSession = request.cookies.get("auth_session");
    const userData = request.cookies.get("user_data");

    if (!authSession || !userData) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const user = JSON.parse(userData.value);

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    // S'authentifier d'abord
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

    const cookies = authResponse.headers['set-cookie'];
    const sessionCookie = cookies ? cookies.join('; ') : '';

    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.dashboard",
          method: "search_read",
          args: [
            [["partner_id", "=", user.partner_id[0]]],
            [
              "cash_balance",
              "revenue_mtd",
              "revenue_ytd",
              "revenue_growth_mtd",
              "revenue_growth_ytd",
              "expenses_mtd",
              "expenses_ytd",
              "net_income_mtd",
              "net_income_ytd",
              "tva_due",
              "margin_rate",
              "receivable_amount",
              "payable_amount",
              "overdue_receivable",
              "overdue_payable",
            ],
          ],
          kwargs: {
            limit: 1,
            order: "compute_date desc",
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cookie": sessionCookie,
        },
        withCredentials: true,
      }
    );

    if (!response.data || !response.data.result || response.data.result.length === 0) {
      return NextResponse.json({
        cashBalance: 0,
        revenue: {
          current: 0,
          previous: 0,
          growth: 0,
        },
        expenses: {
          current: 0,
          previous: 0,
          growth: 0,
        },
        profit: {
          current: 0,
          previous: 0,
          growth: 0,
        },
        invoices: {
          draft: 0,
          pending: 0,
          paid: 0,
        },
      });
    }

    const dashboard = response.data.result[0];

    return NextResponse.json({
      cashBalance: dashboard.cash_balance || 0,
      revenue: {
        current: dashboard.revenue_mtd || 0,
        previous: dashboard.revenue_ytd || 0,
        growth: dashboard.revenue_growth_mtd || 0,
      },
      expenses: {
        current: dashboard.expenses_mtd || 0,
        previous: dashboard.expenses_ytd || 0,
        growth: 0,
      },
      profit: {
        current: dashboard.net_income_mtd || 0,
        previous: dashboard.net_income_ytd || 0,
        growth: 0,
      },
      invoices: {
        draft: 0,
        pending: Math.round((dashboard.receivable_amount || 0) / 1000),
        paid: Math.round((dashboard.revenue_mtd || 0) / 1000),
      },
      tva: {
        due: dashboard.tva_due || 0,
      },
      margin: dashboard.margin_rate || 0,
      receivables: dashboard.receivable_amount || 0,
      payables: dashboard.payable_amount || 0,
      overdueReceivables: dashboard.overdue_receivable || 0,
      overduePayables: dashboard.overdue_payable || 0,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
