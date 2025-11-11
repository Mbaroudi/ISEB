/**
 * React Query hooks for system management
 * Includes module status checking and installation
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface Module {
  name: string;
  display: string;
  state: string;
  description: string;
  version: string | null;
  installed: boolean;
}

export interface ModuleStatusResponse {
  modules: Module[];
  summary: {
    total: number;
    installed: number;
    notInstalled: number;
    allInstalled: boolean;
    percentage: number;
  };
}

export interface InstallResult {
  module: string;
  success: boolean;
  alreadyInstalled?: boolean;
  error?: string;
}

export interface InstallResponse {
  results: InstallResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    alreadyInstalled: number;
    newlyInstalled: number;
  };
}

/**
 * Get status of all ISEB modules
 */
export function useModuleStatus() {
  return useQuery<ModuleStatusResponse>({
    queryKey: ["system", "modules", "status"],
    queryFn: async () => {
      const { data } = await axios.get("/api/system/modules/status");
      return data;
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

/**
 * Install modules
 */
export function useInstallModules() {
  const queryClient = useQueryClient();

  return useMutation<
    InstallResponse,
    Error,
    { modules?: string[]; installAll?: boolean }
  >({
    mutationFn: async ({ modules, installAll }) => {
      const { data } = await axios.post("/api/system/modules/install", {
        modules,
        installAll,
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate module status to refresh
      queryClient.invalidateQueries({ queryKey: ["system", "modules", "status"] });
    },
  });
}

/**
 * Get modules by installation status
 */
export function useModulesByStatus(status: "installed" | "not_installed" | "all" = "all") {
  const { data, ...rest } = useModuleStatus();

  const filteredModules = data?.modules.filter((module) => {
    if (status === "installed") return module.installed;
    if (status === "not_installed") return !module.installed;
    return true;
  });

  return {
    data: filteredModules,
    summary: data?.summary,
    ...rest,
  };
}
