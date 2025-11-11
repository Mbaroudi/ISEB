import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/system/modules/status
 * Check the status of all ISEB modules
 */
export async function GET(request: NextRequest) {
  console.log("=== API MODULE STATUS CHECK START ===");
  try {
    const authSession = request.cookies.get("auth_session");
    const userData = request.cookies.get("user_data");

    console.log("Auth cookies present:", !!authSession, !!userData);

    if (!authSession || !userData) {
      console.error("Missing auth cookies");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authSession.value);

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    console.log("Checking module status...", { odooUrl, odooDb, username: auth.username });

    // List of all ISEB modules to check
    const modulesToCheck = [
      { name: 'french_accounting', display: 'Comptabilité Française' },
      { name: 'website', display: 'Website' },
      { name: 'web_cors', display: 'CORS Configuration' },
      { name: 'client_portal', display: 'Portail Client' },
      { name: 'cabinet_portal', display: 'Portail Cabinet' },
      { name: 'invoice_ocr_config', display: 'Configuration OCR' },
      { name: 'accounting_collaboration', display: 'Questions & Messaging' },
      { name: 'account_import_export', display: 'Import/Export FEC/XIMPORT' },
      { name: 'bank_sync', display: 'Synchronisation Bancaire' },
      { name: 'e_invoicing', display: 'Facturation Électronique' },
      { name: 'reporting', display: 'Rapports Personnalisés' },
      { name: 'integrations', display: 'Intégrations tierces' },
    ];

    // Authenticate with Odoo
    const authResponse = await axios.post(
      `${odooUrl}/web/session/authenticate`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: odooDb,
          login: auth.username,
          password: auth.password,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (!authResponse.data?.result?.uid) {
      console.error("Odoo auth failed:", authResponse.data);
      throw new Error("Authentication failed");
    }

    console.log("Odoo auth successful, uid:", authResponse.data.result.uid);

    // Get session cookie
    const cookies = authResponse.headers['set-cookie'];
    const sessionCookie = cookies ? cookies.join('; ') : '';

    console.log("Session cookie obtained, checking modules...");

    // Check each module status
    const moduleStatuses = await Promise.all(
      modulesToCheck.map(async (module) => {
        try {
          // Search for the module
          const searchResponse = await axios.post(
            `${odooUrl}/web/dataset/call_kw`,
            {
              jsonrpc: "2.0",
              method: "call",
              params: {
                model: "ir.module.module",
                method: "search_read",
                args: [[["name", "=", module.name]]],
                kwargs: {
                  fields: ["name", "state", "shortdesc", "installed_version"],
                },
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Cookie": sessionCookie,
              },
              withCredentials: true,
            }
          );

          const moduleData = searchResponse.data?.result?.[0];

          if (moduleData) {
            return {
              name: module.name,
              display: module.display,
              state: moduleData.state,
              description: moduleData.shortdesc,
              version: moduleData.installed_version || null,
              installed: moduleData.state === 'installed',
            };
          } else {
            return {
              name: module.name,
              display: module.display,
              state: 'not_found',
              description: 'Module not found in database',
              version: null,
              installed: false,
            };
          }
        } catch (error) {
          console.error(`Error checking module ${module.name}:`, error);
          return {
            name: module.name,
            display: module.display,
            state: 'error',
            description: 'Error checking module',
            version: null,
            installed: false,
          };
        }
      })
    );

    // Calculate summary
    const installed = moduleStatuses.filter(m => m.installed).length;
    const total = moduleStatuses.length;
    const allInstalled = installed === total;

    console.log(`Module status: ${installed}/${total} installed`);

    return NextResponse.json({
      modules: moduleStatuses,
      summary: {
        total,
        installed,
        notInstalled: total - installed,
        allInstalled,
        percentage: Math.round((installed / total) * 100),
      },
    });
  } catch (error: any) {
    console.error("Module status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check module status" },
      { status: 500 }
    );
  }
}
