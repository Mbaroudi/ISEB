"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  FileBarChart,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

      alert(data.message || "Rapport généré avec succès!");
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (reportType: string) => {
    const report = generatedReports[reportType];
    if (!report) {
      toast.warning("Veuillez d'abord générer le rapport");
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
    } catch (error: any) {
      toast.error("Erreur lors du téléchargement: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500">
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

          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
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
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  disabled={generating === report.id}
                  onClick={() => handleGenerate(report.id)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {generating === report.id ? "Génération..." : "Générer"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(report.id)}
                  disabled={!generatedReports[report.id]}
                  title={generatedReports[report.id] ? "Télécharger le rapport" : "Générer d'abord le rapport"}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Rapports récents</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
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
      </div>
    </div>
  );
}
