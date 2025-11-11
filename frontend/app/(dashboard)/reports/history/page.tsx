"use client";

import { useReportHistory, useExportReport, useShareReport } from "@/lib/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Share2, Calendar, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ReportHistoryPage() {
  const [reportType, setReportType] = useState<string>("all");
  const { data: history, isLoading } = useReportHistory(reportType === "all" ? undefined : reportType);
  const exportReport = useExportReport();
  const shareReport = useShareReport();
  const { toast } = useToast();

  const handleExport = async (reportId: number, format: "pdf" | "excel") => {
    try {
      await exportReport.mutateAsync({ reportId, format });
      toast({ title: "Export réussi", description: `Le rapport a été exporté en ${format.toUpperCase()}.` });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'exporter le rapport.", variant: "destructive" });
    }
  };

  const handleShare = async (reportId: number) => {
    const email = prompt("Entrez l'email du destinataire:");
    if (!email) return;

    try {
      await shareReport.mutateAsync({ reportId, recipients: [email] });
      toast({ title: "Rapport partagé", description: `Le rapport a été envoyé à ${email}.` });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de partager le rapport.", variant: "destructive" });
    }
  };

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { variant: "default" | "outline" | "secondary", label: string }> = {
      balance_sheet: { variant: "default", label: "Bilan" },
      income_statement: { variant: "default", label: "Compte de résultat" },
      tax_return: { variant: "secondary", label: "Déclaration fiscale" },
      cash_flow: { variant: "outline", label: "Flux de trésorerie" },
      custom: { variant: "outline", label: "Personnalisé" },
    };
    const config = configs[type] || configs.custom;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: "default" | "outline" | "destructive", label: string }> = {
      completed: { variant: "default", label: "Terminé" },
      pending: { variant: "outline", label: "En cours" },
      failed: { variant: "destructive", label: "Échec" },
    };
    const config = configs[status] || configs.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Historique des Rapports
          </h1>
          <p className="text-muted-foreground mt-1">{history?.length || 0} rapports générés</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Rapports Générés</CardTitle>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rapports</SelectItem>
                <SelectItem value="balance_sheet">Bilan</SelectItem>
                <SelectItem value="income_statement">Compte de résultat</SelectItem>
                <SelectItem value="tax_return">Déclaration fiscale</SelectItem>
                <SelectItem value="cash_flow">Flux de trésorerie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Généré par</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{getTypeBadge(report.report_type)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(report.period_start).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(report.period_end).toLocaleDateString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {report.generated_by_id?.[1] || "Système"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(report.generated_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(report.id, "pdf")}
                        disabled={exportReport.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(report.id)}
                        disabled={shareReport.isPending}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {history?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport généré</p>
              <p className="text-sm mt-2">Les rapports générés apparaîtront ici</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
