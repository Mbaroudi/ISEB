/**
 * TypeScript types for Odoo models
 */

export interface Partner {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country_id?: [number, string];
  company_type?: "person" | "company";
  is_company?: boolean;
  is_iseb_client?: boolean;
  create_date?: string;
  write_date?: string;
}

export interface Client extends Partner {
  is_iseb_client: true;
  company_name?: string;
  vat?: string;
  siret?: string;
}

export interface Document {
  id: number;
  name: string;
  document_type: "invoice" | "receipt" | "contract" | "other";
  file_data?: string;
  file_size?: number;
  upload_date: string;
  partner_id?: [number, string];
  description?: string;
  create_uid?: [number, string];
}

export interface ExpenseNote {
  id: number;
  name: string;
  date: string;
  amount: number;
  category?: string;
  description?: string;
  receipt_image?: string;
  state?: "draft" | "submitted" | "approved" | "rejected" | "paid";
  partner_id?: [number, string];
  create_date?: string;
}

export interface AccountMove {
  id: number;
  name: string;
  date: string;
  invoice_date?: string;
  partner_id?: [number, string];
  amount_total: number;
  amount_tax: number;
  amount_untaxed: number;
  state: "draft" | "posted" | "cancel";
  move_type: "entry" | "out_invoice" | "out_refund" | "in_invoice" | "in_refund";
  payment_state?: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
}

export interface FECExport {
  id: number;
  name: string;
  date_from: string;
  date_to: string;
  state: "draft" | "done" | "error";
  file_data?: string;
  file_name?: string;
  company_id: [number, string];
  create_date?: string;
}

export interface TVADeclaration {
  id: number;
  name: string;
  period_start: string;
  period_end: string;
  regime: "normal" | "mini_reel" | "reel_simplifie";
  state: "draft" | "submitted" | "validated" | "paid";
  amount_collected?: number;
  amount_deductible?: number;
  amount_due?: number;
  company_id: [number, string];
}

export interface DashboardStats {
  balance: number;
  revenue_month: number;
  expenses_month: number;
  pending_invoices: number;
  revenue_chart_data: Array<{
    date: string;
    amount: number;
  }>;
  expenses_chart_data: Array<{
    date: string;
    amount: number;
  }>;
}

export interface User {
  id: number;
  login: string;
  name: string;
  email?: string;
  company_id: [number, string];
  partner_id: [number, string];
  groups_id?: number[];
}

/**
 * Odoo Domain filters
 */
export type OdooDomain = Array<string | number | boolean | OdooDomain>;

/**
 * Common Odoo field types
 */
export type OdooField =
  | [number, string]  // Many2one: [id, display_name]
  | number[]          // Many2many/One2many: [id1, id2, ...]
  | string
  | number
  | boolean
  | null;

/**
 * Odoo API Response
 */
export interface OdooResponse<T = any> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data: {
      name: string;
      debug: string;
      message: string;
      arguments: any[];
    };
  };
}
