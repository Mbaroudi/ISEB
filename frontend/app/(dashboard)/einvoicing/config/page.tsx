"use client";

import { useEInvoiceConfig, useUpdateEInvoiceConfig, useEInvoiceFormats } from "@/lib/hooks/useEInvoicing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState } from "react";

export default function EInvoicingConfigPage() {
  const { data: config, isLoading } = useEInvoiceConfig();
  const { data: formats } = useEInvoiceFormats();
  const updateConfig = useUpdateEInvoiceConfig();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    einvoicing_enabled: config?.einvoicing_enabled || false,
    chorus_pro_login: config?.chorus_pro_login || "",
    chorus_pro_siret: config?.chorus_pro_siret || "",
    einvoicing_test_mode: config?.einvoicing_test_mode || true,
    default_format_id: config?.einvoicing_default_format_id?.[0] || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig.mutateAsync(formData);
      toast({ title: "Configuration enregistrée", description: "Les paramètres Chorus Pro ont été mis à jour." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer la configuration.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Configuration E-Invoicing
          </h1>
          <p className="text-muted-foreground mt-1">Paramètres Chorus Pro et formats</p>
        </div>
        <Link href="/einvoicing"><Button variant="outline">← Retour</Button></Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Chorus Pro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activer la facturation électronique</Label>
                <p className="text-sm text-muted-foreground">Obligation légale à partir de 2026</p>
              </div>
              <Switch checked={formData.einvoicing_enabled} onCheckedChange={(checked) => setFormData({ ...formData, einvoicing_enabled: checked })} />
            </div>

            <div>
              <Label htmlFor="chorus_pro_login">Identifiant Chorus Pro</Label>
              <Input id="chorus_pro_login" value={formData.chorus_pro_login} onChange={(e) => setFormData({ ...formData, chorus_pro_login: e.target.value })} placeholder="votre-identifiant@entreprise.fr" />
            </div>

            <div>
              <Label htmlFor="chorus_pro_siret">SIRET</Label>
              <Input id="chorus_pro_siret" value={formData.chorus_pro_siret} onChange={(e) => setFormData({ ...formData, chorus_pro_siret: e.target.value })} placeholder="12345678901234" maxLength={14} />
              <p className="text-xs text-muted-foreground mt-1">14 chiffres</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mode Test</Label>
                <p className="text-sm text-muted-foreground">Désactiver en production</p>
              </div>
              <Switch checked={formData.einvoicing_test_mode} onCheckedChange={(checked) => setFormData({ ...formData, einvoicing_test_mode: checked })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Format par Défaut</CardTitle></CardHeader>
          <CardContent>
            <Label>Sélectionner le format</Label>
            <Select value={formData.default_format_id?.toString()} onValueChange={(value) => setFormData({ ...formData, default_format_id: value })}>
              <SelectTrigger><SelectValue placeholder="Choisir un format" /></SelectTrigger>
              <SelectContent>
                {formats?.map((format) => (
                  <SelectItem key={format.id} value={format.id.toString()}>
                    {format.name} ({format.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Factur-X recommandé pour B2B français</p>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateConfig.isPending} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {updateConfig.isPending ? "Enregistrement..." : "Enregistrer la configuration"}
        </Button>
      </form>
    </div>
  );
}
