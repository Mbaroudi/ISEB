"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Pause,
  Ban,
  ArrowLeft,
  Calendar,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface Delegation {
  id: number;
  name: string;
  partner_id: [number, string];
  delegated_types: string[];
  start_date: string;
  end_date: string | false;
  is_active: boolean;
  is_expired: boolean;
  max_amount_per_payment: number;
  max_amount_per_month: number;
  payment_method: string;
  require_client_validation: boolean;
  validation_delay_hours: number;
  state: string;
  signed_by_client: boolean;
  signed_by_accountant: boolean;
  signature_date_client: string | false;
  signature_date_accountant: string | false;
}

const OBLIGATION_TYPE_LABELS: { [key: string]: string } = {
  tva: "TVA",
  urssaf: "URSSAF",
  is: "Impôt Société",
  ir: "Impôt Revenu",
  dsn: "DSN",
  cfe: "CFE",
  cvae: "CVAE",
  taxe_apprentissage: "Taxe Apprentissage",
  formation_professionnelle: "Formation Pro",
};

export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadDelegations();
  }, []);

  const loadDelegations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/fiscal/delegations");
      if (response.ok) {
        const data = await response.json();
        setDelegations(data.delegations || []);
      }
    } catch (error) {
      console.error("Error loading delegations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir suspendre cette délégation ?")) {
      return;
    }

    try {
      setActionLoading(id);
      const response = await fetch(`/api/fiscal/delegations/${id}/suspend`, {
        method: "POST",
      });

      if (response.ok) {
        await loadDelegations();
      } else {
        toast.error("Erreur lors de la suspension");
      }
    } catch (error) {
      console.error("Error suspending delegation:", error);
      toast.error("Erreur lors de la suspension");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id: number) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir révoquer cette délégation ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      setActionLoading(id);
      const response = await fetch(`/api/fiscal/delegations/${id}/revoke`, {
        method: "POST",
      });

      if (response.ok) {
        await loadDelegations();
      } else {
        toast.error("Erreur lors de la révocation");
      }
    } catch (error) {
      console.error("Error revoking delegation:", error);
      toast.error("Erreur lors de la révocation");
    } finally {
      setActionLoading(null);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "active":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "suspended":
        return "bg-orange-500 text-white";
      case "revoked":
        return "bg-red-500 text-white";
      case "expired":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case "active":
        return "Active";
      case "pending":
        return "En attente";
      case "draft":
        return "Brouillon";
      case "suspended":
        return "Suspendue";
      case "revoked":
        return "Révoquée";
      case "expired":
        return "Expirée";
      default:
        return state;
    }
  };

  const formatDate = (dateString: string | false) => {
    if (!dateString) return "Illimitée";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return "Illimité";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/fiscal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="w-8 h-8 mr-3" />
            Délégations de Paiement
          </h1>
          <p className="text-muted-foreground mt-1">
            Autorisez votre comptable à payer en votre nom
          </p>
        </div>
        <Link href="/fiscal/delegations/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Délégation
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">
                Qu'est-ce qu'une délégation de paiement ?
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Une délégation permet à votre cabinet comptable de payer vos
                obligations fiscales et sociales en votre nom, dans les limites
                que vous définissez. Cela permet d'éviter les retards et les
                pénalités.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {delegations.filter((d) => d.state === "active").length}
            </div>
            <div className="text-xs text-muted-foreground">Actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {delegations.filter((d) => d.state === "pending").length}
            </div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {delegations.filter((d) => d.state === "suspended").length}
            </div>
            <div className="text-xs text-muted-foreground">Suspendues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {delegations.filter((d) => d.is_expired).length}
            </div>
            <div className="text-xs text-muted-foreground">Expirées</div>
          </CardContent>
        </Card>
      </div>

      {/* Delegations List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Délégations</CardTitle>
        </CardHeader>
        <CardContent>
          {delegations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune délégation configurée</p>
              <Link href="/fiscal/delegations/new">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une délégation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {delegations.map((delegation) => (
                <div
                  key={delegation.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getStateColor(delegation.state)}>
                          {getStateLabel(delegation.state)}
                        </Badge>
                        {delegation.is_active && (
                          <Badge variant="outline" className="border-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {delegation.is_expired && (
                          <Badge variant="outline" className="border-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Expirée
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium mb-2">{delegation.name}</h4>

                      {/* Delegated Types */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {delegation.delegated_types.map((type) => (
                          <Badge key={type} variant="secondary">
                            {OBLIGATION_TYPE_LABELS[type] || type}
                          </Badge>
                        ))}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Date de début
                          </div>
                          <div className="font-medium flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(delegation.start_date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Date de fin
                          </div>
                          <div className="font-medium flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(delegation.end_date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Limite par paiement
                          </div>
                          <div className="font-medium flex items-center mt-1">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {formatAmount(delegation.max_amount_per_payment)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Limite mensuelle
                          </div>
                          <div className="font-medium flex items-center mt-1">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {formatAmount(delegation.max_amount_per_month)}
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex gap-4 mt-3 text-xs">
                        <div
                          className={
                            delegation.signed_by_client
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {delegation.signed_by_client ? (
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 inline mr-1" />
                          )}
                          Client{" "}
                          {delegation.signed_by_client && delegation.signature_date_client
                            ? `(${formatDate(delegation.signature_date_client)})`
                            : ""}
                        </div>
                        <div
                          className={
                            delegation.signed_by_accountant
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {delegation.signed_by_accountant ? (
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 inline mr-1" />
                          )}
                          Comptable{" "}
                          {delegation.signed_by_accountant &&
                          delegation.signature_date_accountant
                            ? `(${formatDate(delegation.signature_date_accountant)})`
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/fiscal/delegations/${delegation.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {delegation.state === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspend(delegation.id)}
                            disabled={actionLoading === delegation.id}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevoke(delegation.id)}
                            disabled={actionLoading === delegation.id}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
