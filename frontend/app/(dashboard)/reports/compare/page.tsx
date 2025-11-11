"use client";

import { useCompareReports } from "@/lib/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ReportsComparePage() {
  const { toast } = useToast();
  const [comparison, setComparison] = useState<any>(null);
  const [formData, setFormData] = useState({
    report_type: "income_statement",
    period1_start: "",
    period1_end: "",
    period2_start: "",
    period2_end: "",
  });

  const compareReports = useCompareReports();

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await compareReports.mutateAsync(formData);
      setComparison(result);
      toast({ title: "Comparaison effectuée", description: "Les périodes ont été comparées avec succès." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de comparer les périodes.", variant: "destructive" });
    }
  };

  const getTrendIcon = (variance: number) => {
    if (variance > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variance < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getVarianceBadge = (variance: number) => {
    if (variance > 0) {
      return (
        <Badge variant="default" className="bg-green-500">
          +{variance.toFixed(1)}%
        </Badge>
      );
    } else if (variance < 0) {
      return <Badge variant="destructive">{variance.toFixed(1)}%</Badge>;
    }
    return <Badge variant="outline">0%</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Comparaison de Périodes
        </h1>
        <p className="text-muted-foreground mt-1">Comparez les performances entre deux périodes</p>
      </div>

      <form onSubmit={handleCompare} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de Comparaison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <SelectItem value="income_statement">Compte de résultat</SelectItem>
                  <SelectItem value="balance_sheet">Bilan</SelectItem>
                  <SelectItem value="cash_flow">Flux de trésorerie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">Période 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="period1_start">Date de début</Label>
                    <Input
                      id="period1_start"
                      type="date"
                      value={formData.period1_start}
                      onChange={(e) => setFormData({ ...formData, period1_start: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="period1_end">Date de fin</Label>
                    <Input
                      id="period1_end"
                      type="date"
                      value={formData.period1_end}
                      onChange={(e) => setFormData({ ...formData, period1_end: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg">Période 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="period2_start">Date de début</Label>
                    <Input
                      id="period2_start"
                      type="date"
                      value={formData.period2_start}
                      onChange={(e) => setFormData({ ...formData, period2_start: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="period2_end">Date de fin</Label>
                    <Input
                      id="period2_end"
                      type="date"
                      value={formData.period2_end}
                      onChange={(e) => setFormData({ ...formData, period2_end: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button type="submit" disabled={compareReports.isPending} className="w-full">
              <BarChart3 className="mr-2 h-4 w-4" />
              {compareReports.isPending ? "Comparaison..." : "Comparer les périodes"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de la Comparaison</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicateur</TableHead>
                  <TableHead className="text-right">Période 1</TableHead>
                  <TableHead className="text-right">Période 2</TableHead>
                  <TableHead className="text-right">Variation</TableHead>
                  <TableHead className="text-center">Tendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.metrics?.map((metric: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{metric.name}</TableCell>
                    <TableCell className="text-right">
                      {metric.period1_value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.period2_value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </TableCell>
                    <TableCell className="text-right">{getVarianceBadge(metric.variance_percent)}</TableCell>
                    <TableCell className="text-center">{getTrendIcon(metric.variance_percent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {comparison.summary && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Synthèse</h3>
                <p className="text-sm text-muted-foreground">{comparison.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!comparison && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez deux périodes pour commencer la comparaison</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
