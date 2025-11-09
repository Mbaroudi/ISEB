import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const { reportType, period } = body;

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

    // Pour le moment, créons un FEC export
    if (reportType === "fec") {
      const year = parseInt(period);
      const dateFrom = `${year}-01-01`;
      const dateTo = `${year}-12-31`;

      const response = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "fec.export",
            method: "create",
            args: [
              {
                name: `FEC ${year}`,
                date_from: dateFrom,
                date_to: dateTo,
                company_id: user.company_id[0],
              },
            ],
            kwargs: {},
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

      if (!response.data || !response.data.result) {
        throw new Error("Failed to create FEC export");
      }

      const fecId = response.data.result;

      // Générer le FEC
      await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "fec.export",
            method: "action_generate_fec",
            args: [[fecId]],
            kwargs: {},
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

      return NextResponse.json({ 
        id: fecId,
        success: true,
        message: "FEC généré avec succès"
      });
    }

    // Pour les autres types de rapports
    return NextResponse.json({ 
      success: true,
      message: `Rapport ${reportType} en cours de génération`
    });

  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
