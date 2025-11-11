import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/cabinet/tasks/[id]/assign
 * Assign task to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authSession = request.cookies.get("auth_session");

    if (!authSession) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);
    const taskId = parseInt(params.id);
    const body = await request.json();

    const { assigned_to_id } = body;

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    if (!assigned_to_id) {
      return NextResponse.json(
        { error: "assigned_to_id is required" },
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

    // Update task assignment
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "write",
          args: [
            [taskId],
            {
              assigned_to_id: parseInt(assigned_to_id),
            },
          ],
          kwargs: {},
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

    // Read updated task
    const taskResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "read",
          args: [[taskId]],
          kwargs: {
            fields: [
              "name",
              "description",
              "partner_id",
              "assigned_to_id",
              "company_id",
              "state",
              "priority",
              "deadline",
              "is_overdue",
              "started_date",
              "completed_date",
              "task_type",
              "document_id",
              "expense_id",
              "tva_declaration_id",
              "estimated_hours",
              "spent_hours",
              "internal_notes",
              "create_date",
              "write_date",
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

    const task = taskResponse.data?.result?.[0];

    return NextResponse.json({
      success: true,
      task,
      message: "Tâche assignée avec succès",
    });
  } catch (error: any) {
    console.error("Assign task error:", error);

    let errorMessage = "Failed to assign task";
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
