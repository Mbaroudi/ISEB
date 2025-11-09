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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "company", label: "Entreprise", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "billing", label: "Facturation", icon: CreditCard },
  ];

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
