import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  console.log("=== API UPLOAD START ===");
  try {
    const authSession = request.cookies.get("auth_session");
    const userData = request.cookies.get("user_data");

    console.log("Auth cookies present:", !!authSession, !!userData);

    if (!authSession || !userData) {
      console.error("Missing auth cookies");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const user = JSON.parse(userData.value);
    const body = await request.json();

    const { name, document_type, file_data, description } = body;
    
    console.log("Upload request:", {
      name,
      document_type,
      file_data_length: file_data?.length,
      description,
      user_partner_id: user.partner_id
    });

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    console.log("Authenticating with Odoo...", { odooUrl, odooDb, username: auth.username });

    // Première étape: s'authentifier
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
      console.error("Odoo auth failed:", authResponse.data);
      throw new Error("Authentication failed");
    }

    console.log("Odoo auth successful, uid:", authResponse.data.result.uid);

    // Récupérer le cookie de session
    const cookies = authResponse.headers['set-cookie'];
    const sessionCookie = cookies ? cookies.join('; ') : '';
    
    console.log("Session cookie obtained, creating document...");

    // Deuxième étape: créer le document avec la session authentifiée
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document",
          method: "create",
          args: [
            {
              name: name,
              document_type: document_type,
              file: file_data,
              filename: name,
              notes: description,
              partner_id: user.partner_id[0],
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
      throw new Error("Failed to create document");
    }

    return NextResponse.json({ id: response.data.result });
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
