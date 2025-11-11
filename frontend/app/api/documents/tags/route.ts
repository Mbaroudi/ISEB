import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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

    // Get tags
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.tag",
          method: "search_read",
          args: [[['active', '=', true]]],
          kwargs: {
            fields: ["id", "name", "color"],
            order: "name",
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
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSession = request.cookies.get("auth_session");

    if (!authSession) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const body = await request.json();

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

    // Create tag
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.tag",
          method: "create",
          args: [{
            name: body.name,
            color: body.color || 0,
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
      throw new Error("Failed to create tag");
    }

    return NextResponse.json({ id: response.data.result, ...body });
  } catch (error: any) {
    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tag" },
      { status: 500 }
    );
  }
}
