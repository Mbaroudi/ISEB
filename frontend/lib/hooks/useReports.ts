import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface ReportTemplate {
  id: number;
  name: string;
  code: string;
  template_type: string;
  description: string;
  active: boolean;
  frequency: string;
  line_ids: number[];
}

export interface ReportTemplateLine {
  id: number;
  sequence: number;
  name: string;
  code: string;
  line_type: string;
  account_domain: string;
  formula: string | false;
  style: string;
}

// Hooks
export function useReportTemplates(type?: string) {
  return useQuery({
    queryKey: ["reports", "templates", type],
    queryFn: async () => {
      const { data } = await axios.get("/api/reports/templates", {
        params: type ? { type } : {},
      });
      return data.templates as ReportTemplate[];
    },
  });
}

export function useReportTemplate(id: number) {
  return useQuery({
    queryKey: ["reports", "template", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/reports/templates/${id}`);
      return data.template;
    },
    enabled: !!id,
  });
}

export function useCreateReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: any) => {
      const { data } = await axios.post("/api/reports/templates", templateData);
      return data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "templates"] });
    },
  });
}

export function useUpdateReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const { data } = await axios.put(`/api/reports/templates/${id}`, updates);
      return data.template;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["reports", "template", id] });
      queryClient.invalidateQueries({ queryKey: ["reports", "templates"] });
    },
  });
}

export function useReportHistory(filters?: {
  template_id?: number;
  partner_id?: number;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["reports", "history", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/reports/history", {
        params: filters,
      });
      return data.history;
    },
  });
}

export function useScheduleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData: {
      template_id: number;
      partner_id: number;
      frequency: string;
      send_email?: boolean;
    }) => {
      const { data } = await axios.post("/api/reports/schedule", scheduleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "templates"] });
    },
  });
}

export function useShareReport() {
  return useMutation({
    mutationFn: async ({
      reportId,
      partner_ids,
      message,
      send_email,
    }: {
      reportId: number;
      partner_ids?: string;
      message?: string;
      send_email?: boolean;
    }) => {
      const { data } = await axios.post(`/api/reports/${reportId}/share`, {
        partner_ids,
        message,
        send_email,
      });
      return data;
    },
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      reportId,
      format,
      partner_id,
      period_start,
      period_end,
    }: {
      reportId: number;
      format: string;
      partner_id: number;
      period_start: string;
      period_end: string;
    }) => {
      const { data } = await axios.post(`/api/reports/${reportId}/export`, {
        format,
        partner_id,
        period_start,
        period_end,
      });
      return data;
    },
  });
}

export function useCompareReports() {
  return useMutation({
    mutationFn: async ({
      template_id,
      partner_id,
      periods,
    }: {
      template_id: number;
      partner_id: number;
      periods: Array<{ start_date: string; end_date: string; label?: string }>;
    }) => {
      const { data } = await axios.post("/api/reports/compare", {
        template_id,
        partner_id,
        periods,
      });
      return data;
    },
  });
}
