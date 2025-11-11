import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/cabinet/workload
 * Get workload distribution across users/team members
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
    const userId = searchParams.get("user_id");
    const includeCompleted = searchParams.get("include_completed") === "true";

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

    // Build domain for tasks
    const domain: any[] = [];

    if (userId) {
      domain.push(["assigned_to_id", "=", parseInt(userId)]);
    }

    if (!includeCompleted) {
      domain.push(["state", "not in", ["done", "cancelled"]]);
    }

    // Get all tasks
    const tasksResponse = await axios.post(
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
              "assigned_to_id",
              "state",
              "priority",
              "deadline",
              "is_overdue",
              "task_type",
              "estimated_hours",
              "spent_hours",
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

    const tasks = tasksResponse.data?.result || [];

    // Group tasks by user
    const workloadByUser: Record<
      number,
      {
        user_id: number;
        user_name: string;
        total_tasks: number;
        todo_tasks: number;
        in_progress_tasks: number;
        done_tasks: number;
        overdue_tasks: number;
        high_priority_tasks: number;
        total_estimated_hours: number;
        total_spent_hours: number;
        tasks_by_type: Record<string, number>;
      }
    > = {};

    tasks.forEach((task: any) => {
      const userId = task.assigned_to_id ? task.assigned_to_id[0] : 0;
      const userName = task.assigned_to_id ? task.assigned_to_id[1] : "Unassigned";

      if (!workloadByUser[userId]) {
        workloadByUser[userId] = {
          user_id: userId,
          user_name: userName,
          total_tasks: 0,
          todo_tasks: 0,
          in_progress_tasks: 0,
          done_tasks: 0,
          overdue_tasks: 0,
          high_priority_tasks: 0,
          total_estimated_hours: 0,
          total_spent_hours: 0,
          tasks_by_type: {},
        };
      }

      const userWorkload = workloadByUser[userId];
      userWorkload.total_tasks++;

      if (task.state === "todo") userWorkload.todo_tasks++;
      if (task.state === "in_progress") userWorkload.in_progress_tasks++;
      if (task.state === "done") userWorkload.done_tasks++;
      if (task.is_overdue) userWorkload.overdue_tasks++;
      if (task.priority === "2" || task.priority === "3")
        userWorkload.high_priority_tasks++;

      userWorkload.total_estimated_hours += task.estimated_hours || 0;
      userWorkload.total_spent_hours += task.spent_hours || 0;

      // Count by task type
      const taskType = task.task_type || "other";
      if (!userWorkload.tasks_by_type[taskType]) {
        userWorkload.tasks_by_type[taskType] = 0;
      }
      userWorkload.tasks_by_type[taskType]++;
    });

    // Convert to array
    const workload = Object.values(workloadByUser);

    // Calculate overall stats
    const overallStats = {
      total_tasks: tasks.length,
      total_users: workload.length,
      total_estimated_hours: workload.reduce(
        (sum, w) => sum + w.total_estimated_hours,
        0
      ),
      total_spent_hours: workload.reduce((sum, w) => sum + w.total_spent_hours, 0),
      total_overdue: workload.reduce((sum, w) => sum + w.overdue_tasks, 0),
      total_high_priority: workload.reduce(
        (sum, w) => sum + w.high_priority_tasks,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      workload,
      overall_stats: overallStats,
    });
  } catch (error: any) {
    console.error("Get cabinet workload error:", error);

    let errorMessage = "Failed to fetch cabinet workload";
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
