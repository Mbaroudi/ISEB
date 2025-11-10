"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Shield,
  Bell,
  Filter,
  Plus,
  Eye,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Obligation {
  id: number;
  name: string;
  obligation_type_id: [number, string];
  partner_id: [number, string];
  due_date: string;
  state: string;
  alert_level: string;
  is_overdue: boolean;
  days_until_due: number;
  total_amount: number;
  priority: string;
}

interface RiskScore {
  score: number;
  level: string;
  color: number;
  statistics: {
    late_obligations_count: number;
    late_obligations_amount: number;
    total_penalties_amount: number;
    average_payment_delay: number;
    compliance_rate: number;
  };
}

interface Alerts {
  overdue: {
    count: number;
    total_amount: number;
    obligations: Obligation[];
  };
  urgent: {
    count: number;
    obligations: Obligation[];
  };
  upcoming: {
    count: number;
    total_amount: number;
    obligations: Obligation[];
  };
  statistics: {
    total_pending: number;
  };
}

export default function FiscalObligationsPage() {
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [selectedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load alerts
      const alertsResponse = await fetch("/api/fiscal/alerts");
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts);
      }

      // Load risk score
      const riskResponse = await fetch("/api/fiscal/risk-score");
      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRiskScore(riskData.risk_score);
      }

      // Load obligations with filter
      const obligationsUrl =
        selectedFilter === "all"
          ? "/api/fiscal/obligations"
          : `/api/fiscal/obligations?state=${selectedFilter}`;
      const obligationsResponse = await fetch(obligationsUrl);
      if (obligationsResponse.ok) {
        const obligationsData = await obligationsResponse.json();
        setObligations(obligationsData.obligations || []);
      }
    } catch (error) {
      console.error("Error loading fiscal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatAmount = (amount: number) => {
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
          <h1 className="text-3xl font-bold">Obligations Fiscales et Sociales</h1>
          <p className="text-muted-foreground">
            Gérez vos échéances fiscales et sociales en toute transparence
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/fiscal/delegations">
            <Button variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              Délégations
            </Button>
          </Link>
          <Link href="/fiscal/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Obligation
            </Button>
          </Link>
        </div>
      </div>

      {/* Risk Score Widget */}
      {riskScore && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Score de Risque Fiscal
              </span>
              <Badge className={getRiskLevelColor(riskScore.level)}>
                {riskScore.level === "low" && "Faible"}
                {riskScore.level === "medium" && "Moyen"}
                {riskScore.level === "high" && "Élevé"}
                {riskScore.level === "critical" && "Critique"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Score Display */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-4xl font-bold">{riskScore.score}/100</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Score de conformité fiscale
                  </p>
                </div>
                <Link href="/fiscal/risk-details">
                  <Button variant="ghost" size="sm">
                    Voir détails
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    riskScore.score >= 80
                      ? "bg-green-500"
                      : riskScore.score >= 60
                      ? "bg-yellow-500"
                      : riskScore.score >= 40
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${riskScore.score}%` }}
                ></div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {riskScore.statistics.late_obligations_count}
                  </div>
                  <div className="text-xs text-muted-foreground">En retard</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatAmount(riskScore.statistics.total_penalties_amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">Pénalités</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {riskScore.statistics.average_payment_delay.toFixed(1)}j
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Délai moyen
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {riskScore.statistics.compliance_rate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Conformité</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Summary */}
      {alerts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overdue */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                En Retard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {alerts.overdue.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatAmount(alerts.overdue.total_amount)} à payer
              </p>
              {alerts.overdue.count > 0 && (
                <Link href="/fiscal?filter=late">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-red-600"
                  >
                    Voir tout
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Urgent */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                Urgent (J-3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {alerts.urgent.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Échéances imminentes
              </p>
              {alerts.urgent.count > 0 && (
                <Link href="/fiscal?filter=todo">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-orange-600"
                  >
                    Voir tout
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                À Venir (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {alerts.upcoming.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatAmount(alerts.upcoming.total_amount)} estimé
              </p>
              <Link href="/fiscal?filter=todo">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full text-blue-600"
                >
                  Voir tout
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("all")}
            >
              Toutes
            </Button>
            <Button
              variant={selectedFilter === "todo" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("todo")}
            >
              À faire
            </Button>
            <Button
              variant={selectedFilter === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("in_progress")}
            >
              En cours
            </Button>
            <Button
              variant={selectedFilter === "waiting" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("waiting")}
            >
              En attente
            </Button>
            <Button
              variant={selectedFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("paid")}
            >
              Payées
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Obligations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Obligations
            </span>
            <Badge variant="secondary">{obligations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obligations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune obligation trouvée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {obligations.map((obligation) => (
                <div
                  key={obligation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Badge className={getAlertLevelColor(obligation.alert_level)}>
                        {obligation.alert_level}
                      </Badge>
                      <h4 className="font-medium truncate">{obligation.name}</h4>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(obligation.due_date)}
                      </span>
                      <span
                        className={`flex items-center ${
                          obligation.is_overdue
                            ? "text-red-600 font-medium"
                            : ""
                        }`}
                      >
                        {obligation.is_overdue ? (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Retard de {Math.abs(obligation.days_until_due)} jours
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            J-{obligation.days_until_due}
                          </>
                        )}
                      </span>
                      <span className="flex items-center">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {formatAmount(obligation.total_amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/fiscal/${obligation.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                    </Link>
                    {obligation.state !== "paid" && (
                      <Link href={`/fiscal/${obligation.id}/pay`}>
                        <Button size="sm">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer
                        </Button>
                      </Link>
                    )}
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
