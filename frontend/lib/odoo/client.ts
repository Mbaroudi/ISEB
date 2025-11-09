import axios, { AxiosInstance } from "axios";

export interface OdooConfig {
  url: string;
  db: string;
}

export interface OdooAuthResponse {
  uid: number;
  username: string;
  company_id: number;
  partner_id: number;
}

export interface OdooSearchReadParams {
  model: string;
  domain?: any[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

export interface OdooCreateParams {
  model: string;
  values: Record<string, any>;
}

export interface OdooWriteParams {
  model: string;
  ids: number[];
  values: Record<string, any>;
}

export interface OdooCallParams {
  model: string;
  method: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

/**
 * Odoo JSON-RPC Client
 * Handles authentication and API calls to Odoo backend
 */
export class OdooClient {
  private client: AxiosInstance;
  private config: OdooConfig;
  private uid: number | null = null;
  private password: string | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.url,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  }

  /**
   * Authenticate with Odoo
   */
  async authenticate(username: string, password: string): Promise<OdooAuthResponse> {
    try {
      const response = await this.client.post("/xmlrpc/2/common", {
        service: "common",
        method: "authenticate",
        args: [this.config.db, username, password, {}],
      });

      if (!response.data || !response.data.result) {
        throw new Error("Authentication failed: Invalid credentials");
      }

      this.uid = response.data.result;
      this.password = password;

      // Get user info
      const userInfo = await this.call({
        model: "res.users",
        method: "read",
        args: [[this.uid], ["name", "login", "company_id", "partner_id"]],
      });

      const user = userInfo[0];

      return {
        uid: this.uid,
        username: user.login,
        company_id: user.company_id[0],
        partner_id: user.partner_id[0],
      };
    } catch (error: any) {
      throw new Error(`Odoo authentication failed: ${error.message}`);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.uid !== null && this.password !== null;
  }

  /**
   * Get current user ID
   */
  getUserId(): number | null {
    return this.uid;
  }

  /**
   * Call any Odoo model method
   */
  async call(params: OdooCallParams): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated. Please call authenticate() first.");
    }

    try {
      const response = await this.client.post("/xmlrpc/2/object", {
        service: "object",
        method: "execute_kw",
        args: [
          this.config.db,
          this.uid,
          this.password,
          params.model,
          params.method,
          params.args || [],
          params.kwargs || {},
        ],
      });

      return response.data.result;
    } catch (error: any) {
      throw new Error(`Odoo API call failed: ${error.message}`);
    }
  }

  /**
   * Search and read records
   */
  async searchRead(params: OdooSearchReadParams): Promise<any[]> {
    return this.call({
      model: params.model,
      method: "search_read",
      kwargs: {
        domain: params.domain || [],
        fields: params.fields || [],
        limit: params.limit,
        offset: params.offset,
        order: params.order,
      },
    });
  }

  /**
   * Search for record IDs
   */
  async search(model: string, domain: any[] = [], options?: { limit?: number; offset?: number; order?: string }): Promise<number[]> {
    return this.call({
      model,
      method: "search",
      args: [domain],
      kwargs: options || {},
    });
  }

  /**
   * Read records by IDs
   */
  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    return this.call({
      model,
      method: "read",
      args: [ids, fields],
    });
  }

  /**
   * Create a new record
   */
  async create(params: OdooCreateParams): Promise<number> {
    return this.call({
      model: params.model,
      method: "create",
      args: [params.values],
    });
  }

  /**
   * Update existing records
   */
  async write(params: OdooWriteParams): Promise<boolean> {
    return this.call({
      model: params.model,
      method: "write",
      args: [params.ids, params.values],
    });
  }

  /**
   * Delete records
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.call({
      model,
      method: "unlink",
      args: [ids],
    });
  }

  /**
   * Get field metadata
   */
  async fieldsGet(model: string, fields: string[] = []): Promise<any> {
    return this.call({
      model,
      method: "fields_get",
      args: fields.length > 0 ? [fields] : [],
    });
  }

  /**
   * Count records matching domain
   */
  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return this.call({
      model,
      method: "search_count",
      args: [domain],
    });
  }

  /**
   * Execute workflow action
   */
  async execWorkflow(model: string, recordId: number, signal: string): Promise<any> {
    return this.call({
      model,
      method: signal,
      args: [[recordId]],
    });
  }

  /**
   * Call button action
   */
  async buttonAction(model: string, recordId: number, method: string): Promise<any> {
    return this.call({
      model,
      method,
      args: [[recordId]],
    });
  }
}

/**
 * Create a singleton instance of OdooClient
 */
let odooClientInstance: OdooClient | null = null;

export function getOdooClient(): OdooClient {
  if (!odooClientInstance) {
    const config: OdooConfig = {
      url: process.env.NEXT_PUBLIC_ODOO_URL || "http://localhost:8069",
      db: process.env.ODOO_DB || "iseb_prod",
    };
    odooClientInstance = new OdooClient(config);
  }
  return odooClientInstance;
}

export default OdooClient;
