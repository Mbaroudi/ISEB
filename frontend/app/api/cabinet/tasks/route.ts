import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/cabinet/tasks
 * List cabinet tasks with filters
 */
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get("partner_id");
    const state = searchParams.get("state");
    const priority = searchParams.get("priority");
    const taskType = searchParams.get("task_type");
    const assignedToId = searchParams.get("assigned_to_id");
    const overdue = searchParams.get("overdue");
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

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

    // Build domain filters
    const domain: any[] = [];

    if (partnerId) {
      domain.push(["partner_id", "=", parseInt(partnerId)]);
    }

    if (state) {
      domain.push(["state", "=", state]);
    }

    if (priority) {
      domain.push(["priority", "=", priority]);
    }

    if (taskType) {
      domain.push(["task_type", "=", taskType]);
    }

    if (assignedToId) {
      domain.push(["assigned_to_id", "=", parseInt(assignedToId)]);
    }

    if (overdue === "true") {
      domain.push(["is_overdue", "=", true]);
    }

    // Search tasks
    const searchResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "search_read",
          args: [domain],
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
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: "deadline asc, priority desc, id desc",
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

    const tasks = searchResponse.data?.result || [];

    // Get total count
    const countResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "search_count",
          args: [domain],
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

    const total = countResponse.data?.result || 0;

    return NextResponse.json({
      success: true,
      tasks,
      total,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error("Get cabinet tasks error:", error);

    let errorMessage = "Failed to fetch cabinet tasks";
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
 * POST /api/cabinet/tasks
 * Create a new cabinet task
 */
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

    const {
      name,
      description,
      partner_id,
      assigned_to_id,
      state,
      priority,
      deadline,
      task_type,
      document_id,
      expense_id,
      tva_declaration_id,
      estimated_hours,
      internal_notes,
    } = body;

    // Validate required fields
    if (!name || !partner_id) {
      return NextResponse.json(
        {
          success: false,
          error: "name and partner_id are required",
        },
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

    // Create task
    const createResponse = await axios.post(
      `${odooUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "cabinet.task",
          method: "create",
          args: [
            {
              name,
              description: description || false,
              partner_id: parseInt(partner_id),
              assigned_to_id: assigned_to_id ? parseInt(assigned_to_id) : false,
              state: state || "todo",
              priority: priority || "1",
              deadline: deadline || false,
              task_type: task_type || "other",
              document_id: document_id ? parseInt(document_id) : false,
              expense_id: expense_id ? parseInt(expense_id) : false,
              tva_declaration_id: tva_declaration_id
                ? parseInt(tva_declaration_id)
                : false,
              estimated_hours: estimated_hours ? parseFloat(estimated_hours) : 0,
              internal_notes: internal_notes || false,
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

    const taskId = createResponse.data?.result;

    if (!taskId) {
      throw new Error("Failed to create task");
    }

    // Fetch the created task with all fields
    const readResponse = await axios.post(
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

    const task = readResponse.data?.result?.[0];

    return NextResponse.json({
      success: true,
      task,
      message: "Tâche créée avec succès",
    });
  } catch (error: any) {
    console.error("Create cabinet task error:", error);

    let errorMessage = "Failed to create cabinet task";
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
