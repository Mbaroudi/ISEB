"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRevenueChart } from "@/lib/odoo/hooks";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart() {
  const { data, isLoading } = useRevenueChart();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          stroke="#9ca3af"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          stroke="#9ca3af"
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            padding: "0.75rem",
          }}
          formatter={(value: number) => [formatCurrency(value), "CA"]}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#8b5cf6"
          strokeWidth={3}
          dot={{ fill: "#8b5cf6", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
