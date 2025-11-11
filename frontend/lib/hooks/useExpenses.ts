import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface ExpenseNote {
  id: number;
  name: string;
  partner_id: [number, string];
  expense_date: string;
  amount: number;
  currency_id: [number, string];
  category: string;
  state: string;
  description: string;
  receipt_attachment_id: [number, string] | false;
  validated_by_id: [number, string] | false;
  validated_date: string | false;
  rejection_reason: string | false;
}

// Hooks
export function useExpenses(filters?: {
  partner_id?: number;
  state?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/expenses", {
        params: filters,
      });
      return data.expenses as ExpenseNote[];
    },
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/expenses/${id}`);
      return data.expense as ExpenseNote;
    },
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData: any) => {
      const { data } = await axios.post("/api/expenses", expenseData);
      return data.expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const { data } = await axios.put(`/api/expenses/${id}`, updates);
      return data.expense;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useSubmitExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.post(`/api/expenses/${id}/submit`);
      return data.expense;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.post(`/api/expenses/${id}/approve`);
      return data.expense;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await axios.post(`/api/expenses/${id}/reject`, { reason });
      return data.expense;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
