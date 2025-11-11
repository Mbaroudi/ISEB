"use client";

import { useReportTemplates, useDeleteReportTemplate } from "@/lib/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Edit, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ReportTemplatesPage() {
  const { data: templates, isLoading } = useReportTemplates();
  const deleteTemplate = useDeleteReportTemplate();
  const { toast } = useToast();

  const handleDelete = async (templateId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;
    try {
      await deleteTemplate.mutateAsync(templateId);
      toast({ title: "Modèle supprimé", description: "Le modèle de rapport a été supprimé." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le modèle.", variant: "destructive" });
    }
  };

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { variant: "default" | "outline" | "secondary", label: string }> = {
      balance_sheet: { variant: "default", label: "Bilan" },
      income_statement: { variant: "default", label: "Compte de résultat" },
      tax_return: { variant: "secondary", label: "Déclaration fiscale" },
      custom: { variant: "outline", label: "Personnalisé" },
    };
    const config = configs[type] || configs.custom;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Modèles de Rapports
          </h1>
          <p className="text-muted-foreground mt-1">{templates?.length || 0} modèles</p>
        </div>
        <Link href="/reports/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Modèle
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dernière Utilisation</TableHead>
                <TableHead>Utilisation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{getTypeBadge(template.report_type)}</TableCell>
                  <TableCell>
                    {template.last_used_date ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(template.last_used_date).toLocaleDateString("fr-FR")}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Jamais utilisé</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.usage_count || 0} fois</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/reports/templates/${template.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        disabled={deleteTemplate.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {templates?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun modèle de rapport</p>
              <Link href="/reports/templates/new">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le premier modèle
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
