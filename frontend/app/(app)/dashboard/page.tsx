"use client";

import { useAuth } from "@/lib/auth/context";
import { useDashboardStats } from "@/lib/odoo/hooks";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ExpensesChart } from "@/components/dashboard/expenses-chart";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();

  const statsCards = [
    {
      name: "Trésorerie",
      value: stats ? formatCurrency(stats.balance) : "...",
      change: "+4.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      name: "CA du mois",
      value: stats ? formatCurrency(stats.revenue_month) : "...",
      change: "+12.3%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      name: "Charges",
      value: stats ? formatCurrency(stats.expenses_month) : "...",
      change: "-2.1%",
      changeType: "negative" as const,
      icon: CreditCard,
    },
    {
      name: "Clients actifs",
      value: stats ? stats.pending_invoices.toString() : "...",
      change: "+3",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.name || "Utilisateur"} 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <stat.icon className="h-6 w-6 text-purple-600" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.changeType === "positive" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">
            Évolution du chiffre d'affaires
          </h3>
          <div className="mt-6">
            <RevenueChart />
          </div>
        </div>

        {/* Expenses chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">
            Répartition des charges
          </h3>
          <div className="mt-6">
            <ExpensesChart />
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900">
          Activité récente
        </h3>
        <div className="mt-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Transaction #{i}
                    </p>
                    <p className="text-sm text-gray-500">Il y a {i}h</p>
                  </div>
                </div>
                <p className="font-medium text-gray-900">
                  {i * 100} €
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
