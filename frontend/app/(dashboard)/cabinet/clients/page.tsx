"use client";

import { useState } from "react";
import { useCabinetClients } from "@/lib/hooks/useCabinet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, User, TrendingUp, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CabinetClientsPage() {
  const [healthFilter, setHealthFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: clients, isLoading } = useCabinetClients({
    health_score: healthFilter || undefined,
    search: search || undefined,
  });

  const getHealthBadge = (score: string) => {
    const configs = {
      excellent: {
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600",
        icon: TrendingUp,
        label: "Excellent",
      },
      good: {
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600",
        icon: TrendingUp,
        label: "Bon",
      },
      warning: {
        variant: "default" as const,
        className: "bg-orange-500 hover:bg-orange-600",
        icon: AlertTriangle,
        label: "Alerte",
      },
      critical: {
        variant: "destructive" as const,
        className: "",
        icon: XCircle,
        label: "Critique",
      },
    };

    const config = configs[score as keyof typeof configs] || configs.good;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {clients?.length || 0} clients au total
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, SIRET..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Bon</SelectItem>
                <SelectItem value="warning">Alerte</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Clients */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Santé</TableHead>
                <TableHead>Honoraires Mensuels</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {!client.active && (
                          <Badge variant="outline" className="mt-1">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {client.email && (
                        <div className="text-muted-foreground">{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="text-muted-foreground">{client.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getHealthBadge(client.health_score)}</TableCell>
                  <TableCell>
                    {client.monthly_fee > 0 ? (
                      <span className="font-medium">
                        {client.monthly_fee.toLocaleString("fr-FR")} €
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.contract_start_date ? (
                      <div className="text-sm">
                        <div>
                          Depuis{" "}
                          {new Date(client.contract_start_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/cabinet/clients/${client.id}`}>
                      <Button variant="outline" size="sm">
                        Voir
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {clients?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun client trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
