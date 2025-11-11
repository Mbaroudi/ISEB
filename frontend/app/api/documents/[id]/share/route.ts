import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Create a share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      expiration_days = 7,
      password,
      shared_with_email,
      shared_with_name,
      can_download = true,
      can_preview = true,
      max_access_count = 0,
      notes,
    } = body;

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

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiration_days);

    // Create share
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.share",
          method: "create",
          args: [{
            document_id: parseInt(id),
            expiration_date: expirationDate.toISOString().replace('T', ' ').substring(0, 19),
            password: password || false,
            shared_with_email: shared_with_email || false,
            shared_with_name: shared_with_name || false,
            can_download,
            can_preview,
            max_access_count,
            notes: notes || false,
          }],
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

    if (!response.data?.result) {
      throw new Error("Failed to create share");
    }

    const shareId = response.data.result;

    // Get share data
    const shareDataResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.share",
          method: "read",
          args: [[shareId]],
          kwargs: {
            fields: [
              "id",
              "name",
              "access_token",
              "share_url",
              "expiration_date",
              "has_password",
              "can_download",
              "can_preview",
              "state",
            ],
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

    if (!shareDataResponse.data?.result || shareDataResponse.data.result.length === 0) {
      throw new Error("Failed to fetch share data");
    }

    return NextResponse.json({
      success: true,
      message: "Lien de partage créé",
      data: shareDataResponse.data.result[0],
    });
  } catch (error: any) {
    console.error("Create share error:", error);

    let errorMessage = "Failed to create share";
    if (error.response?.data?.error?.data?.message) {
      errorMessage = error.response.data.error.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// Get all shares for a document
export async function GET(
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

    // Get shares
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.share",
          method: "search_read",
          args: [[["document_id", "=", parseInt(id)]]],
          kwargs: {
            fields: [
              "id",
              "name",
              "access_token",
              "share_url",
              "expiration_date",
              "is_expired",
              "access_count",
              "max_access_count",
              "has_password",
              "can_download",
              "can_preview",
              "shared_with_email",
              "shared_with_name",
              "state",
              "create_date",
              "last_access_date",
            ],
            order: "create_date desc",
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

    if (!response.data?.result) {
      return NextResponse.json([]);
    }

    return NextResponse.json(response.data.result);
  } catch (error: any) {
    console.error("Get shares error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get shares" },
      { status: 500 }
    );
  }
}
