import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface CompanyInfo {
  id: number;
  name: string;
  siret?: string;
  vat_number?: string;
  address?: string;
}

export interface ImportResult {
  success: boolean;
  message?: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
}

export interface ExportResult {
  success: boolean;
  fec?: {
    content: string;
    filename: string;
  };
  ximport?: {
    content: string;
    filename: string;
  };
}

// Hooks
export function useProfile() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/settings/profile");
      return data.profile as UserProfile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<UserProfile>) => {
      const { data } = await axios.put("/api/settings/profile", profile);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
    },
  });
}

export function useCompanyInfo() {
  return useQuery({
    queryKey: ["settings", "company"],
    queryFn: async () => {
      const { data } = await axios.get("/api/settings/company");
      return data.company as CompanyInfo;
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (company: Partial<CompanyInfo>) => {
      const { data } = await axios.put("/api/settings/company", company);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "company"] });
    },
  });
}

export function useImportAccounting() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post("/api/accounting/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data as ImportResult;
    },
  });
}

export function useExportAccounting() {
  return useMutation({
    mutationFn: async (params: {
      dateFrom: string;
      dateTo: string;
      format: string;
    }) => {
      const { data } = await axios.post("/api/accounting/export", params);
      return data as ExportResult;
    },
  });
}
