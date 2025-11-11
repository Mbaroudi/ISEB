import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface FiscalObligation {
  id: number;
  name: string;
  obligation_type_id: [number, string];
  partner_id: [number, string];
  due_date: string;
  state: string;
  alert_level: string;
  is_overdue: boolean;
  days_until_due: number;
  total_amount: number;
  priority: string;
}

export interface RiskScore {
  score: number;
  level: string;
  color: number;
  statistics: {
    late_obligations_count: number;
    late_obligations_amount: number;
    total_penalties_amount: number;
    average_payment_delay: number;
    compliance_rate: number;
  };
}

export interface FiscalAlerts {
  overdue: {
    count: number;
    total_amount: number;
    obligations: FiscalObligation[];
  };
  urgent: {
    count: number;
    obligations: FiscalObligation[];
  };
  upcoming: {
    count: number;
    total_amount: number;
    obligations: FiscalObligation[];
  };
  statistics: {
    total_pending: number;
  };
}

export interface FiscalDelegation {
  id: number;
  name: string;
  partner_id: [number, string];
  delegated_to_id: [number, string];
  delegation_type: string;
  start_date: string;
  end_date: string | false;
  is_active: boolean;
  scope: string;
}

// Hooks
export function useFiscalAlerts() {
  return useQuery({
    queryKey: ["fiscal", "alerts"],
    queryFn: async () => {
      const { data } = await axios.get("/api/fiscal/alerts");
      return data.alerts as FiscalAlerts;
    },
  });
}

export function useRiskScore() {
  return useQuery({
    queryKey: ["fiscal", "risk-score"],
    queryFn: async () => {
      const { data } = await axios.get("/api/fiscal/risk-score");
      return data.risk_score as RiskScore;
    },
  });
}

export function useFiscalObligations(state?: string) {
  return useQuery({
    queryKey: ["fiscal", "obligations", state],
    queryFn: async () => {
      const params = state && state !== "all" ? { state } : {};
      const { data } = await axios.get("/api/fiscal/obligations", { params });
      return (data.obligations || []) as FiscalObligation[];
    },
  });
}

export function useObligation(id: number) {
  return useQuery({
    queryKey: ["fiscal", "obligations", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/fiscal/obligations/${id}`);
      return data.obligation as FiscalObligation;
    },
    enabled: !!id,
  });
}

export function useCreateObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (obligation: Partial<FiscalObligation>) => {
      const { data } = await axios.post("/api/fiscal/obligations", obligation);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal", "obligations"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal", "risk-score"] });
    },
  });
}

export function usePayObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.post(`/api/fiscal/obligations/${id}/pay`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal", "obligations"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal", "risk-score"] });
    },
  });
}

export function useDelegations() {
  return useQuery({
    queryKey: ["fiscal", "delegations"],
    queryFn: async () => {
      const { data } = await axios.get("/api/fiscal/delegations");
      return (data.delegations || []) as FiscalDelegation[];
    },
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (delegation: Partial<FiscalDelegation>) => {
      const { data } = await axios.post("/api/fiscal/delegations", delegation);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal", "delegations"] });
    },
  });
}
