"use client";

import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/lib/odoo/hooks";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Plus,
  Camera,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createExpense.mutateAsync({
      name: formData.name,
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
    });

    setFormData({
      name: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      category: "",
      description: "",
    });
    setShowForm(false);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes de frais</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos notes de frais et remboursements
          </p>
        </div>
        <Button
          variant="gradient"
          size="lg"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Nouvelle note
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            Créer une note de frais
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Libellé *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Déjeuner client"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Montant (€) *
                </label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Catégorie
                </label>
                <div className="relative mt-1">
                  <Tag className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="meal">Repas</option>
                    <option value="travel">Déplacement</option>
                    <option value="hotel">Hébergement</option>
                    <option value="supplies">Fournitures</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Détails de la dépense..."
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Justificatif
              </label>
              <div className="mt-1">
                <Button type="button" variant="outline">
                  <Camera className="mr-2 h-5 w-5" />
                  Prendre en photo
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="gradient">
                Créer la note
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      <div className="rounded-lg bg-white shadow">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500">Chargement des notes de frais...</p>
          </div>
        ) : expenses && expenses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Receipt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{expense.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatDate(expense.date)}</span>
                      {expense.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{expense.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    {expense.state && (
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStateColor(
                            expense.state
                          )}`}
                        >
                          {getStateIcon(expense.state)}
                          <span className="capitalize">{expense.state}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center p-8">
            <Receipt className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Aucune note de frais
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Créez votre première note de frais
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
