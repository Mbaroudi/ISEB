"use client";

import { useBankAccounts, useSyncAccount } from "@/lib/hooks/useBank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Building2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function BankAccountsPage() {
  const { data: accounts, isLoading } = useBankAccounts();
  const syncAccount = useSyncAccount();
  const { toast } = useToast();

  const handleSync = async (accountId: number) => {
    try {
      await syncAccount.mutateAsync(accountId);
      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation des transactions est en cours.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser le compte.",
        variant: "destructive",
      });
    }
  };

  const getSyncStatusBadge = (status: string) => {
    const configs = {
      success: {
        variant: "default" as const,
        className: "bg-green-500",
        icon: CheckCircle2,
        label: "Synchronisé",
      },
      pending: {
        variant: "default" as const,
        className: "bg-blue-500",
        icon: Clock,
        label: "En cours",
      },
      error: {
        variant: "destructive" as const,
        className: "",
        icon: AlertCircle,
        label: "Erreur",
      },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comptes Bancaires</h1>
          <p className="text-muted-foreground mt-1">
            {accounts?.length || 0} comptes configurés
          </p>
        </div>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Ajouter un compte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {account.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informations compte */}
              <div className="space-y-2 text-sm">
                {account.iban && (
                  <div>
                    <span className="text-muted-foreground">IBAN:</span>
                    <div className="font-mono text-xs mt-1">
                      {account.iban.match(/.{1,4}/g)?.join(" ")}
                    </div>
                  </div>
                )}
                {account.account_number && (
                  <div>
                    <span className="text-muted-foreground">Numéro:</span>
                    <div className="font-medium">{account.account_number}</div>
                  </div>
                )}
                {account.bank_id && (
                  <div>
                    <span className="text-muted-foreground">Banque:</span>
                    <div className="font-medium">{account.bank_id[1]}</div>
                  </div>
                )}
              </div>

              {/* Solde */}
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">Solde</div>
                <div className="text-2xl font-bold">
                  {account.balance.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              </div>

              {/* Statut sync */}
              <div className="flex items-center justify-between">
                {getSyncStatusBadge(account.sync_status)}
                {account.last_sync_date && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(account.last_sync_date).toLocaleString("fr-FR")}
                  </span>
                )}
              </div>

              {/* Provider */}
              {account.provider_id && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Provider:</span>
                  <div className="font-medium">{account.provider_id[1]}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSync(account.id)}
                  disabled={
                    syncAccount.isPending || account.sync_status === "pending"
                  }
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      account.sync_status === "pending" ? "animate-spin" : ""
                    }`}
                  />
                  Synchroniser
                </Button>
                <Link href={`/bank/accounts/${account.id}`}>
                  <Button variant="outline" size="sm">
                    Voir
                  </Button>
                </Link>
              </div>

              {!account.active && (
                <Badge variant="outline" className="w-full justify-center">
                  Compte inactif
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Aucun compte bancaire</h3>
            <p className="text-muted-foreground mb-4">
              Connectez votre premier compte bancaire pour commencer
            </p>
            <Button>
              <Building2 className="mr-2 h-4 w-4" />
              Ajouter un compte
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
