import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface Document {
  id: number;
  name: string;
  reference: string;
  document_type: string;
  category_id: [number, string] | false;
  tag_ids: [number[], string[]];
  document_date: string;
  amount_total: number;
  currency_id: [number, string];
  supplier_id: [number, string] | false;
  upload_date: string;
  state: string;
  is_expired: boolean;
  active: boolean;
  download_count: number;
  view_count: number;
  filename: string;
  file_size: number;
  file_data?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: number;
}

export interface Category {
  id: number;
  name: string;
  complete_name: string;
  parent_id: [number, string] | false;
  document_count: number;
}

export interface DocumentSearchParams {
  search_term?: string;
  document_type?: string;
  category_id?: number;
  tag_ids?: number[];
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  state?: string;
  archived?: boolean;
}

export interface UploadDocumentData {
  name: string;
  document_type: string;
  file_data: string;
  description?: string;
  category_id?: number;
  tag_ids?: number[];
}

export interface OCRResult {
  document_id: number;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  supplier_vat: string;
  supplier_address: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  confidence_score: number;
  extracted_text: string;
}

// Hooks
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await axios.post("/api/documents/search", {});
      return (data || []) as Document[];
    },
  });
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/documents/${id}`);
      return data as Document;
    },
    enabled: !!id,
  });
}

export function useSearchDocuments(params: DocumentSearchParams) {
  return useQuery({
    queryKey: ["documents", "search", params],
    queryFn: async () => {
      const { data } = await axios.post("/api/documents/search", params);
      return (data || []) as Document[];
    },
  });
}

export function useDocumentTags() {
  return useQuery({
    queryKey: ["documents", "tags"],
    queryFn: async () => {
      const { data } = await axios.get("/api/documents/tags");
      return data as Tag[];
    },
  });
}

export function useDocumentCategories() {
  return useQuery({
    queryKey: ["documents", "categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/documents/categories");
      return data as Category[];
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (document: UploadDocumentData) => {
      const { data } = await axios.post("/api/documents/upload", document);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.delete(`/api/documents/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useArchiveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: number; archive: boolean }) => {
      const { data } = await axios.post(`/api/documents/${id}/archive`, { archive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useExtractOCR() {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.post(`/api/documents/${id}/ocr`);
      return data as OCRResult;
    },
  });
}

export function useApplyOCR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ocrData }: { id: number; ocrData: OCRResult }) => {
      const { data } = await axios.post(`/api/documents/${id}/apply-ocr`, ocrData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.get(`/api/documents/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    },
  });
}
