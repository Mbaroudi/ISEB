"use client";

import { useEInvoiceLogs } from "@/lib/hooks/useEInvoicing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EInvoicingLogsPage() {
  const { data: logs, isLoading } = useEInvoiceLogs();

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Historique Envois</h1>
          <p className="text-muted-foreground mt-1">{logs?.length || 0} envois</p>
        </div>
        <Link href="/einvoicing"><Button variant="outline">← Retour</Button></Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Référence Chorus Pro</TableHead>
                <TableHead>Erreur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.send_date).toLocaleString("fr-FR")}</TableCell>
                  <TableCell className="font-medium">{log.invoice_id[1]}</TableCell>
                  <TableCell><Badge variant="outline">{log.format_id[1]}</Badge></TableCell>
                  <TableCell>
                    {log.status === "success" ? (
                      <Badge variant="default" className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Envoyé</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Erreur</Badge>
                    )}
                  </TableCell>
                  <TableCell>{log.chorus_pro_reference || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-red-600">{log.error_message || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun envoi enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
