"use client";

import { useState } from "react";
import { useModuleStatus, useInstallModules } from "@/lib/hooks/useSystem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Package,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ModulesPage() {
  const { toast } = useToast();
  const { data: moduleData, isLoading, refetch } = useModuleStatus();
  const installModules = useInstallModules();
  const [installing, setInstalling] = useState(false);

  const handleInstallAll = async () => {
    try {
      setInstalling(true);
      const result = await installModules.mutateAsync({ installAll: true });

      if (result.summary.failed > 0) {
        toast({
          title: "Installation partielle",
          description: `${result.summary.newlyInstalled} modules installés, ${result.summary.failed} échecs`,
          variant: "default",
        });
      } else {
        toast({
          title: "Installation réussie",
          description: `${result.summary.newlyInstalled} modules installés avec succès`,
        });
      }

      // Refresh module status
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'installation des modules",
        variant: "destructive",
      });
    } finally {
      setInstalling(false);
    }
  };

  const handleInstallModule = async (moduleName: string) => {
    try {
      setInstalling(true);
      const result = await installModules.mutateAsync({ modules: [moduleName] });

      const moduleResult = result.results[0];
      if (moduleResult.success) {
        toast({
          title: "Module installé",
          description: `${moduleName} a été installé avec succès`,
        });
      } else {
        toast({
          title: "Erreur",
          description: moduleResult.error || "Échec de l'installation",
          variant: "destructive",
        });
      }

      // Refresh module status
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'installation du module",
        variant: "destructive",
      });
    } finally {
      setInstalling(false);
    }
  };

  const getStateIcon = (state: string, installed: boolean) => {
    if (installed) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (state === "not_found") {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getStateBadge = (state: string, installed: boolean) => {
    if (installed) {
      return <Badge className="bg-green-100 text-green-800">Installé</Badge>;
    }
    if (state === "not_found") {
      return <Badge variant="destructive">Non trouvé</Badge>;
    }
    if (state === "to install") {
      return <Badge className="bg-blue-100 text-blue-800">À installer</Badge>;
    }
    if (state === "to upgrade") {
      return <Badge className="bg-yellow-100 text-yellow-800">À mettre à jour</Badge>;
    }
    return <Badge variant="secondary">{state}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modules ISEB</h1>
          <p className="text-gray-600 mt-1">
            Gestion des modules Odoo pour la plateforme ISEB
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {moduleData && !moduleData.summary.allInstalled && (
            <Button onClick={handleInstallAll} disabled={installing}>
              <Download className="h-4 w-4 mr-2" />
              {installing ? "Installation..." : "Installer tous"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold">{moduleData?.summary.total || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Installés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold">{moduleData?.summary.installed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Non installés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <span className="text-3xl font-bold">{moduleData?.summary.notInstalled || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <span className="text-3xl font-bold">{moduleData?.summary.percentage || 0}%</span>
            </div>
            <Progress value={moduleData?.summary.percentage || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {moduleData && moduleData.summary.allInstalled && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Tous les modules ISEB sont installés et prêts à être utilisés!
          </AlertDescription>
        </Alert>
      )}

      {moduleData && !moduleData.summary.allInstalled && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {moduleData.summary.notInstalled} module(s) ne sont pas encore installés.
            Cliquez sur "Installer tous" pour les installer automatiquement.
          </AlertDescription>
        </Alert>
      )}

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Modules</CardTitle>
          <CardDescription>
            État détaillé de tous les modules ISEB disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nom du Module</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moduleData?.modules.map((module) => (
                <TableRow key={module.name}>
                  <TableCell>
                    {getStateIcon(module.state, module.installed)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{module.display}</div>
                      <div className="text-xs text-gray-500">{module.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {module.description}
                  </TableCell>
                  <TableCell>
                    {getStateBadge(module.state, module.installed)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {module.version || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!module.installed && module.state !== "not_found" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInstallModule(module.name)}
                        disabled={installing}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Installer
                      </Button>
                    )}
                    {module.installed && (
                      <span className="text-xs text-gray-500">
                        Installé ✓
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Installation automatique:</strong> Utilisez le bouton "Installer tous" pour
            installer automatiquement tous les modules manquants.
          </p>
          <p>
            <strong>Installation manuelle:</strong> Cliquez sur "Installer" à côté d'un module
            spécifique pour l'installer individuellement.
          </p>
          <p>
            <strong>Prérequis:</strong> Certains modules dépendent d'autres modules. L'installation
            se fait dans l'ordre correct automatiquement.
          </p>
          <p>
            <strong>Temps d'installation:</strong> L'installation peut prendre plusieurs minutes
            selon la complexité du module.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
