"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  FileBarChart,
  Filter,
  History,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

const reportTypes = [
  {
    id: "balance",
    title: "Bilan comptable",
    description: "Vue d'ensemble de votre situation financière",
    icon: FileBarChart,
    color: "bg-blue-500",
  },
  {
    id: "profit",
    title: "Compte de résultat",
    description: "Analyse de vos revenus et dépenses",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    id: "vat",
    title: "Déclaration de TVA",
    description: "Rapports TVA collectée et déductible",
    icon: DollarSign,
    color: "bg-purple-500",
  },
  {
    id: "fec",
    title: "Fichier des Écritures Comptables (FEC)",
    description: "Export comptable réglementaire",
    icon: FileText,
    color: "bg-orange-500",
  },
];

const recentReports = [
  {
    id: 1,
    name: "Bilan 2024",
    type: "Bilan comptable",
    date: "2024-12-31",
    size: "245 KB",
  },
  {
    id: 2,
    name: "Compte de résultat Q4 2024",
    type: "Compte de résultat",
    date: "2024-12-31",
    size: "189 KB",
  },
  {
    id: 3,
    name: "TVA Décembre 2024",
    type: "Déclaration TVA",
    date: "2024-12-31",
    size: "98 KB",
  },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("2024");
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState<Record<string, any>>({});

  const handleGenerate = async (reportType: string) => {
    setGenerating(reportType);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          period: selectedPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error("Échec de la génération du rapport");
      }

      const data = await response.json();

      // Store generated report info
      setGeneratedReports(prev => ({
        ...prev,
        [reportType]: {
          ...data,
          period: selectedPeriod
        }
      }));

      toast({
        title: "Rapport généré",
        description: data.message || "Le rapport a été généré avec succès!"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le rapport.",
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (reportType: string) => {
    const report = generatedReports[reportType];
    if (!report) {
      toast({
        title: "Rapport non généré",
        description: "Veuillez d'abord générer le rapport.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(report.downloadUrl);

      if (!response.ok) {
        throw new Error("Échec du téléchargement");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Determine filename based on report type
      let filename = `rapport_${reportType}_${selectedPeriod}`;
      if (reportType === 'fec') {
        filename = `FEC_${selectedPeriod}.txt`;
      } else {
        filename = `${reportType}_${selectedPeriod}.pdf`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: `Le fichier ${filename} a été téléchargé.`
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le rapport.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapports Comptables</h1>
          <p className="mt-1 text-muted-foreground">
            Générez et téléchargez vos rapports comptables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>

          <Link href="/reports/templates">
            <Button variant="outline" size="sm">
              <FileCheck className="mr-2 h-4 w-4" />
              Modèles
            </Button>
          </Link>

          <Link href="/reports/history">
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              Historique
            </Button>
          </Link>

          <Link href="/reports/compare">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Comparer
            </Button>
          </Link>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isGenerating = generating === report.id;
          const isGenerated = !!generatedReports[report.id];

          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`${report.color} flex h-12 w-12 items-center justify-center rounded-lg text-white`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {report.description}
                      </p>
                    </div>
                  </div>
                  {isGenerated && (
                    <Badge variant="default" className="bg-green-500">
                      Prêt
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={isGenerating}
                    onClick={() => handleGenerate(report.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {isGenerating ? "Génération..." : "Générer"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(report.id)}
                    disabled={!isGenerated}
                    title={isGenerated ? "Télécharger le rapport" : "Générer d'abord le rapport"}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rapports récents</span>
            <Link href="/reports/history">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 px-2 rounded"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">{report.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.date).toLocaleDateString("fr-FR")}
                    </div>
                    <p className="text-sm text-gray-500">{report.size}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="Rapport archivé"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {recentReports.length === 0 && (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Aucun rapport récent
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
