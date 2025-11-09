"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  Loader2,
} from "lucide-react";
import QuestionCard from "@/components/collaboration/QuestionCard";
import Link from "next/link";

interface DashboardStats {
  totalPending: number;
  totalAnswered: number;
  totalResolved: number;
  totalClosed: number;
  myQuestions: number;
  assignedToMe: number;
  urgentQuestions: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  resolvedThisMonth: number;
}

interface Question {
  id: number;
  name: string;
  question_type: string;
  state: string;
  priority: string;
  user_id: [number, string];
  assigned_to_id?: [number, string];
  message_count: number;
  create_date: string;
}

interface QuestionTypeData {
  question_type: string;
}

export default function CollaborationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Question[]>([]);
  const [needsAttention, setNeedsAttention] = useState<Question[]>([]);
  const [questionsByType, setQuestionsByType] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/collaboration/dashboard");

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques");
      }

      const data = await response.json();

      setStats(data.stats);
      setRecentActivity(data.recentActivity || []);
      setNeedsAttention(data.needsAttention || []);

      // Process questions by type
      const typeCount: Record<string, number> = {};
      data.questionsByType?.forEach((item: QuestionTypeData) => {
        const type = item.question_type || "general";
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      setQuestionsByType(typeCount);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const QUESTION_TYPE_LABELS: Record<string, string> = {
    missing_document: "Document manquant",
    line_clarification: "Clarification ligne",
    bank_statement: "Relevé bancaire",
    vat_question: "Question TVA",
    correction_request: "Demande de correction",
    general: "Question générale",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Collaboration
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Vue d'ensemble de vos questions et échanges
              </p>
            </div>
            <button
              onClick={() => router.push("/questions")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouvelle question
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* En attente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalPending}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Link
              href="/questions?state=pending"
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir les questions →
            </Link>
          </div>

          {/* Répondues */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Répondu</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalAnswered}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Link
              href="/questions?state=answered"
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Voir les questions →
            </Link>
          </div>

          {/* Résolues */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Résolu</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalResolved}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Link
              href="/questions?state=resolved"
              className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Voir les questions →
            </Link>
          </div>

          {/* Urgentes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.urgentQuestions}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            {stats.urgentQuestions > 0 && (
              <p className="mt-4 text-sm text-red-600 font-medium">
                Nécessite une attention immédiate
              </p>
            )}
          </div>
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Temps de réponse</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.avgResponseTime.toFixed(1)}h
            </p>
            <p className="text-sm text-gray-500 mt-1">Moyenne ce mois</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Temps de résolution</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.avgResolutionTime.toFixed(1)}h
            </p>
            <p className="text-sm text-gray-500 mt-1">Moyenne ce mois</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Questions résolues</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.resolvedThisMonth}
            </p>
            <p className="text-sm text-gray-500 mt-1">Ce mois</p>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Questions by type & needs attention */}
          <div className="space-y-6">
            {/* Questions by type */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Par type (ce mois)</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(questionsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {QUESTION_TYPE_LABELS[type] || type}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
                {Object.keys(questionsByType).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune question ce mois
                  </p>
                )}
              </div>
            </div>

            {/* Needs attention */}
            {needsAttention.length > 0 && (
              <div className="bg-white rounded-lg border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-gray-900">
                    Nécessite attention
                  </h3>
                </div>
                <div className="space-y-3">
                  {needsAttention.map((question) => (
                    <Link
                      key={question.id}
                      href={`/questions/${question.id}`}
                      className="block p-3 bg-red-50 rounded border border-red-100 hover:border-red-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {question.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {question.user_id[1]}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Recent activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Activité récente</h3>
                </div>
                <Link
                  href="/questions"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir toutes →
                </Link>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/questions?myQuestions=true"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Mes questions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.myQuestions}</p>
            <p className="text-sm text-gray-500 mt-2">
              Questions que j'ai créées
            </p>
          </Link>

          <Link
            href="/questions?assignedToMe=true"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Assignées à moi</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.assignedToMe}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Questions dont je suis responsable
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
