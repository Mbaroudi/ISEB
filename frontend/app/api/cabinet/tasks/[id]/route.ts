import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/cabinet/tasks/[id]
 * Get task details
 */
export async function GET(
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

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
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

    // Read task
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

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error("Get task error:", error);

    let errorMessage = "Failed to fetch task";
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

/**
 * PUT /api/cabinet/tasks/[id]
 * Update task
 */
export async function PUT(
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

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
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

    // Build update values
    const updateValues: any = {};

    if (body.name !== undefined) updateValues.name = body.name;
    if (body.description !== undefined)
      updateValues.description = body.description || false;
    if (body.partner_id !== undefined)
      updateValues.partner_id = parseInt(body.partner_id);
    if (body.assigned_to_id !== undefined)
      updateValues.assigned_to_id = body.assigned_to_id
        ? parseInt(body.assigned_to_id)
        : false;
    if (body.state !== undefined) updateValues.state = body.state;
    if (body.priority !== undefined) updateValues.priority = body.priority;
    if (body.deadline !== undefined)
      updateValues.deadline = body.deadline || false;
    if (body.task_type !== undefined) updateValues.task_type = body.task_type;
    if (body.document_id !== undefined)
      updateValues.document_id = body.document_id
        ? parseInt(body.document_id)
        : false;
    if (body.expense_id !== undefined)
      updateValues.expense_id = body.expense_id
        ? parseInt(body.expense_id)
        : false;
    if (body.estimated_hours !== undefined)
      updateValues.estimated_hours = parseFloat(body.estimated_hours);
    if (body.spent_hours !== undefined)
      updateValues.spent_hours = parseFloat(body.spent_hours);
    if (body.internal_notes !== undefined)
      updateValues.internal_notes = body.internal_notes || false;

    // Update task
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "write",
          args: [[taskId], updateValues],
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
      message: "Tâche mise à jour avec succès",
    });
  } catch (error: any) {
    console.error("Update task error:", error);

    let errorMessage = "Failed to update task";
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

/**
 * DELETE /api/cabinet/tasks/[id]
 * Delete task
 */
export async function DELETE(
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

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
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

    // Delete task
    await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "unlink",
          args: [[taskId]],
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

    return NextResponse.json({
      success: true,
      message: "Tâche supprimée avec succès",
    });
  } catch (error: any) {
    console.error("Delete task error:", error);

    let errorMessage = "Failed to delete task";
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
