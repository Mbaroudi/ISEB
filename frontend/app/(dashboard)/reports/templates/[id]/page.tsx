"use client";

import { useReportTemplate, useUpdateReportTemplate } from "@/lib/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function ReportTemplateDetailPage({ params }: { params: { id: string } }) {
  const templateId = parseInt(params.id);
  const { data: template, isLoading } = useReportTemplate(templateId);
  const updateTemplate = useUpdateReportTemplate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    report_type: "balance_sheet",
    description: "",
    is_default: false,
    sections: [] as string[],
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        report_type: template.report_type,
        description: template.description || "",
        is_default: template.is_default,
        sections: template.sections || [],
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTemplate.mutateAsync({ id: templateId, ...formData });
      toast({ title: "Modèle enregistré", description: "Le modèle de rapport a été mis à jour." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le modèle.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;
  if (!template) return <div className="p-8">Modèle non trouvé</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {template.name}
          </h1>
          <p className="text-muted-foreground mt-1">Édition du modèle de rapport</p>
        </div>
        <Link href="/reports/templates">
          <Button variant="outline">← Retour</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du modèle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bilan Annuel 2025"
              />
            </div>

            <div>
              <Label htmlFor="report_type">Type de rapport</Label>
              <Select
                value={formData.report_type}
                onValueChange={(value) => setFormData({ ...formData, report_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance_sheet">Bilan</SelectItem>
                  <SelectItem value="income_statement">Compte de résultat</SelectItem>
                  <SelectItem value="tax_return">Déclaration fiscale</SelectItem>
                  <SelectItem value="cash_flow">Flux de trésorerie</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du modèle..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Modèle par défaut</Label>
                <p className="text-sm text-muted-foreground">
                  Utiliser ce modèle par défaut pour ce type de rapport
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections du Rapport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Les sections disponibles dépendent du type de rapport sélectionné.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["Actif", "Passif", "Charges", "Produits", "Résultat", "Notes"].map((section) => (
                  <div key={section} className="flex items-center space-x-2 border rounded-md p-3">
                    <Switch
                      checked={formData.sections.includes(section)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, sections: [...formData.sections, section] });
                        } else {
                          setFormData({
                            ...formData,
                            sections: formData.sections.filter((s) => s !== section),
                          });
                        }
                      }}
                    />
                    <Label className="cursor-pointer">{section}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques d'Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Nombre d'utilisations:</span>
                <div className="text-2xl font-bold">{template.usage_count || 0}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Dernière utilisation:</span>
                <div className="text-sm font-medium">
                  {template.last_used_date
                    ? new Date(template.last_used_date).toLocaleDateString("fr-FR")
                    : "Jamais utilisé"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateTemplate.isPending} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {updateTemplate.isPending ? "Enregistrement..." : "Enregistrer le modèle"}
        </Button>
      </form>
    </div>
  );
}
