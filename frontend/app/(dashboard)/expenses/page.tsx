"use client";

import { useState } from "react";
import {
  useExpenses,
  useCreateExpense,
  useSubmitExpense,
  useApproveExpense,
  useRejectExpense,
} from "@/lib/hooks/useExpenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const [stateFilter, setStateFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: expenses, isLoading } = useExpenses({
    state: stateFilter || undefined,
  });

  const createExpense = useCreateExpense();
  const submitExpense = useSubmitExpense();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();

  const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createExpense.mutateAsync({
        name: formData.get("name"),
        partner_id: parseInt(formData.get("partner_id") as string),
        expense_date: formData.get("expense_date"),
        amount: parseFloat(formData.get("amount") as string),
        category: formData.get("category"),
        description: formData.get("description"),
      });

      toast({
        title: "Note de frais créée",
        description: "La note de frais a été créée avec succès.",
      });
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la note de frais.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await submitExpense.mutateAsync(id);
      toast({
        title: "Note soumise",
        description: "La note de frais a été soumise pour validation.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la note.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveExpense.mutateAsync(id);
      toast({
        title: "Note approuvée",
        description: "La note de frais a été approuvée.",
      });
      setShowApproveDialog(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la note.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await rejectExpense.mutateAsync({ id, reason });
      toast({
        title: "Note rejetée",
        description: "La note de frais a été rejetée.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la note.",
        variant: "destructive",
      });
    }
  };

  const getStateBadge = (state: string) => {
    const configs = {
      draft: { variant: "outline" as const, label: "Brouillon", icon: FileText },
      submitted: { variant: "default" as const, label: "Soumise", icon: Send },
      approved: {
        variant: "default" as const,
        className: "bg-green-500",
        label: "Approuvée",
        icon: CheckCircle2,
      },
      rejected: {
        variant: "destructive" as const,
        label: "Rejetée",
        icon: XCircle,
      },
    };

    const config = configs[state as keyof typeof configs] || configs.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      transport: "Transport",
      meals: "Repas",
      accommodation: "Hébergement",
      supplies: "Fournitures",
      other: "Autre",
    };
    return categories[category] || category;
  };

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notes de Frais</h1>
          <p className="text-muted-foreground mt-1">
            {expenses?.length || 0} notes de frais
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une note de frais</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <Label htmlFor="name">Titre *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="partner_id">Client ID *</Label>
                <Input
                  id="partner_id"
                  name="partner_id"
                  type="number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="expense_date">Date *</Label>
                <Input id="expense_date" name="expense_date" type="date" required />
              </div>
              <div>
                <Label htmlFor="amount">Montant (€) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select name="category" defaultValue="other">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="meals">Repas</SelectItem>
                    <SelectItem value="accommodation">Hébergement</SelectItem>
                    <SelectItem value="supplies">Fournitures</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createExpense.isPending}>
                  {createExpense.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les états" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les états</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="submitted">Soumise</SelectItem>
              <SelectItem value="approved">Approuvée</SelectItem>
              <SelectItem value="rejected">Rejetée</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{expense.name}</div>
                        {expense.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{expense.partner_id[1]}</div>
                  </TableCell>
                  <TableCell>
                    {new Date(expense.expense_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryLabel(expense.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {expense.amount.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </TableCell>
                  <TableCell>{getStateBadge(expense.state)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {expense.state === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmit(expense.id)}
                          disabled={submitExpense.isPending}
                        >
                          <Send className="mr-2 h-3 w-3" />
                          Soumettre
                        </Button>
                      )}
                      {expense.state === "submitted" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleApprove(expense.id)}
                            disabled={approveExpense.isPending}
                          >
                            <CheckCircle2 className="mr-2 h-3 w-3" />
                            Approuver
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-3 w-3" />
                                Rejeter
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeter la note de frais</DialogTitle>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  handleReject(
                                    expense.id,
                                    formData.get("reason") as string
                                  );
                                }}
                                className="space-y-4"
                              >
                                <div>
                                  <Label htmlFor="reason">Raison du rejet *</Label>
                                  <Textarea
                                    id="reason"
                                    name="reason"
                                    required
                                    rows={3}
                                    placeholder="Expliquez pourquoi cette note est rejetée..."
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="submit" variant="destructive">
                                    Rejeter
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      {expense.state === "rejected" && expense.rejection_reason && (
                        <div className="text-sm text-red-600">
                          {expense.rejection_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {expenses?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune note de frais</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {expenses && expenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">En attente</div>
              <div className="text-2xl font-bold text-orange-600">
                {expenses.filter((e) => e.state === "submitted").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Approuvées</div>
              <div className="text-2xl font-bold text-green-600">
                {expenses.filter((e) => e.state === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Montant Total</div>
              <div className="text-2xl font-bold">
                {expenses
                  .filter((e) => e.state === "approved")
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
