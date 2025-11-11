"use client";

import { useCabinetClient } from "@/lib/hooks/useCabinet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Building2, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useCabinetClient(parseInt(params.id));

  if (isLoading) return <div className="p-8">Chargement...</div>;
  if (!data) return <div className="p-8">Client non trouvé</div>;

  const { client, dashboard, stats } = data;

  const getHealthBadge = (score: string) => {
    const configs = {
      excellent: { variant: "default" as const, className: "bg-green-500", icon: TrendingUp, label: "Excellent" },
      warning: { variant: "default" as const, className: "bg-orange-500", icon: AlertTriangle, label: "Alerte" },
      critical: { variant: "destructive" as const, className: "", icon: AlertTriangle, label: "Critique" },
    };
    const config = configs[score as keyof typeof configs] || configs.excellent;
    const Icon = config.icon;
    return <Badge variant={config.variant} className={config.className}><Icon className="mr-1 h-3 w-3" />{config.label}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <div className="mt-2">{getHealthBadge(client.health_score)}</div>
        </div>
        <Link href="/cabinet/clients">
          <Button variant="outline">← Retour</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.email || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.siret || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contrat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Honoraires mensuels</span>
              <div className="text-2xl font-bold">{client.monthly_fee?.toLocaleString("fr-FR")} €</div>
            </div>
            {client.contract_start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Depuis {new Date(client.contract_start_date).toLocaleDateString("fr-FR")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statistiques</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tâches en cours</span>
              <span className="font-medium">{stats.pendingTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Documents en attente</span>
              <span className="font-medium">{stats.pendingDocuments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Notes de frais</span>
              <span className="font-medium">{stats.pendingExpenses}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {dashboard && (
        <Card>
          <CardHeader><CardTitle>Dashboard Financier</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">CA</div>
                <div className="text-xl font-bold">{dashboard.revenue_mtd?.toLocaleString("fr-FR")} €</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Charges</div>
                <div className="text-xl font-bold">{dashboard.expenses_mtd?.toLocaleString("fr-FR")} €</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Résultat</div>
                <div className="text-xl font-bold">{dashboard.net_income_mtd?.toLocaleString("fr-FR")} €</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
