"use client";

import { useState } from "react";
import {
  useEInvoices,
  useSendEInvoice,
  useValidateEInvoice,
  useEInvoiceFormats,
} from "@/lib/hooks/useEInvoicing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function EInvoicingPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useEInvoices({
    einvoicing_status: statusFilter || undefined,
  });

  const { data: formats } = useEInvoiceFormats();
  const sendEInvoice = useSendEInvoice();
  const validateEInvoice = useValidateEInvoice();

  const handleSend = async (invoiceId: number, formatId?: number) => {
    try {
      await sendEInvoice.mutateAsync({ invoiceId, format_id: formatId });
      toast({
        title: "Facture envoyée",
        description: "La facture a été envoyée à Chorus Pro.",
      });
      setSelectedInvoice(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la facture.",
        variant: "destructive",
      });
    }
  };

  const handleValidate = async (invoiceId: number) => {
    try {
      const result = await validateEInvoice.mutateAsync({ invoiceId });
      toast({
        title: "Validation effectuée",
        description: result.validation
          ? "La facture est conforme."
          : "La facture n'est pas conforme.",
        variant: result.validation ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider la facture.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      draft: { variant: "outline" as const, label: "Brouillon", icon: FileText },
      pending: { variant: "default" as const, label: "En attente", icon: Clock },
      sent: {
        variant: "default" as const,
        className: "bg-green-500",
        label: "Envoyée",
        icon: CheckCircle2,
      },
      error: {
        variant: "destructive" as const,
        label: "Erreur",
        icon: AlertCircle,
      },
    };

    const config = configs[status as keyof typeof configs] || configs.draft;
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
          <h1 className="text-3xl font-bold">Facturation Électronique</h1>
          <p className="text-muted-foreground mt-1">
            {invoices?.length || 0} factures • Conformité 2026
          </p>
        </div>
        <Link href="/einvoicing/config">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </Button>
        </Link>
      </div>

      {/* Info Conformité 2026 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900">
                Obligation de facturation électronique B2B
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                À partir du 1er septembre 2026, toutes les entreprises devront être
                capables de recevoir des factures électroniques. L'émission sera
                obligatoire selon le calendrier suivant : grandes entreprises (2026),
                ETI (2027), PME/TPE (2027).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table Factures */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Statut E-Invoicing</TableHead>
                <TableHead>Date Envoi</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.name}</TableCell>
                  <TableCell>{invoice.partner_id[1]}</TableCell>
                  <TableCell>
                    {new Date(invoice.invoice_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {invoice.amount_total.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </TableCell>
                  <TableCell>
                    {invoice.einvoicing_format_id ? (
                      <Badge variant="outline">
                        {invoice.einvoicing_format_id[1]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.einvoicing_status)}</TableCell>
                  <TableCell>
                    {invoice.einvoicing_sent_date ? (
                      new Date(invoice.einvoicing_sent_date).toLocaleDateString(
                        "fr-FR"
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.state === "posted" &&
                        invoice.einvoicing_status !== "sent" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleValidate(invoice.id)}
                              disabled={validateEInvoice.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-3 w-3" />
                              Valider
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice.id)}
                                >
                                  <Send className="mr-2 h-3 w-3" />
                                  Envoyer
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Envoyer à Chorus Pro</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Facture: <strong>{invoice.name}</strong>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Client: {invoice.partner_id[1]}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Montant:{" "}
                                      {invoice.amount_total.toLocaleString("fr-FR", {
                                        style: "currency",
                                        currency: "EUR",
                                      })}
                                    </p>
                                  </div>

                                  <div>
                                    <Label>Format</Label>
                                    <Select defaultValue="">
                                      <SelectTrigger>
                                        <SelectValue placeholder="Format par défaut" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">
                                          Format par défaut
                                        </SelectItem>
                                        {formats?.map((format) => (
                                          <SelectItem
                                            key={format.id}
                                            value={format.id.toString()}
                                          >
                                            {format.name} ({format.code})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setSelectedInvoice(null)}
                                    >
                                      Annuler
                                    </Button>
                                    <Button
                                      onClick={() => handleSend(invoice.id)}
                                      disabled={sendEInvoice.isPending}
                                    >
                                      {sendEInvoice.isPending
                                        ? "Envoi..."
                                        : "Envoyer"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      {invoice.einvoicing_error && (
                        <div className="text-xs text-red-600 max-w-xs">
                          {invoice.einvoicing_error}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {invoices?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {invoices && invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Factures</div>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Envoyées</div>
              <div className="text-2xl font-bold text-green-600">
                {invoices.filter((i) => i.einvoicing_status === "sent").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">En attente</div>
              <div className="text-2xl font-bold text-orange-600">
                {
                  invoices.filter(
                    (i) =>
                      i.einvoicing_status === "draft" ||
                      i.einvoicing_status === "pending"
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Erreurs</div>
              <div className="text-2xl font-bold text-red-600">
                {invoices.filter((i) => i.einvoicing_status === "error").length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
