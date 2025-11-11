import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface BankAccount {
  id: number;
  name: string;
  account_number: string;
  iban: string;
  bank_id: [number, string] | false;
  partner_id: [number, string];
  provider_id: [number, string] | false;
  balance: number;
  last_sync_date: string | false;
  sync_status: string;
  active: boolean;
}

export interface BankTransaction {
  id: number;
  name: string;
  date: string;
  amount: number;
  currency_id: [number, string];
  bank_account_id: [number, string];
  partner_id: [number, string] | false;
  description: string;
  reference: string;
  reconciled: boolean;
  move_id: [number, string] | false;
}

export interface BankProvider {
  id: number;
  name: string;
  code: string;
  api_type: string;
  logo: string;
  supported_countries: string[];
  description: string;
}

// Hooks
export function useBankAccounts(partnerId?: number) {
  return useQuery({
    queryKey: ["bank", "accounts", partnerId],
    queryFn: async () => {
      const { data } = await axios.get("/api/bank/accounts", {
        params: partnerId ? { partner_id: partnerId } : {},
      });
      return data.accounts as BankAccount[];
    },
  });
}

export function useBankAccount(id: number) {
  return useQuery({
    queryKey: ["bank", "account", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/bank/accounts/${id}`);
      return data.account as BankAccount;
    },
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountData: any) => {
      const { data } = await axios.post("/api/bank/accounts", accountData);
      return data.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "accounts"] });
    },
  });
}

export function useSyncAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: number) => {
      const { data } = await axios.post(`/api/bank/accounts/${accountId}/sync`);
      return data;
    },
    onSuccess: (_, accountId) => {
      queryClient.invalidateQueries({ queryKey: ["bank", "account", accountId] });
      queryClient.invalidateQueries({ queryKey: ["bank", "transactions"] });
    },
  });
}

export function useBankTransactions(filters?: {
  account_id?: number;
  start_date?: string;
  end_date?: string;
  reconciled?: boolean;
}) {
  return useQuery({
    queryKey: ["bank", "transactions", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/bank/transactions", {
        params: filters,
      });
      return data.transactions as BankTransaction[];
    },
  });
}

export function useReconcileTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      move_id,
      auto_reconcile,
    }: {
      transactionId: number;
      move_id?: number;
      auto_reconcile?: boolean;
    }) => {
      const { data } = await axios.post(
        `/api/bank/transactions/${transactionId}/reconcile`,
        { move_id, auto_reconcile }
      );
      return data.transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "transactions"] });
    },
  });
}

export function useBankProviders() {
  return useQuery({
    queryKey: ["bank", "providers"],
    queryFn: async () => {
      const { data } = await axios.get("/api/bank/providers");
      return data.providers as BankProvider[];
    },
  });
}

export function useConnectProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      partner_id,
      credentials,
    }: {
      providerId: number;
      partner_id: number;
      credentials?: any;
    }) => {
      const { data } = await axios.post(
        `/api/bank/providers/${providerId}/connect`,
        { partner_id, credentials }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "accounts"] });
    },
  });
}

export function useSyncLogs(accountId?: number) {
  return useQuery({
    queryKey: ["bank", "sync-logs", accountId],
    queryFn: async () => {
      const { data } = await axios.get("/api/bank/sync-logs", {
        params: accountId ? { account_id: accountId } : {},
      });
      return data.logs;
    },
  });
}
