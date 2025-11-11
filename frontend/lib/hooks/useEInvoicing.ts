import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface EInvoice {
  id: number;
  name: string;
  partner_id: [number, string];
  invoice_date: string;
  amount_total: number;
  currency_id: [number, string];
  state: string;
  einvoicing_status: string;
  einvoicing_format_id: [number, string] | false;
  einvoicing_sent_date: string | false;
  einvoicing_error: string | false;
}

export interface EInvoiceFormat {
  id: number;
  name: string;
  code: string;
  format_type: string;
  description: string;
  supported_countries: string[];
  mandatory_from_date: string | false;
}

export interface EInvoiceLog {
  id: number;
  invoice_id: [number, string];
  send_date: string;
  format_id: [number, string];
  status: string;
  error_message: string | false;
  chorus_pro_reference: string | false;
}

// Hooks
export function useEInvoices(filters?: {
  partner_id?: number;
  einvoicing_status?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["einvoicing", "invoices", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/einvoicing/invoices", {
        params: filters,
      });
      return data.invoices as EInvoice[];
    },
  });
}

export function useSendEInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, format_id }: { invoiceId: number; format_id?: number }) => {
      const { data } = await axios.post(`/api/einvoicing/invoices/${invoiceId}/send`, {
        format_id,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["einvoicing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["einvoicing", "logs"] });
    },
  });
}

export function useValidateEInvoice() {
  return useMutation({
    mutationFn: async ({ invoiceId, format_id }: { invoiceId: number; format_id?: number }) => {
      const { data } = await axios.post(`/api/einvoicing/invoices/${invoiceId}/validate`, {
        format_id,
      });
      return data;
    },
  });
}

export function useEInvoiceFormats() {
  return useQuery({
    queryKey: ["einvoicing", "formats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/einvoicing/formats");
      return data.formats as EInvoiceFormat[];
    },
  });
}

export function useEInvoiceLogs(invoiceId?: number) {
  return useQuery({
    queryKey: ["einvoicing", "logs", invoiceId],
    queryFn: async () => {
      const { data } = await axios.get("/api/einvoicing/logs", {
        params: invoiceId ? { invoice_id: invoiceId } : {},
      });
      return data.logs as EInvoiceLog[];
    },
  });
}

export function useEInvoiceConfig() {
  return useQuery({
    queryKey: ["einvoicing", "config"],
    queryFn: async () => {
      const { data } = await axios.get("/api/einvoicing/config");
      return data.config;
    },
  });
}

export function useUpdateEInvoiceConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configData: any) => {
      const { data } = await axios.put("/api/einvoicing/config", configData);
      return data.config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["einvoicing", "config"] });
    },
  });
}
