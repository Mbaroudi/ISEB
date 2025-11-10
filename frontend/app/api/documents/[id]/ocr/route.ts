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

    // Call OCR extraction method
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document",
          method: "action_extract_data_ocr",
          args: [[parseInt(id)]],
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
      throw new Error("OCR extraction failed");
    }

    // The result is an action dict, we need to get the OCR result ID
    const action = response.data.result;
    const ocrResultId = action.res_id;

    // Fetch the OCR result data
    const ocrDataResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.ocr",
          method: "read",
          args: [[ocrResultId]],
          kwargs: {
            fields: [
              "invoice_number",
              "invoice_date",
              "due_date",
              "supplier_name",
              "supplier_vat",
              "supplier_address",
              "amount_untaxed",
              "amount_tax",
              "amount_total",
              "currency",
              "confidence_score",
              "state",
              "processing_time",
              "raw_text",
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

    if (!ocrDataResponse.data?.result || ocrDataResponse.data.result.length === 0) {
      throw new Error("Failed to fetch OCR result");
    }

    const ocrData = ocrDataResponse.data.result[0];

    return NextResponse.json({
      success: true,
      message: "Extraction OCR terminée",
      data: {
        id: ocrData.id,
        invoice_number: ocrData.invoice_number,
        invoice_date: ocrData.invoice_date,
        due_date: ocrData.due_date,
        supplier_name: ocrData.supplier_name,
        supplier_vat: ocrData.supplier_vat,
        supplier_address: ocrData.supplier_address,
        amount_untaxed: ocrData.amount_untaxed,
        amount_tax: ocrData.amount_tax,
        amount_total: ocrData.amount_total,
        currency: ocrData.currency,
        confidence_score: ocrData.confidence_score,
        state: ocrData.state,
        processing_time: ocrData.processing_time,
        raw_text: ocrData.raw_text,
      },
    });
  } catch (error: any) {
    console.error("OCR extraction error:", error);

    // Try to extract a meaningful error message
    let errorMessage = "Failed to extract data";
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

// GET method to retrieve OCR results for a document
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

    // Get OCR results for document
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document.ocr",
          method: "search_read",
          args: [[["document_id", "=", parseInt(id)]]],
          kwargs: {
            fields: [
              "id",
              "invoice_number",
              "invoice_date",
              "due_date",
              "supplier_name",
              "supplier_vat",
              "amount_untaxed",
              "amount_tax",
              "amount_total",
              "currency",
              "confidence_score",
              "state",
              "create_date",
              "processing_time",
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
    console.error("Get OCR results error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get OCR results" },
      { status: 500 }
    );
  }
}
