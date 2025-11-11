"use client";

import { useExpense, useSubmitExpense, useApproveExpense, useRejectExpense } from "@/lib/hooks/useExpenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Send, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const expenseId = parseInt(params.id);
  const { data: expense, isLoading } = useExpense(expenseId);
  const submitExpense = useSubmitExpense();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const { toast } = useToast();

  if (isLoading) return <div className="p-8">Chargement...</div>;
  if (!expense) return <div className="p-8">Note de frais non trouvée</div>;

  const handleSubmit = async () => {
    try {
      await submitExpense.mutateAsync(expenseId);
      toast({ title: "Note soumise", description: "La note a été soumise pour validation." });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    try {
      await approveExpense.mutateAsync(expenseId);
      toast({ title: "Note approuvée" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const getStateBadge = (state: string) => {
    const configs = {
      draft: { variant: "outline" as const, label: "Brouillon", icon: Receipt },
      submitted: { variant: "default" as const, label: "Soumise", icon: Send },
      approved: { variant: "default" as const, className: "bg-green-500", label: "Approuvée", icon: CheckCircle2 },
      rejected: { variant: "destructive" as const, label: "Rejetée", icon: XCircle },
    };
    const config = configs[state as keyof typeof configs] || configs.draft;
    const Icon = config.icon;
    return <Badge variant={config.variant} className={config.className}><Icon className="mr-1 h-3 w-3" />{config.label}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{expense.name}</h1>
          <div className="mt-2">{getStateBadge(expense.state)}</div>
        </div>
        <Link href="/expenses"><Button variant="outline">← Retour</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><span className="text-sm text-muted-foreground">Client:</span><div className="font-medium">{expense.partner_id[1]}</div></div>
            <div><span className="text-sm text-muted-foreground">Date:</span><div className="font-medium">{new Date(expense.expense_date).toLocaleDateString("fr-FR")}</div></div>
            <div><span className="text-sm text-muted-foreground">Catégorie:</span><div className="font-medium">{expense.category}</div></div>
            <div><span className="text-sm text-muted-foreground">Montant:</span><div className="text-2xl font-bold">{expense.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{expense.description || "Aucune description"}</p></CardContent>
        </Card>
      </div>

      {expense.state === "draft" && (
        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleSubmit} disabled={submitExpense.isPending} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {submitExpense.isPending ? "Soumission..." : "Soumettre pour validation"}
            </Button>
          </CardContent>
        </Card>
      )}

      {expense.state === "submitted" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button onClick={handleApprove} disabled={approveExpense.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approuver
              </Button>
              <Button variant="destructive" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />
                Rejeter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {expense.state === "rejected" && expense.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-red-900">Raison du rejet</CardTitle></CardHeader>
          <CardContent><p className="text-red-700">{expense.rejection_reason}</p></CardContent>
        </Card>
      )}

      {expense.validated_by_id && (
        <Card>
          <CardHeader><CardTitle>Validation</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm"><span className="text-muted-foreground">Validé par:</span> {expense.validated_by_id[1]}</div>
            {expense.validated_date && <div className="text-sm"><span className="text-muted-foreground">Date:</span> {new Date(expense.validated_date).toLocaleDateString("fr-FR")}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
