import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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
    const { tag_ids } = body; // Array of tag IDs

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

    const cookies = authResponse.headers['set-cookie'];
    const sessionCookie = cookies ? cookies.join('; ') : '';

    // Update document tags
    // Use [(6, 0, [ids])] to replace all tags
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document",
          method: "write",
          args: [
            [parseInt(id)],
            {
              tag_ids: [[6, 0, tag_ids || []]]
            }
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

    return NextResponse.json({
      success: true,
      message: "Tags mis à jour"
    });
  } catch (error: any) {
    console.error("Update tags error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update tags" },
      { status: 500 }
    );
  }
}
