"use client";

import { useState } from "react";
import {
  useBankTransactions,
  useReconcileTransaction,
  useBankAccounts,
} from "@/lib/hooks/useBank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { CheckCircle2, XCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BankTransactionsPage() {
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [reconciledFilter, setReconciledFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: accounts } = useBankAccounts();
  const { data: transactions, isLoading } = useBankTransactions({
    account_id: accountFilter ? parseInt(accountFilter) : undefined,
    reconciled: reconciledFilter ? reconciledFilter === "true" : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const reconcile = useReconcileTransaction();
  const { toast } = useToast();

  const handleAutoReconcile = async (transactionId: number) => {
    try {
      await reconcile.mutateAsync({
        transactionId,
        auto_reconcile: true,
      });
      toast({
        title: "Rapprochement effectué",
        description: "La transaction a été rapprochée automatiquement.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rapprocher la transaction.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions Bancaires</h1>
        <p className="text-muted-foreground mt-1">
          {transactions?.length || 0} transactions
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les comptes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les comptes</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={reconciledFilter} onValueChange={setReconciledFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut rapprochement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="true">Rapprochées</SelectItem>
                <SelectItem value="false">Non rapprochées</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Date début"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Date fin"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Transactions */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead>Partenaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.name}</div>
                      {transaction.description && (
                        <div className="text-sm text-muted-foreground">
                          {transaction.description}
                        </div>
                      )}
                      {transaction.reference && (
                        <div className="text-xs text-muted-foreground font-mono">
                          Réf: {transaction.reference}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{transaction.bank_account_id[1]}</div>
                  </TableCell>
                  <TableCell>
                    {transaction.partner_id ? (
                      <div className="text-sm">{transaction.partner_id[1]}</div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`font-medium flex items-center justify-end gap-1 ${
                        transaction.amount >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(transaction.amount).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.reconciled ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Rapprochée
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="mr-1 h-3 w-3" />
                        Non rapprochée
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!transaction.reconciled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAutoReconcile(transaction.id)}
                        disabled={reconcile.isPending}
                      >
                        Rapprocher
                      </Button>
                    )}
                    {transaction.move_id && (
                      <span className="text-xs text-muted-foreground">
                        Écriture: {transaction.move_id[1]}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {transactions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucune transaction trouvée</p>
              <p className="text-sm mt-2">
                Synchronisez vos comptes bancaires pour voir les transactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats rapides */}
      {transactions && transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Total Transactions
              </div>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Rapprochées</div>
              <div className="text-2xl font-bold text-green-600">
                {transactions.filter((t) => t.reconciled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Non rapprochées
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {transactions.filter((t) => !t.reconciled).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
