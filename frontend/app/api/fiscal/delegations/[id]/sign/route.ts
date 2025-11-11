import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/fiscal/delegations/[id]/sign
 * Sign a payment delegation (client or accountant)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authSession = request.cookies.get("auth_session");

    if (!authSession) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const body = await request.json();

    const { signature_data, signer_role } = body;

    // Validate required fields
    if (!signature_data || !signer_role) {
      return NextResponse.json(
        {
          success: false,
          error: "signature_data and signer_role are required",
        },
        { status: 400 }
      );
    }

    if (!["client", "accountant"].includes(signer_role)) {
      return NextResponse.json(
        {
          success: false,
          error: "signer_role must be 'client' or 'accountant'",
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

    // Call action_sign method
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "action_sign",
          args: [[parseInt(id)]],
          kwargs: {
            signature_data,
            signer_role,
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

    // Fetch updated delegation
    const readResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fiscal.payment.delegation",
          method: "read",
          args: [[parseInt(id)]],
          kwargs: {
            fields: [
              "name",
              "partner_id",
              "state",
              "signed_by_client",
              "signed_by_accountant",
              "signature_date_client",
              "signature_date_accountant",
              "is_active",
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
      message: "Délégation signée avec succès",
    });
  } catch (error: any) {
    console.error("Sign delegation error:", error);

    let errorMessage = "Failed to sign delegation";
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
