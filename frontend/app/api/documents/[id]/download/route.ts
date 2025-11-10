import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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

    // Get document with file data
    const response = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "client.document",
          method: "read",
          args: [[parseInt(id)]],
          kwargs: {
            fields: ["filename", "file", "document_type"],
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

    if (!response.data?.result || response.data.result.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = response.data.result[0];

    const fileData = document.file || document.file_data;
    
    if (!fileData) {
      return NextResponse.json(
        { error: "No file data available" },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Determine content type based on file extension
    const filename = document.filename || `document-${id}`;
    let contentType = 'application/octet-stream';

    if (filename.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filename.toLowerCase().match(/\.(jpg|jpeg)$/)) {
      contentType = 'image/jpeg';
    } else if (filename.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    }

    // Return file as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Download document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download document" },
      { status: 500 }
    );
  }
}
