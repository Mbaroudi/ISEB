"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  User,
  Building2,
  Bell,
  Lock,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertCircle,
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Import/Export states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState("auto");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const [exportFormat, setExportFormat] = useState("fec");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "company", label: "Entreprise", icon: Building2 },
    { id: "import-export", label: "Import/Export", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "billing", label: "Facturation", icon: CreditCard },
  ];

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert("Veuillez sélectionner un fichier");
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("format", importFormat);
      formData.append("validateBeforeImport", "true");
      formData.append("autoCreateAccounts", "false");
      formData.append("autoCreatePartners", "true");

      const response = await fetch("/api/accounting/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        alert(`Import réussi! ${result.successCount} écritures importées.`);
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message,
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Export
  const handleExport = async () => {
    if (!exportDateFrom || !exportDateTo) {
      alert("Veuillez sélectionner une période");
      return;
    }

    setExportLoading(true);

    try {
      const response = await fetch("/api/accounting/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateFrom: exportDateFrom,
          dateTo: exportDateTo,
          format: exportFormat,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Download FEC file if available
        if (result.fec) {
          const blob = base64ToBlob(result.fec.content, "text/plain");
          downloadBlob(blob, result.fec.filename);
        }

        // Download XIMPORT file if available
        if (result.ximport) {
          const blob = base64ToBlob(result.ximport.content, "text/plain");
          downloadBlob(blob, result.ximport.filename);
        }

        alert("Export réussi! Le(s) fichier(s) ont été téléchargé(s).");
      } else {
        alert("Erreur lors de l'export");
      }
    } catch (error: any) {
      alert("Erreur: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Helper functions
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les paramètres de votre compte et de votre entreprise
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {saveSuccess && (
              <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Modifications enregistrées avec succès
                </p>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informations personnelles
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Mettez à jour vos informations de profil
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || ""}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        defaultValue={user?.email || ""}
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Poste
                    </label>
                    <input
                      type="text"
                      placeholder="Gérant"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "company" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informations de l'entreprise
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Gérez les informations de votre entreprise
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom de l'entreprise
                    </label>
                    <input
                      type="text"
                      defaultValue="YourCompany"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        SIRET
                      </label>
                      <input
                        type="text"
                        placeholder="123 456 789 00010"
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        N° TVA Intracommunautaire
                      </label>
                      <input
                        type="text"
                        placeholder="FR12345678901"
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Adresse
                    </label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <textarea
                        rows={3}
                        placeholder="123 Rue de la République&#10;75001 Paris&#10;France"
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Préférences de notification
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choisissez comment vous souhaitez être notifié
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Nouvelles factures",
                      description: "Recevoir une notification pour chaque nouvelle facture",
                    },
                    {
                      title: "Documents validés",
                      description: "Être notifié quand vos documents sont validés",
                    },
                    {
                      title: "Échéances de paiement",
                      description: "Rappels avant les dates d'échéance",
                    },
                    {
                      title: "Rapport mensuel",
                      description: "Recevoir un rapport mensuel de votre activité",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "import-export" && (
              <div className="space-y-8">
                {/* Import Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Importer des données comptables
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Importez vos données depuis EBP, Sage, Ciel ou tout autre logiciel comptable
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format du fichier
                      </label>
                      <select
                        value={importFormat}
                        onChange={(e) => setImportFormat(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="auto">Détection automatique</option>
                        <option value="fec">🇫🇷 FEC (Fichier des Écritures Comptables)</option>
                        <option value="ximport">📊 XIMPORT (Ciel/EBP/Sage)</option>
                        <option value="csv">📄 CSV</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionner un fichier
                      </label>
                      <input
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-50 file:text-purple-700
                          hover:file:bg-purple-100
                          cursor-pointer"
                      />
                      {importFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          Fichier sélectionné: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(2)} Ko)
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleImport}
                      disabled={!importFile || importLoading}
                      className="w-full"
                    >
                      {importLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Importer
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Import Result */}
                  {importResult && (
                    <div className={`rounded-lg p-4 ${
                      importResult.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        {importResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            importResult.success ? "text-green-900" : "text-red-900"
                          }`}>
                            {importResult.success ? "Import réussi!" : "Erreur d'import"}
                          </h3>
                          {importResult.successCount !== undefined && (
                            <p className="mt-1 text-sm text-gray-700">
                              <strong>{importResult.successCount}</strong> écritures importées
                              {importResult.errorCount > 0 && (
                                <span className="text-red-600">
                                  {" "}({importResult.errorCount} erreurs)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Import Help */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      💡 Formats supportés
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>FEC</strong> : Format officiel France (obligatoire pour contrôles fiscaux)</li>
                      <li>• <strong>XIMPORT</strong> : Format universel Ciel, EBP, Sage</li>
                      <li>• <strong>CSV</strong> : Format tableur standard</li>
                    </ul>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Export Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Exporter des données comptables
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Exportez vos données pour migration, sauvegarde ou contrôle fiscal
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format d'export
                      </label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="fec">🇫🇷 FEC (SIRENFECAAAAMMJJ.txt)</option>
                        <option value="ximport">📊 XIMPORT (XIMPORT.TXT)</option>
                        <option value="both">📦 Les deux formats</option>
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de début
                        </label>
                        <input
                          type="date"
                          value={exportDateFrom}
                          onChange={(e) => setExportDateFrom(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de fin
                        </label>
                        <input
                          type="date"
                          value={exportDateTo}
                          onChange={(e) => setExportDateTo(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleExport}
                      disabled={!exportDateFrom || !exportDateTo || exportLoading}
                      className="w-full"
                    >
                      {exportLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Exporter
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Export Help */}
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      ℹ️ À propos de l'export FEC
                    </h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Obligatoire en France depuis 2014 pour les contrôles fiscaux</li>
                      <li>• Format : SIRENFECAAAAMMJJ.txt (ex: 123456789FEC20241231.txt)</li>
                      <li>• Inclut toutes les écritures validées de la période</li>
                      <li>• Vérifiable avec l'outil "Test Compta Demat" de la DGFIP</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      🔄 Migration vers/depuis d'autres logiciels
                    </h4>
                    <p className="text-sm text-orange-800">
                      Le format <strong>XIMPORT</strong> est compatible avec Ciel, EBP, Sage et la plupart
                      des logiciels comptables français. Utilisez-le pour migrer vos données vers ou depuis ISEB.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sécurité
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Gérez la sécurité de votre compte
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Changer le mot de passe
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Abonnement et facturation
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Gérez votre abonnement et vos informations de paiement
                  </p>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-100">
                        Abonnement actuel
                      </p>
                      <p className="mt-1 text-2xl font-bold">Plan Premium</p>
                      <p className="mt-1 text-sm text-purple-100">
                        Renouvellement le 1er janvier 2025
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">99€</p>
                      <p className="text-sm text-purple-100">/mois</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Historique des paiements
                  </h3>
                  {[
                    { date: "01/12/2024", amount: "99€", status: "Payé" },
                    { date: "01/11/2024", amount: "99€", status: "Payé" },
                    { date: "01/10/2024", amount: "99€", status: "Payé" },
                  ].map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.amount}
                          </p>
                          <p className="text-sm text-gray-500">{payment.date}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
