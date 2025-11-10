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

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    // Get search parameters from request body
    const body = await request.json();
    const {
      search_term,
      document_type,
      category_id,
      tag_ids,
      date_from,
      date_to,
      amount_min,
      amount_max,
      state,
      is_expired,
      partner_id,
      archived,
    } = body;

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

    // Build search domain
    const partnerIdValue = partner_id || (Array.isArray(user.partner_id) ? user.partner_id[0] : user.partner_id);
    const domain: any[] = [
      ['partner_id', '=', partnerIdValue]
    ];

    // Add search term if provided
    if (search_term) {
      domain.push('|', '|', '|', '|');
      domain.push(['name', 'ilike', search_term]);
      domain.push(['reference', 'ilike', search_term]);
      domain.push(['notes', 'ilike', search_term]);
      domain.push(['search_keywords', 'ilike', search_term]);
      domain.push(['description', 'ilike', search_term]);
    }

    // Add filters
    if (document_type) {
      domain.push(['document_type', '=', document_type]);
    }

    if (category_id) {
      domain.push(['category_id', '=', category_id]);
    }

    if (tag_ids && tag_ids.length > 0) {
      domain.push(['tag_ids', 'in', tag_ids]);
    }

    if (date_from) {
      domain.push(['document_date', '>=', date_from]);
    }

    if (date_to) {
      domain.push(['document_date', '<=', date_to]);
    }

    if (amount_min !== undefined && amount_min !== null) {
      domain.push(['amount_total', '>=', amount_min]);
    }

    if (amount_max !== undefined && amount_max !== null) {
      domain.push(['amount_total', '<=', amount_max]);
    }

    if (state) {
      domain.push(['state', '=', state]);
    }

    if (is_expired !== undefined && is_expired !== null) {
      domain.push(['is_expired', '=', is_expired]);
    }

    // Handle archived filter
    if (archived === false) {
      domain.push(['active', '=', true]);
    } else if (archived === true) {
      domain.push(['active', '=', false]);
    }
    // If archived is undefined, show both

    // Search documents
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: [
              "id",
              "name",
              "reference",
              "partner_id",
              "document_type",
              "category_id",
              "tag_ids",
              "document_date",
              "amount_total",
              "currency_id",
              "supplier_id",
              "upload_date",
              "state",
              "notes",
              "description",
              "is_expired",
              "expiration_date",
              "active",
              "archived_date",
              "download_count",
              "view_count",
              "filename",
              "file_size",
            ],
            order: "document_date desc, upload_date desc",
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
    console.error("Document search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search documents" },
      { status: 500 }
    );
  }
}
