"use client";

import { useCabinetDashboard } from "@/lib/hooks/useCabinet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, AlertTriangle, TrendingUp, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CabinetDashboardPage() {
  const { data: dashboard, isLoading, refetch } = useCabinetDashboard();

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!dashboard) {
    return <div className="p-8">Aucune donnée disponible</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Cabinet</h1>
        <Button onClick={() => refetch()} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Stats Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_clients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard.active_clients} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients Excellents</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard.clients_excellent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients en Alerte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboard.clients_warning}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboard.clients_critical}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Financières */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CA Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.total_revenue_all.toLocaleString("fr-FR")} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CA Cabinet (Mensuel)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboard.cabinet_revenue_mtd.toLocaleString("fr-FR")} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Annuel: {dashboard.cabinet_revenue_ytd.toLocaleString("fr-FR")} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résultat Net Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.total_net_income.toLocaleString("fr-FR")} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tâches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tâches</CardTitle>
            <ClipboardList className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">{dashboard.total_tasks}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>En retard:</span>
                <span className="font-bold">{dashboard.tasks_overdue}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Cette semaine:</span>
                <span className="font-bold">{dashboard.tasks_this_week}</span>
              </div>
            </div>
            <Link href="/cabinet/tasks">
              <Button className="w-full mt-4" variant="outline">
                Voir les tâches
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {dashboard.documents_pending}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Documents à valider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes de frais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {dashboard.expenses_pending}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              En attente de validation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/cabinet/clients">
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Clients
              </Button>
            </Link>
            <Link href="/cabinet/tasks">
              <Button className="w-full" variant="outline">
                <ClipboardList className="mr-2 h-4 w-4" />
                Tâches
              </Button>
            </Link>
            <Link href="/documents">
              <Button className="w-full" variant="outline">
                Documents
              </Button>
            </Link>
            <Link href="/expenses">
              <Button className="w-full" variant="outline">
                Notes de frais
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
