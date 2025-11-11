import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    const odooResponse = await axios.post(
      `${odooUrl}/web/session/authenticate`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: odooDb,
          login: username,
          password: password,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (!odooResponse.data || !odooResponse.data.result || !odooResponse.data.result.uid) {
      throw new Error("Invalid credentials");
    }

    const authResponse = odooResponse.data.result;

    const userData = {
      id: authResponse.uid,
      login: authResponse.username || username,
      name: authResponse.name || authResponse.username || username,
      email: `${authResponse.username || username}@example.com`,
      company_id: [authResponse.user_companies?.current_company || 1, "Company"],
      partner_id: [authResponse.partner_id || 1, "Partner"],
    };

    const response = NextResponse.json({ user: userData });

    response.cookies.set("auth_session", JSON.stringify({ username, password }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
