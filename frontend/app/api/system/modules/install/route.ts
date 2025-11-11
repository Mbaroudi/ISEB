import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/system/modules/install
 * Install one or more ISEB modules
 *
 * Body:
 * {
 *   "modules": ["french_accounting", "client_portal"] // Array of module names to install
 *   OR
 *   "installAll": true // Install all ISEB modules
 * }
 */
export async function POST(request: NextRequest) {
  console.log("=== API MODULE INSTALLATION START ===");
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
    const body = await request.json();

    const { modules, installAll } = body;

    const odooUrl = process.env.ODOO_URL || "http://nginx:8070";
    const odooDb = process.env.ODOO_DB || "iseb_prod";

    console.log("Installing modules...", { odooUrl, odooDb, username: auth.username, modules, installAll });

    // All available ISEB modules in installation order
    const allModules = [
      'french_accounting',
      'website',
      'web_cors',
      'client_portal',
      'cabinet_portal',
      'invoice_ocr_config',
      'accounting_collaboration',
      'account_import_export',
      'bank_sync',
      'e_invoicing',
      'reporting',
      'integrations',
    ];

    // Determine which modules to install
    let modulesToInstall = [];
    if (installAll) {
      modulesToInstall = allModules;
    } else if (Array.isArray(modules) && modules.length > 0) {
      // Validate requested modules
      modulesToInstall = modules.filter(m => allModules.includes(m));
      if (modulesToInstall.length === 0) {
        return NextResponse.json(
          { error: "No valid modules specified" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Must specify 'modules' array or 'installAll': true" },
        { status: 400 }
      );
    }

    console.log("Modules to install:", modulesToInstall);

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

    console.log("Session cookie obtained, starting installation...");

    // First, update module list to ensure all modules are visible
    try {
      await axios.post(
        `${odooUrl}/web/dataset/call_kw`,
        {
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "ir.module.module",
            method: "update_list",
            args: [[]],
            kwargs: {},
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
      console.log("Module list updated successfully");
    } catch (error) {
      console.warn("Could not update module list:", error);
    }

    // Install each module
    const installResults = [];
    for (const moduleName of modulesToInstall) {
      try {
        console.log(`Installing module: ${moduleName}`);

        // Search for the module
        const searchResponse = await axios.post(
          `${odooUrl}/web/dataset/call_kw`,
          {
            jsonrpc: "2.0",
            method: "call",
            params: {
              model: "ir.module.module",
              method: "search_read",
              args: [[["name", "=", moduleName]]],
              kwargs: {
                fields: ["id", "name", "state"],
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

        if (!moduleData) {
          console.error(`Module ${moduleName} not found`);
          installResults.push({
            module: moduleName,
            success: false,
            error: "Module not found",
          });
          continue;
        }

        if (moduleData.state === 'installed') {
          console.log(`Module ${moduleName} already installed`);
          installResults.push({
            module: moduleName,
            success: true,
            alreadyInstalled: true,
          });
          continue;
        }

        // Install the module using button_immediate_install
        const installResponse = await axios.post(
          `${odooUrl}/web/dataset/call_kw`,
          {
            jsonrpc: "2.0",
            method: "call",
            params: {
              model: "ir.module.module",
              method: "button_immediate_install",
              args: [[moduleData.id]],
              kwargs: {},
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Cookie": sessionCookie,
            },
            withCredentials: true,
            timeout: 300000, // 5 minutes timeout for module installation
          }
        );

        if (installResponse.data?.result !== undefined) {
          console.log(`Module ${moduleName} installed successfully`);
          installResults.push({
            module: moduleName,
            success: true,
            alreadyInstalled: false,
          });
        } else {
          console.error(`Module ${moduleName} installation returned unexpected result`);
          installResults.push({
            module: moduleName,
            success: false,
            error: "Unexpected response from installation",
          });
        }

        // Wait a bit between installations to avoid overwhelming Odoo
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`Error installing module ${moduleName}:`, error);
        installResults.push({
          module: moduleName,
          success: false,
          error: error.message || "Installation failed",
        });
      }
    }

    // Calculate summary
    const successful = installResults.filter(r => r.success).length;
    const failed = installResults.filter(r => !r.success).length;
    const alreadyInstalled = installResults.filter(r => r.alreadyInstalled).length;

    console.log(`Installation complete: ${successful} successful, ${failed} failed, ${alreadyInstalled} already installed`);

    return NextResponse.json({
      results: installResults,
      summary: {
        total: installResults.length,
        successful,
        failed,
        alreadyInstalled,
        newlyInstalled: successful - alreadyInstalled,
      },
    });
  } catch (error: any) {
    console.error("Module installation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to install modules" },
      { status: 500 }
    );
  }
}
