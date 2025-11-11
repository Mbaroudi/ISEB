"use client";

import { useBankProviders, useConnectProvider } from "@/lib/hooks/useBank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BankProvidersPage() {
  const { data: providers, isLoading } = useBankProviders();
  const connectProvider = useConnectProvider();
  const { toast } = useToast();

  const handleConnect = async (providerId: number) => {
    try {
      await connectProvider.mutateAsync({ providerId, partner_id: 1 });
      toast({ title: "Connexion initiée", description: "Suivez les instructions pour connecter votre banque." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de se connecter.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fournisseurs Bancaires</h1>
        <p className="text-muted-foreground mt-1">Connectez vos comptes bancaires via un fournisseur</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers?.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {provider.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">{provider.description}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium">{provider.api_type}</span>
              </div>
              {provider.supported_countries && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Pays: </span>
                  {provider.supported_countries.join(", ")}
                </div>
              )}
              <Button className="w-full" onClick={() => handleConnect(provider.id)} disabled={connectProvider.isPending}>
                <LinkIcon className="mr-2 h-4 w-4" />
                {connectProvider.isPending ? "Connexion..." : "Connecter"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
