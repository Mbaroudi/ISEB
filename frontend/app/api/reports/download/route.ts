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

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type");
    const period = searchParams.get("period");
    const reportId = searchParams.get("reportId");

    if (!reportType || !period) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    // Authenticate
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

    const year = parseInt(period);
    const dateFrom = `${year}-01-01`;
    const dateTo = `${year}-12-31`;

    // FEC Export
    if (reportType === "fec") {
      // Get the FEC record with file data
      const fecResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "fec.export",
            method: "search_read",
            args: [
              [["company_id", "=", user.company_id[0]]],
              ["id", "name", "fec_file", "filename"]
            ],
            kwargs: {
              order: "create_date desc",
              limit: 1,
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

      if (
        fecResponse.data?.result &&
        fecResponse.data.result.length > 0 &&
        fecResponse.data.result[0].fec_file
      ) {
        const fecData = fecResponse.data.result[0];
        const buffer = Buffer.from(fecData.fec_file, "base64");
        const filename = fecData.filename || `FEC_${year}.txt`;

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // Balance Sheet (Bilan) - Generate PDF
    if (reportType === "balance" && reportId) {
      const reportResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "account.report",
            method: "export_to_pdf",
            args: [parseInt(reportId)],
            kwargs: {
              options: {
                date_from: dateFrom,
                date_to: dateTo,
                unfold_all: false,
                all_entries: false,
              },
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

      if (reportResponse.data?.result) {
        const pdfData = reportResponse.data.result;
        const buffer = Buffer.from(pdfData, "base64");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Bilan_${year}.pdf"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // Profit & Loss (Compte de résultat) - Generate PDF
    if (reportType === "profit" && reportId) {
      const reportResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "account.report",
            method: "export_to_pdf",
            args: [parseInt(reportId)],
            kwargs: {
              options: {
                date_from: dateFrom,
                date_to: dateTo,
                unfold_all: false,
                all_entries: false,
              },
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

      if (reportResponse.data?.result) {
        const pdfData = reportResponse.data.result;
        const buffer = Buffer.from(pdfData, "base64");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Compte_Resultat_${year}.pdf"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // VAT Declaration - Generate PDF
    if (reportType === "vat" && reportId) {
      const reportResponse = await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "account.report",
            method: "export_to_pdf",
            args: [parseInt(reportId)],
            kwargs: {
              options: {
                date_from: dateFrom,
                date_to: dateTo,
                unfold_all: false,
                all_entries: false,
              },
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

      if (reportResponse.data?.result) {
        const pdfData = reportResponse.data.result;
        const buffer = Buffer.from(pdfData, "base64");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Declaration_TVA_${year}.pdf"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Report not found or not ready" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Report download error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download report" },
      { status: 500 }
    );
  }
}
