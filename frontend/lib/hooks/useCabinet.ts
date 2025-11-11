import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface CabinetDashboard {
  id: number;
  name: string;
  total_clients: number;
  active_clients: number;
  clients_excellent: number;
  clients_warning: number;
  clients_critical: number;
  total_revenue_all: number;
  total_expenses_all: number;
  total_net_income: number;
  cabinet_revenue_mtd: number;
  cabinet_revenue_ytd: number;
  total_tasks: number;
  tasks_overdue: number;
  tasks_this_week: number;
  documents_pending: number;
  expenses_pending: number;
}

export interface CabinetClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  health_score: string;
  monthly_fee: number;
  contract_start_date: string;
  active: boolean;
}

export interface CabinetTask {
  id: number;
  name: string;
  description: string;
  partner_id: [number, string];
  assigned_to_id: [number, string] | false;
  state: string;
  priority: string;
  deadline: string | false;
  is_overdue: boolean;
  task_type: string;
}

// Hooks
export function useCabinetDashboard(refresh = false) {
  return useQuery({
    queryKey: ["cabinet", "dashboard", refresh],
    queryFn: async () => {
      const { data } = await axios.get("/api/cabinet/dashboard", {
        params: { refresh: refresh.toString() },
      });
      return data.dashboard as CabinetDashboard;
    },
  });
}

export function useCabinetClients(filters?: {
  health_score?: string;
  active?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["cabinet", "clients", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/cabinet/clients", {
        params: filters,
      });
      return data.clients as CabinetClient[];
    },
  });
}

export function useCabinetClient(id: number) {
  return useQuery({
    queryKey: ["cabinet", "client", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/cabinet/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCabinetTasks(filters?: {
  partner_id?: number;
  state?: string;
  priority?: string;
  overdue?: boolean;
}) {
  return useQuery({
    queryKey: ["cabinet", "tasks", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/cabinet/tasks", {
        params: filters,
      });
      return data.tasks as CabinetTask[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: any) => {
      const { data } = await axios.post("/api/cabinet/tasks", taskData);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinet", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["cabinet", "dashboard"] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const { data } = await axios.post(`/api/cabinet/tasks/${taskId}/complete`);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinet", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["cabinet", "dashboard"] });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, assigned_to_id }: { taskId: number; assigned_to_id: number }) => {
      const { data } = await axios.post(`/api/cabinet/tasks/${taskId}/assign`, {
        assigned_to_id,
      });
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinet", "tasks"] });
    },
  });
}

export function useCabinetWorkload(userId?: number) {
  return useQuery({
    queryKey: ["cabinet", "workload", userId],
    queryFn: async () => {
      const { data } = await axios.get("/api/cabinet/workload", {
        params: userId ? { user_id: userId } : {},
      });
      return data;
    },
  });
}
