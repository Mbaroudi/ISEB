"use client";

import { useBankAccount, useBankTransactions, useSyncLogs } from "@/lib/hooks/useBank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

export default function BankAccountDetailPage({ params }: { params: { id: string } }) {
  const accountId = parseInt(params.id);
  const { data: account, isLoading } = useBankAccount(accountId);
  const { data: transactions } = useBankTransactions({ account_id: accountId, limit: 10 });
  const { data: logs } = useSyncLogs(accountId);

  if (isLoading) return <div className="p-8">Chargement...</div>;
  if (!account) return <div className="p-8">Compte non trouvé</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            {account.name}
          </h1>
          {account.iban && <p className="text-muted-foreground mt-2 font-mono text-sm">{account.iban.match(/.{1,4}/g)?.join(" ")}</p>}
        </div>
        <Link href="/bank/accounts"><Button variant="outline">← Retour</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Solde</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{account.balance.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dernière Sync</CardTitle></CardHeader>
          <CardContent>
            {account.last_sync_date ? (
              <div className="text-sm">{new Date(account.last_sync_date).toLocaleString("fr-FR")}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Jamais synchronisé</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Statut</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={account.sync_status === "success" ? "default" : "destructive"} className={account.sync_status === "success" ? "bg-green-500" : ""}>
              {account.sync_status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Dernières Transactions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions?.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString("fr-FR")}</div>
                </div>
                <div className={`font-bold flex items-center gap-1 ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {t.amount >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(t.amount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </div>
              </div>
            ))}
          </div>
          <Link href="/bank/transactions"><Button variant="outline" className="w-full mt-4">Voir toutes les transactions</Button></Link>
        </CardContent>
      </Card>

      {logs && logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Historique Synchronisation</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex justify-between items-center text-sm p-2 border-b last:border-0">
                  <div>{new Date(log.sync_date).toLocaleString("fr-FR")}</div>
                  <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                  <div>+{log.transactions_created} créées</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
