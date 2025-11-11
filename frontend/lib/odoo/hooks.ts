import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOdooClient } from "./client";
import type {
  Document,
  ExpenseNote,
  DashboardStats,
  AccountMove,
} from "./types";

/**
 * Hook to get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await fetch("/api/dashboard/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();

      return {
        balance: data.cashBalance || 0,
        revenue_month: data.revenue?.current || 0,
        expenses_month: data.expenses?.current || 0,
        pending_invoices: data.invoices?.pending || 0,
        revenue_chart_data: [
          { date: "Jan", amount: 6500 },
          { date: "Fev", amount: 7200 },
          { date: "Mar", amount: 8230 },
          { date: "Avr", amount: 7800 },
          { date: "Mai", amount: 8900 },
          { date: "Jun", amount: 9200 },
        ],
        expenses_chart_data: [
          { date: "Jan", amount: 2800 },
          { date: "Fev", amount: 3100 },
          { date: "Mar", amount: 3120 },
          { date: "Avr", amount: 2900 },
          { date: "Mai", amount: 3400 },
          { date: "Jun", amount: 3200 },
        ],
      };
    },
  });
}

/**
 * Hook to get documents list
 */
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<Document[]> => {
      const response = await fetch("/api/documents/list");
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const documents = await response.json();
      return documents;
    },
  });
}

/**
 * Hook to upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      document_type: string;
      file_data: string;
      description?: string;
    }) => {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const result = await response.json();
      return result.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

/**
 * Hook to get expense notes
 */
export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async (): Promise<ExpenseNote[]> => {
      const odoo = getOdooClient();

      const expenses = await odoo.searchRead({
        model: "expense.note",
        domain: [],
        fields: [
          "id",
          "name",
          "date",
          "amount",
          "category",
          "description",
          "state",
          "receipt_image",
        ],
        limit: 50,
        order: "date desc",
      });

      return expenses;
    },
  });
}

/**
 * Hook to create an expense note
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      date: string;
      amount: number;
      category?: string;
      description?: string;
      receipt_image?: string;
    }) => {
      const odoo = getOdooClient();

      const expenseId = await odoo.create({
        model: "expense.note",
        values: data,
      });

      return expenseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

/**
 * Hook to get invoices
 */
export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async (): Promise<AccountMove[]> => {
      const odoo = getOdooClient();

      const invoices = await odoo.searchRead({
        model: "account.move",
        domain: [["move_type", "=", "out_invoice"]],
        fields: [
          "id",
          "name",
          "date",
          "invoice_date",
          "partner_id",
          "amount_total",
          "amount_tax",
          "amount_untaxed",
          "state",
          "payment_state",
        ],
        limit: 20,
        order: "date desc",
      });

      return invoices;
    },
  });
}

/**
 * Hook to get revenue chart data
 */
export function useRevenueChart() {
  return useQuery({
    queryKey: ["charts", "revenue"],
    queryFn: async () => {
      // TODO: Implement real query
      return [
        { date: "Jan", amount: 6500 },
        { date: "Fev", amount: 7200 },
        { date: "Mar", amount: 8230 },
        { date: "Avr", amount: 7800 },
        { date: "Mai", amount: 8900 },
        { date: "Jun", amount: 9200 },
      ];
    },
  });
}

/**
 * Hook to get expenses chart data
 */
export function useExpensesChart() {
  return useQuery({
    queryKey: ["charts", "expenses"],
    queryFn: async () => {
      // TODO: Implement real query
      return [
        { name: "Charges sociales", value: 1200 },
        { name: "Loyer", value: 800 },
        { name: "Fournitures", value: 320 },
        { name: "Déplacements", value: 450 },
        { name: "Autres", value: 350 },
      ];
    },
  });
}
